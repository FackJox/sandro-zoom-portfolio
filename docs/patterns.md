# Critical Patterns

Essential patterns to follow for reliable, maintainable scrollytelling.

## The Golden Rule: gsap.context()

**Every animation must be wrapped in `gsap.context()`.**

This is non-negotiable. Without it:
- Memory leaks on component unmount
- Ghost animations on HMR
- Conflicting ScrollTriggers
- Unpredictable behavior

### Correct Pattern

```typescript
let ctx: gsap.Context

$effect(() => {
  if (!container) return

  ctx = gsap.context(() => {
    // All animations scoped to container
    gsap.to('.element', { x: 100 })
    ScrollTrigger.create({ trigger: '.section', ... })
    gsap.timeline()
      .to('.a', { opacity: 1 })
      .to('.b', { y: 50 })
  }, container)  // Scope selector

  return () => ctx.revert()  // Single cleanup
})
```

### Why It Works

1. `gsap.context()` records all animations/triggers created inside
2. Scope selector (second arg) limits queries to container
3. `ctx.revert()` kills ALL recorded animations
4. No manual tracking of individual tweens/triggers

### Common Mistakes

```typescript
// WRONG - No context
$effect(() => {
  gsap.to('.element', { x: 100 })  // Leaks!
})

// WRONG - Missing cleanup
$effect(() => {
  const ctx = gsap.context(() => {
    gsap.to('.element', { x: 100 })
  }, container)
  // No return cleanup!
})

// WRONG - Cleanup without context
$effect(() => {
  const tl = gsap.timeline()
  tl.to('.element', { x: 100 })
  return () => tl.kill()  // Doesn't catch ScrollTriggers!
})
```

---

## Singleton Pattern

### ScrollSmoother

Only ONE ScrollSmoother instance should exist:

```typescript
// core/scroll.ts
let smoother: ScrollSmoother | null = null

export function getScrollSmoother(config?): ScrollSmoother {
  if (smoother) return smoother  // Return existing
  smoother = ScrollSmoother.create({ ... })
  return smoother
}

export function killScrollSmoother(): void {
  smoother?.kill()
  smoother = null
}
```

**Usage:**
```typescript
// First call creates
const smoother = getScrollSmoother()

// Subsequent calls return same instance
const sameSmoother = getScrollSmoother()

// Cleanup on destroy
killScrollSmoother()
```

### GSAP Registration

Plugins must register exactly once:

```typescript
// core/register.ts
let registered = false

export function initGSAP(): void {
  if (registered) return  // Guard
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ...)
  registered = true
}

// HMR reset
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    registered = false
  })
}
```

---

## autoAlpha Pattern

Use `autoAlpha` instead of `opacity` for visibility.

### Why autoAlpha?

| Property | opacity=0 | autoAlpha=0 |
|----------|-----------|-------------|
| Visible | No | No |
| Takes space | Yes | Yes |
| Receives events | Yes | No |
| Screen reader | Announced | Skipped |
| CSS | `opacity: 0` | `opacity: 0; visibility: hidden` |

### Implementation

```typescript
// Initialize content as hidden
config.content?.forEach(content => {
  const el = container.querySelector(`[data-content="${content.id}"]`)
  if (el) {
    gsap.set(el, { autoAlpha: 0 })  // Hidden + inaccessible
  }
})

// fadeIn uses autoAlpha internally
{ target: 'headline', action: 'fadeIn', at: 0.5 }
```

### Benefits

1. **GSAP always finds targets** - Elements exist in DOM at all times
2. **No FOUC** - Content hidden before animation starts
3. **Accessibility** - `visibility: hidden` = screen reader skip
4. **Smooth transitions** - Opacity animates, visibility toggles at thresholds

---

## Cleanup Order

When destroying scroll containers, order matters:

