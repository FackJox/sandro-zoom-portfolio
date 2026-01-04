# svelte-scrollytelling

Production-ready SvelteKit + GSAP scrollytelling boilerplate with time-based animation authoring.

## Quick Reference

### Core Concepts

| Concept | Description |
|---------|-------------|
| Time-based authoring | Animations defined in seconds, converted to scroll internally |
| 3-tier layers | Background (z=0), midground (z=50), foreground (z=100) |
| autoAlpha pattern | Content hidden with `autoAlpha: 0`, revealed by animation |
| gsap.context() | ALL animations must be wrapped for proper cleanup |
| Singleton pattern | One ScrollSmoother instance, one GSAP registration |

### Animation Primitives (22+)

| Category | Actions |
|----------|---------|
| Opacity | `fadeIn`, `fadeOut`, `crossfade` |
| Position | `slideIn`, `slideOut`, `pan` |
| Scale | `zoom`, `scaleIn`, `scaleOut` |
| Transform | `transform`, `rotate`, `flip` |
| Parallax | `parallax`, `parallaxLayer` |
| Stagger | `stagger`, `staggerFadeIn`, `staggerSlideIn`, `staggerScaleIn` |
| Text | `textReveal`, `scrambleText`, `typewriter`, `textWave`, `textBlurReveal` |
| SVG | `drawSVG`, `morph`, `motionPath` |
| Physics | `inertia`, `followThrough`, `bounce`, `wiggle`, `spring`, `gravityDrop` |
| Mask | `mask`, `circleReveal`, `wipeReveal`, `insetReveal` |
| Dimension | `dimension`, `recede`, `approach`, `layeredDepth`, `flip3D` |
| Combined | `combined`, `sequence`, `parallel`, `keyframes` |
| GSAP | `gsap`, `gsapFromTo`, `gsapSet`, `gsapCall`, `gsapLabel` |

### Position Presets

```
center, center-top, center-bottom
left-center, right-center
top-left, top-right, bottom-left, bottom-right
golden-left, golden-right, golden-top, golden-bottom
thirds-intersect-tl, thirds-intersect-tr, thirds-intersect-bl, thirds-intersect-br
```

## Project Structure

```
src/lib/
├── core/                    # GSAP setup, timing, experience management
│   ├── register.ts          # Plugin registration (singleton)
│   ├── scroll.ts            # ScrollSmoother singleton
│   ├── timeline.ts          # Timeline factory with gsap.context
│   ├── timing.ts            # Time↔scroll conversion
│   ├── experience.ts        # Desktop/mobile switching
│   ├── accessibility.ts     # Reduced motion support
│   ├── capabilities.ts      # Device tier detection
│   └── input.ts             # Observer-based input handling
│
├── animation/
│   ├── primitives/          # Animation factory functions
│   │   ├── fade.ts          # fadeIn, fadeOut, crossfade
│   │   ├── slide.ts         # slideIn, slideOut, pan
│   │   ├── zoom.ts          # zoom, scaleIn, scaleOut
│   │   ├── parallax.ts      # parallax, parallaxLayer
│   │   ├── transform.ts     # transform, rotate, flip
│   │   ├── stagger.ts       # staggered animations
│   │   ├── text.ts          # textReveal, scrambleText, typewriter
│   │   ├── draw-svg.ts      # drawSVG
│   │   ├── morph.ts         # morph (MorphSVGPlugin)
│   │   ├── motion-path.ts   # motionPath
│   │   ├── physics.ts       # followThrough, inertia, bounce, wiggle
│   │   ├── mask.ts          # mask, circleReveal, wipeReveal
│   │   ├── dimension.ts     # dimension, recede, approach
│   │   ├── combined.ts      # combined, sequence, parallel
│   │   └── index.ts         # Barrel exports
│   ├── easing.ts            # CustomEase, brand easings
│   ├── composer.ts          # Build timelines from config
│   ├── flip.ts              # Flip plugin wrapper
│   └── gsap-passthrough.ts  # Raw GSAP keyframes
│
├── layers/
│   ├── Layer.svelte         # Single layer (image/video/3D)
│   ├── LayerGroup.svelte    # Grouped layers for coordination
│   ├── LayerStack.svelte    # All layers with z-ordering
│   └── types.ts             # Layer type definitions
│
├── content/
│   ├── Content.svelte       # Positioned content wrapper
│   ├── ContentSlot.svelte   # Component slot with positioning
│   └── scroll-state.ts      # Reactive scroll state
│
├── responsive/
│   ├── frame.ts             # Reference frame scaling
│   ├── regions.ts           # Semantic grid regions
│   ├── safe-zones.ts        # Device safe areas
│   ├── fluid.ts             # Utopia-style fluid sizing
│   └── presets.ts           # Position presets
│
├── components/
│   ├── ScrollContainer.svelte  # Root scroll wrapper
│   ├── Stage.svelte            # Pinned viewport
│   └── Section.svelte          # Section with timeline
│
├── integrations/
│   └── threlte.ts           # Three.js/Threlte bridge
│
├── dev/
│   ├── Debugger.svelte      # Timeline scrubber, layer toggles
│   ├── GSDevTools.svelte    # GSAP inspector
│   ├── hmr.ts               # HMR-safe cleanup utilities
│   └── validation.ts        # Config validation
│
├── types/
│   └── index.ts             # All TypeScript interfaces
│
└── index.ts                 # Public API exports
```