```typescript
onDestroy(() => {
  // 1. Stop observers (prevent new events)
  resizeObserver?.disconnect()

  // 2. Kill delayed calls (prevent pending callbacks)
  delayedCall?.kill()

  // 3. Revert context (kills all timelines + ScrollTriggers)
  ctx?.revert()

  // 4. Kill any stray ScrollTriggers
  ScrollTrigger.getAll().forEach(t => t.kill())

  // 5. Kill ScrollSmoother singleton
  killScrollSmoother()

  // 6. Revert SplitText instances
  revertAllSplits()

  // 7. Reset global state
  resetGlobalScrollState()
})
```

**Why this order?**
- Observers might trigger state changes → stop first
- Delayed calls might create new animations → kill second
- Context revert kills most things → do before manual cleanup
- ScrollSmoother depends on content → kill after context
- State reset last → everything else is cleaned up

---

## Time-Based Positioning

Author in seconds, not scroll percentages.

### Configuration

```typescript
// All timing in seconds
{ target: 'title', at: 2.5, duration: 0.8 }
{ target: 'subtitle', at: '+=0.2' }        // Relative
{ target: 'cta', at: 'title+0.3' }         // Label offset
```

### Conversion

```typescript
// Happens internally
function timeToScroll(seconds: number): number {
  return seconds / totalDuration  // e.g., 2.5 / 60 = 0.0417
}
```

### Benefits

- Intuitive authoring (think in seconds)
- Easy to adjust pacing (change totalDuration)
- Relative positioning (`+=`, `-=`, labels)
- Decoupled from scroll mechanics

---

## Mobile Variant Merging

Use reactive merging for mobile overrides.

### Pattern

```typescript
// Detect mobile
let isMobile = $state(false)

$effect(() => {
  if (typeof window === 'undefined') return

  const mql = window.matchMedia('(orientation: portrait) and (pointer: coarse)')
  isMobile = mql.matches

  const handler = (e: MediaQueryListEvent) => {
    isMobile = e.matches
  }

  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
})

// Merge overrides reactively
const effectiveConfig = $derived.by(() => {
  if (isMobile && config.mobile) {
    return {
      ...config,
      ...config.mobile,
      layers: config.mobile.layers ?? config.layers,
      content: config.mobile.content ?? config.content,
      animations: config.mobile.animations ?? config.animations
    }
  }
  return config
})
```

### Section Config

```typescript
const section: SectionConfig = {
  id: 'hero',
  layers: [...],
  content: [...],
  animations: [...],

  // Mobile overrides
  mobile: {
    content: [
      {
        id: 'headline',
        position: { preset: 'center-top' },  // Different position
        props: { size: 'compact' }
      }
    ],
    animations: [
      // Simplified animations
      { target: 'headline', action: 'fadeIn', at: 0 }
    ]
  }
}
```

---

## HMR-Safe Imports

Import GSAP plugins from dist to avoid casing issues.

### Pattern

```typescript
// CORRECT - From dist
import { Observer } from 'gsap/dist/Observer'
import { Flip } from 'gsap/dist/Flip'
import { SplitText } from 'gsap/dist/SplitText'

// WRONG - May cause HMR issues
import { Observer } from 'gsap/Observer'
```

### HMR State Persistence

```typescript
import { storeHMRState, getHMRState } from '$lib/dev/hmr'

// Store state before reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    storeHMRState('scrollProgress', currentProgress)
  })
}

// Restore after reload
onMount(() => {
  const savedProgress = getHMRState('scrollProgress')
  if (savedProgress !== undefined) {
    scrollTo(savedProgress)
  }
})
```

---

## Guard Patterns

Always guard before accessing DOM or browser APIs.

### Element Guards

```typescript
$effect(() => {
  if (!container) return  // Guard

  ctx = gsap.context(() => {
    // Safe to use container here
  }, container)

  return () => ctx?.revert()
})
```

### Browser API Guards

```typescript
export function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop'  // SSR guard

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}
```

### Optional Chaining for Cleanup

```typescript
onDestroy(() => {
  resizeObserver?.disconnect()  // Safe if undefined
  ctx?.revert()
  smoother?.kill()
})
```

---

## SplitText Cleanup

Always track and revert SplitText instances.

### Pattern

```typescript
// Track instances globally
const splitTextInstances: SplitText[] = []

export function textReveal(target, props, timeline): void {
  const split = new SplitText(target, { type: props.type })
  splitTextInstances.push(split)  // Track

  timeline.from(split.chars, { ... })
}

// Cleanup function
export function revertAllSplits(): void {
  splitTextInstances.forEach(split => split.revert())
  splitTextInstances.length = 0
}
```

### In ScrollContainer

```typescript
onDestroy(() => {
  // ... other cleanup
  revertAllSplits()  // Restore original text
})
```

---

## Avoiding Common Pitfalls

### Timeline Mutation

**Don't mutate timelines after creation.**

```typescript
// WRONG - Mutating
const tl = gsap.timeline()
tl.to('.a', { x: 100 })

// Later...
tl.to('.b', { y: 50 })  // Unpredictable!

// CORRECT - Rebuild fresh
function buildTimeline() {
  return gsap.timeline()
    .to('.a', { x: 100 })
    .to('.b', { y: 50 })
}
```

### Fixed Positioning in Scroll Wrapper

**Don't use `position: fixed` inside scroll content.**

```css
/* WRONG - Breaks ScrollSmoother */
.modal {
  position: fixed;
  /* ... */
}

/* CORRECT - Use ScrollTrigger pinning */
ScrollTrigger.create({
  trigger: '.section',
  pin: true
})
```

### Percentage-Based ScrollTrigger

**Use `invalidateOnRefresh: true` for percentage values.**

```typescript
// Set as default (done in register.ts)
ScrollTrigger.defaults({
  invalidateOnRefresh: true
})

// Or per-trigger
ScrollTrigger.create({
  start: '50% center',
  invalidateOnRefresh: true  // Recalculates on resize
})
```

### Animating Unmounted Elements

**Elements must exist before animating.**

```typescript
// WRONG - Element might not exist
gsap.to('#dynamic-element', { x: 100 })

// CORRECT - Guard or use onMount
$effect(() => {
  const el = container.querySelector('#dynamic-element')
  if (!el) return  // Guard

  gsap.to(el, { x: 100 })
})
```

---

## Performance Patterns

### Tier-Based Feature Degradation

```typescript
const capabilities = detectCapabilities()

// Skip complex features on low-tier devices
if (capabilities.tier === 'low') {
  // Use static images instead of video
  // Skip parallax
  // Simplify animations
}

// In config
{
  performanceTier: 'high'  // Only render on high-tier
}
```

### Lazy Derived Values

```typescript
// CORRECT - Lazy calculation
const dataSpeed = $derived.by(() => {
  if (layer.parallax === true) {
    return calculateParallaxSpeed(layer.z ?? 50)
  }
  return layer.speed
})

// WRONG - Eager calculation every render
const dataSpeed = calculateParallaxSpeed(layer.z ?? 50)
```

### Debounced Resize Handling

```typescript
let resizeTimeout: number

function handleResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    ScrollTrigger.refresh()
  }, 100)  // Debounce 100ms
}

window.addEventListener('resize', handleResize)
```

---

## Checklist

Before shipping:

- [ ] All animations wrapped in `gsap.context()`
- [ ] Cleanup returns `ctx.revert()`
- [ ] ScrollSmoother used as singleton
- [ ] SplitText instances tracked and reverted
- [ ] Guards for DOM/browser APIs
- [ ] Mobile variants defined where needed
- [ ] Performance tiers considered
- [ ] No timeline mutation after creation
- [ ] No `position: fixed` in scroll content
- [ ] `invalidateOnRefresh: true` for percentage triggers

## Next Steps

- [API Reference](./api-reference.md) - Complete function reference
- [Core Systems](./core-systems.md) - Implementation details
- [Architecture](./architecture.md) - System overview