## Critical Patterns

### 1. gsap.context() - THE GOLDEN RULE

**EVERY animation must be wrapped in `gsap.context()`. This is non-negotiable.**

```typescript
let ctx: gsap.Context

$effect(() => {
  if (!container) return

  ctx = gsap.context(() => {
    gsap.to('.element', { x: 100 })
    ScrollTrigger.create({ trigger: '.section', ... })
  }, container)

  return () => ctx.revert()
})
```

**Why:** `ctx.revert()` kills ALL animations created in the context. Without it, animations persist after component unmount causing memory leaks and ghost animations on HMR.

### 2. GSAP Plugin Registration (Singleton)

```typescript
// src/lib/core/register.ts
let registered = false

export function initGSAP() {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, /* ... */)
  registered = true
}
```

### 3. ScrollSmoother Singleton

```typescript
// src/lib/core/scroll.ts
let smoother: ScrollSmoother | null = null

export function getScrollSmoother(config?) {
  if (smoother) return smoother
  smoother = ScrollSmoother.create({ ... })
  return smoother
}

export function killScrollSmoother() {
  smoother?.kill()
  smoother = null
}
```

### 4. Time-Based Positioning

All animation timing is in seconds, converted to scroll proportions:

```typescript
// Config uses seconds
{ target: 'title', at: 2.5, duration: 0.8 }
{ target: 'subtitle', at: '+=0.2' }        // Relative
{ target: 'cta', at: 'titleEnd+0.3' }      // Label offset

// Internal conversion
function timeToScroll(seconds: number): number {
  return seconds / totalDuration
}
```

### 5. autoAlpha Pattern

Content is mounted immediately but hidden with `autoAlpha: 0`:

```typescript
// Content starts hidden
gsap.set(element, { autoAlpha: 0 })

// Animation reveals at correct time
gsap.to(element, { autoAlpha: 1, ... }, timeToScroll(config.at))
```

**Benefits:** GSAP always finds targets. No FOUC. Proper accessibility (`visibility: hidden`).

### 6. Cleanup Order

```typescript
onDestroy(() => {
  // 1. Stop observers
  resizeObserver?.disconnect()
  // 2. Kill delayed calls
  delayedCall?.kill()
  // 3. Revert context (kills all timelines)
  ctx?.revert()
  // 4. Kill ScrollTriggers
  ScrollTrigger.getAll().forEach(t => t.kill())
  // 5. Kill ScrollSmoother
  killScrollSmoother()
  // 6. Revert SplitText
  revertAllSplits()
  // 7. Reset state
  resetGlobalScrollState()
})
```

## Section Configuration

```typescript
const section: SectionConfig = {
  id: 'hero',
  title: 'Hero Section',

  layers: [
    { id: 'bg', src: '/bg.jpg', z: 0, parallax: { speed: 0.5 } },
    { id: 'subject', src: '/subject.png', z: 50 },
    { id: 'fg', src: '/fg.png', z: 100, parallax: { speed: 1.3 } }
  ],

  content: [
    {
      id: 'headline',
      component: Headline,
      props: { text: 'Welcome' },
      position: { preset: 'center' },
      at: 0
    }
  ],

  animations: [
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },
    { target: 'subject', action: 'slideIn', direction: 'up', at: 0.3 },
    { target: 'headline', action: 'fadeIn', duration: 0.6, at: 0.5 },
    { target: 'headline', action: 'textReveal', type: 'words', at: 0.5 }
  ],

  // Mobile overrides (merged when detected)
  mobile: {
    content: [{
      id: 'headline',
      position: { preset: 'center-top' },
      props: { text: 'Welcome', size: 'compact' }
    }]
  }
}
```

## Layer Configuration

### Image/Video Layer

```typescript
{
  id: 'background',
  src: '/images/bg.jpg',
  type: 'image',           // 'image' | 'video'
  alt: 'Background',
  z: 0,                    // Z-index (0=back, 100=front)
  parallax: { speed: 0.5, axis: 'y' },
  speed: 0.5,              // Shorthand for parallax.speed
  lag: 0.2                 // Following delay
}
```

### 3D Layer (Threlte)

```typescript
{
  id: 'scene',
  type: '3d',
  component: Scene3D,
  props: { quality: 'high' },
  scrollSync: true,        // Inject scrollProgress prop
  interactive: 'objects',  // false | 'objects' | true
  performanceTier: 'high',
  fallback: { src: '/static.jpg', alt: 'Fallback' },
  z: 50
}
```

### Layer Group

```typescript
{
  id: 'mountains',
  type: 'group',
  children: [
    { id: 'far', src: '/m3.png', z: 10, parallax: { speed: 0.3 } },
    { id: 'mid', src: '/m2.png', z: 20, parallax: { speed: 0.5 } },
    { id: 'near', src: '/m1.png', z: 30, parallax: { speed: 0.7 } }
  ],
  z: 0
}
```

## Animation Examples

### Basic Animations

```typescript
// Fade
{ target: 'el', action: 'fadeIn', duration: 0.5, at: 0 }

// Slide
{ target: 'el', action: 'slideIn', direction: 'up', distance: 100, at: 0 }

// Zoom
{ target: 'el', action: 'zoom', scale: 1.5, duration: 1, at: 0 }

// Parallax
{ target: 'bg', action: 'parallax', speed: 0.5, axis: 'y' }
```

### Text Animations

```typescript
// Character reveal
{ target: 'title', action: 'textReveal', type: 'chars', stagger: 0.03, at: 0 }

// Word reveal
{ target: 'text', action: 'textReveal', type: 'words', direction: 'up', at: 0 }

// Scramble text
{ target: 'code', action: 'scrambleText', text: 'Final', chars: 'upperCase' }
```

### SVG Animations

```typescript
// Draw stroke
{ target: 'path', action: 'drawSVG', from: '0%', to: '100%', duration: 2 }

// Morph shape
{ target: '#shape1', action: 'morph', to: '#shape2', duration: 1 }

// Follow path
{ target: 'icon', action: 'motionPath', path: '#curve', autoRotate: true }
```

### Physics Animations

```typescript
// Bounce
{ target: 'ball', action: 'bounce', y: -200, bounces: 3, squash: 0.3 }

// Wiggle
{ target: 'bell', action: 'wiggle', amplitude: 10, frequency: 5, axis: 'x' }

// Follow through
{ target: 'el', action: 'followThrough', type: 'settle', strength: 0.5 }
```

### Combined Animations

```typescript
// Multiple animations on same target
{
  target: 'el',
  action: 'combined',
  animations: [
    { action: 'fadeIn', duration: 0.5 },
    { action: 'slideIn', direction: 'up', duration: 0.6 }
  ],
  at: 0
}
```

### GSAP Escape Hatch

```typescript
// Raw GSAP when primitives aren't enough
{
  target: 'el',
  action: 'gsap',
  gsap: {
    to: { x: 100, rotation: 360, ease: 'elastic.out' },
    duration: 1
  }
}
```

## Common Tasks

### Add a New Animation Primitive

1. Create `src/lib/animation/primitives/your-primitive.ts`
2. Export factory function: `yourPrimitive(target, props, timeline)`
3. Add to `src/lib/animation/primitives/index.ts`
4. Register in `src/lib/animation/composer.ts` action router

### Add a New Section

1. Create section config in `src/experience/sections/your-section.ts`
2. Define layers, content, animations
3. Import and add to section array in page

```svelte
<ScrollContainer>
  <Stage>
    <Section config={heroSection} />
    <Section config={newSection} />
  </Stage>
</ScrollContainer>
```

### Create Custom Easing

```typescript
import { registerCustomEase } from '$lib/animation/easing'

registerCustomEase('myEase', 'M0,0 C0.4,0 0.2,1 1,1')

// Use in animations
{ ease: 'myEase' }
```

### Add Scroll State to Component

```typescript
// In section config
{
  id: 'progress',
  component: ProgressBar,
  injectScrollState: true,  // Receives scrollState prop
  position: { preset: 'bottom-center' },
  at: 0
}

// In component
let { scrollState }: { scrollState?: ScrollState } = $props()
const progress = $derived(scrollState?.progress ?? 0)
```

## Pitfalls to Avoid

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Animations without context | Memory leaks on HMR | Wrap in `gsap.context()` |
| Multiple ScrollSmoother | Broken scroll | Use singleton via `getScrollSmoother()` |
| `position: fixed` in wrapper | Breaks smooth scroll | Use ScrollTrigger pinning |
| Animating before mount | Null reference | Guard with `if (!element) return` |
| Mutating timelines | Unpredictable playback | Rebuild fresh on changes |
| Percentage ScrollTrigger | Stale on resize | Use `invalidateOnRefresh: true` |
| SplitText without cleanup | DOM corruption | Call `revertAllSplits()` on destroy |

## File Naming Conventions

- **Components:** `PascalCase.svelte`
- **Utilities:** `kebab-case.ts` or `camelCase.ts`
- **Types:** Exported from `types/index.ts`
- **Barrel exports:** `index.ts` in each directory

## Documentation

Full documentation available in `docs/`:

| Document | Description |
|----------|-------------|
| [README](./docs/README.md) | Documentation index |
| [Getting Started](./docs/getting-started.md) | Installation, setup |
| [Architecture](./docs/architecture.md) | System design |
| [Core Systems](./docs/core-systems.md) | GSAP, timing, experience |
| [Animation Primitives](./docs/animation-primitives.md) | All 22+ animations |
| [Layer System](./docs/layer-system.md) | Layers, parallax, z-ordering |
| [Content System](./docs/content-system.md) | Positioning, scroll state |
| [Responsive System](./docs/responsive-system.md) | Frame, regions, fluid |
| [Components](./docs/components.md) | Component reference |
| [Patterns](./docs/patterns.md) | Critical patterns |
| [API Reference](./docs/api-reference.md) | Complete API |

## Key Dependencies

- **GSAP 3.14** - Animation engine + ScrollTrigger + ScrollSmoother
- **SvelteKit 2.49** - Framework
- **Svelte 5** - Runes syntax (`$state`, `$effect`, `$props`)
- **PandaCSS** - Utility-first styling
- **TypeScript 5.9** - Strict mode
