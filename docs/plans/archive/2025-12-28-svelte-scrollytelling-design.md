# svelte-scrollytelling Boilerplate Design

## Overview

A general-purpose SvelteKit + GSAP scrollytelling boilerplate with:
- Time-based animation authoring (After Effects style)
- 3-tier layer system (BG/MG/FG) with optional grouping
- Composable animation primitives + GSAP escape hatch
- Responsive positioning with semantic regions and fluid sizing
- Binary desktop/mobile experience split
- Full TypeScript support with config validation

---

## Core Architecture

### Timeline Model

Everything flows from a single master timeline measured in **seconds**, not scroll percentages.

```typescript
// scrollytelling.config.ts
export default {
  totalDuration: 90,    // seconds - full experience length
  scrollSpeed: 65,      // px/s - scroll velocity for "perfect pace"
  // Derived: scrollDistance = 5850px
}
```

**Time → Scroll Conversion:**
```typescript
scrollPosition = timeSeconds / totalDuration  // 0-1
scrollPixels = scrollPosition * scrollDistance
```

### Section Structure

Sections don't define their own duration. Duration is derived from animations:

```typescript
sectionDuration = max(animation.at + animation.duration)
```

Sections are ordered sequentially. The system calculates scroll regions automatically.

---

## Layer System

### Three Standard Layers

| Layer | Default Z | Purpose |
|-------|-----------|---------|
| `bg` | 0 | Backgrounds, environments |
| `mg` | 50 | **Primary subjects, main content** |
| `fg` | 100 | Foreground framing, depth elements, overlays |

Mental model: looking *through* foreground *at* midground *against* background.

### Custom Layers

```typescript
layers: [
  { id: 'bg', src: '/sky.png' },
  { id: 'clouds', src: '/clouds.png', z: 10 },      // Between bg and mg
  { id: 'mg', src: '/mountains.png' },
  { id: 'particles', src: '/dust.png', z: 75 },     // Between mg and fg
  { id: 'fg', src: '/character.png' },
  { id: 'ui-overlay', src: '/vignette.png', z: 200 }, // Above fg
]
```

### Layer Groups

For coordinated motion:

```typescript
layers: [
  {
    id: 'parallax-bg',
    type: 'group',
    children: [
      { id: 'sky', src: '/sky.png', z: 0 },
      { id: 'clouds', src: '/clouds.png', z: 5 },
      { id: 'mountains', src: '/mountains.png', z: 10 },
    ]
  },
  { id: 'character', src: '/hero.png', z: 100 },
]

// Animate the group – all children move together
animations: [
  { target: 'parallax-bg', action: 'panLeft', duration: 5, at: 0 },
]
```

### 3D Layers (Threlte Integration)

For integrating Three.js/Threlte 3D scenes into the layer stack:

```typescript
interface Layer3D {
  id: string
  type: '3d'
  z: number
  component: typeof SvelteComponent // Threlte Canvas wrapper
  props?: Record<string, unknown>
  scrollSync?: boolean    // Pass scroll progress to 3D scene
  interactive?: boolean   // true = receives pointer events, false = pointer-events: none
}
```

Usage example:

```typescript
import ThrelteScene from '../components/ThrelteScene.svelte'

layers: [
  { id: 'bg', src: '/sky.png', z: 0 },
  {
    id: 'scene-3d',
    type: '3d',
    z: 50,
    component: ThrelteScene,
    props: { quality: 'high' },
    scrollSync: true,      // Injects scrollProgress prop
    interactive: false,    // Scroll passes through to ScrollSmoother
  },
  { id: 'fg-overlay', src: '/vignette.png', z: 100 },
]
```

The Layer component detects `type: '3d'` and renders accordingly:

```svelte
<!-- layers/Layer.svelte -->
{#if layer.type === '3d'}
  <div
    class="layer layer-3d"
    style:z-index={layer.z}
    style:pointer-events={layer.interactive ? 'auto' : 'none'}
  >
    <svelte:component
      this={layer.component}
      {...layer.props}
      scrollProgress={layer.scrollSync ? scrollProgress : undefined}
    />
  </div>
{:else}
  <!-- Standard image/video layer -->
{/if}
```

---

## Animation System

### Easing Primitives

```typescript
ease: {
  // Core easings
  linear      // Constant speed, mechanical
  ease        // Subtle acceleration/deceleration
  easeIn      // Slow start, accelerates
  easeOut     // Fast start, decelerates
  cubic       // Extended accel/decel, fast middle

  // GSAP Suite easings (built-in)
  elastic: 'elastic.out(1, 0.3)'   // Springy overshoot
  bounce: 'bounce.out'             // Bouncing settle
  back: 'back.out(1.7)'            // Slight overshoot
  expo: 'expo.out'                 // Dramatic deceleration
  circ: 'circ.out'                 // Circular motion feel

  // CustomEase (brand-specific curves)
  custom: CustomEase.create('brand', 'M0,0 C0.25,0.1 0.25,1 1,1')

  // CustomBounce (physics-accurate bounces)
  settledBounce: CustomBounce.create('settle', {
    strength: 0.3,      // Bounce intensity
    squash: 2,          // Squash/stretch amount
    squashID: 'squash'  // Separate ease for squash
  })

  // CustomWiggle (oscillation patterns)
  wiggle: CustomWiggle.create('wiggle', {
    type: 'easeOut',    // Base ease shape
    wiggles: 5          // Number of oscillations
  })
}
```

### CustomEase Registration

```typescript
// core/easing.ts
import { CustomEase, CustomBounce, CustomWiggle } from 'gsap/all'

// Register once at app init
gsap.registerPlugin(CustomEase, CustomBounce, CustomWiggle)

// Define brand easings
export const brandEases = {
  smooth: CustomEase.create('smooth', 'M0,0 C0.4,0 0.2,1 1,1'),
  snappy: CustomEase.create('snappy', 'M0,0 C0.5,0 0,1 1,1'),
  dramatic: CustomEase.create('dramatic', 'M0,0 C0.7,0 0.3,1 1,1'),
}
```

### Animation Primitives (Based on motion.zajno.com)

**Opacity:**
```typescript
fadeIn(duration?, ease?)
fadeOut(duration?, ease?)
crossfade(toTarget, duration?, ease?)
```

**Transform & Morph (MorphSVGPlugin):**
```typescript
morph(props: {
  toShape: string | SVGPathElement,   // Target path or selector
  shapeIndex?: 'auto' | number,       // Best morph path calculation
  origin?: string,                    // Transform origin '50% 50%'
  map?: 'size' | 'position' | 'complexity', // Point mapping strategy
  precompile?: boolean,               // Pre-calculate for performance
  duration?, ease?
})

// Path utilities from MorphSVGPlugin
MorphSVGPlugin.convertToPath('circle, rect, ellipse') // Convert shapes to paths
MorphSVGPlugin.pathDataToBezier(path)                 // Extract bezier points

transform(props: {
  scale?: [from, to],
  rotate?: [from, to],
  skew?: [from, to],
  duration?, ease?
})
```

**Text Animation (SplitText):**
```typescript
textReveal(props: {
  type: 'chars' | 'words' | 'lines' | 'chars,words' | 'chars,words,lines',
  animation?: 'fade' | 'slide' | 'scale' | 'rotate',
  stagger?: number | { each: number, from: 'start' | 'end' | 'center' | 'random' },
  direction?: 'up' | 'down' | 'left' | 'right',
  distance?: number,
  duration?, ease?
})

scrambleText(props: {
  text?: string,               // Final text (default: original)
  chars?: string,              // Character set for scramble
  tweenLength?: boolean,       // Animate text length change
  speed?: number,              // Scramble speed multiplier
  delimiter?: string,          // Split delimiter
  revealDelay?: number,        // Delay before reveal starts
  rightToLeft?: boolean,
  duration?, ease?
})

// SplitText preserves styling and allows reversion
const split = new SplitText('.text', { type: 'chars,words,lines' })
// ... animate split.chars, split.words, split.lines
split.revert()  // Restore original DOM
```

**Draw SVG (DrawSVGPlugin):**
```typescript
drawSVG(props: {
  from?: string | number,      // Start position: '0%', 50, '50% 50%'
  to?: string | number,        // End position: '100%', '0% 100%'
  length?: number,             // Visible stroke length
  position?: number,           // Position along path
  duration?, ease?
})

// Examples:
{ action: 'drawSVG', from: '0%', to: '100%' }           // Draw from nothing
{ action: 'drawSVG', from: '50% 50%', to: '50% 50%' }   // Collapse to center
{ action: 'drawSVG', from: '0%', to: '0% 100%' }        // Appear from start
```

**Motion Path (MotionPathPlugin):**
```typescript
motionPath(props: {
  path: string | SVGPathElement | Array<{x, y}>,  // Path to follow
  align?: string | Element,     // Align to path element
  alignOrigin?: [number, number], // Origin for alignment [0.5, 0.5]
  autoRotate?: boolean | number,  // Rotate along path (or offset degrees)
  start?: number,               // Start position 0-1
  end?: number,                 // End position 0-1
  curviness?: number,           // Bezier curve tension
  type?: 'cubic' | 'thru' | 'quadratic' | 'soft',
  duration?, ease?
})

// Path utilities
MotionPathPlugin.convertToPath('.myShape')     // Convert to path
MotionPathPlugin.arrayToRawPath(points)        // Points to path
MotionPathPlugin.rawPathToString(rawPath)      // Path to string
MotionPathPlugin.getRelativePosition(element, path, progress) // Get position
```

**Slide/Position:**
```typescript
slideIn(direction: 'up' | 'down' | 'left' | 'right', distance?, duration?, ease?)
slideOut(direction, distance?, duration?, ease?)
pan(props: { x?, y?, duration?, ease? })
```

**Masking:**
```typescript
mask(props: {
  shape: 'rect' | 'circle' | 'path',
  content: {
    pan?: { x?, y? },
    scale?: [from, to],
    rotate?: [from, to],
  },
  duration?, ease?
})
```

**Dimension (Z-Depth):**
```typescript
dimension(props: {
  z?: number,
  recede?: boolean,
  approach?: boolean,
  duration?, ease?
})
```

**Parallax:**
```typescript
parallax(props: {
  speed: number,              // 0.5 = half speed, 1.5 = 1.5x speed
  axis?: 'x' | 'y' | 'both',
  trigger?: 'scroll' | 'mouse',
})

// Layer shorthand – auto-calculates speed from z-index
layers: [
  { id: 'bg', src: '...', parallax: true },  // Uses z-based default
  { id: 'mg', src: '...', parallax: { speed: 1.0 } },
  { id: 'fg', src: '...', parallax: { speed: 1.3, axis: 'y' } },
]
```

**Zoom:**
```typescript
zoom(props: {
  scale: [from, to],
  pan?: { x?, y? },
  rotate?: number,
  duration?, ease?
})
```

**Stagger (Offset & Delay):**
```typescript
stagger(targets: string[], props: {
  animation: AnimationPrimitive,
  delay: number,
  overlap?: number,
  direction?: 'forward' | 'reverse' | 'center' | 'edges',
})
```

**Follow-Through (CustomWiggle/CustomBounce):**
```typescript
followThrough(props: {
  type: 'bounce' | 'wiggle' | 'elastic',

  // Bounce settings (CustomBounce)
  strength?: number,         // 0-1, bounce intensity
  squash?: number,           // Squash/stretch amount (0 = none)
  endAtStart?: boolean,      // Return to start position

  // Wiggle settings (CustomWiggle)
  wiggles?: number,          // Number of oscillations
  wiggleType?: 'uniform' | 'random' | 'anticipate' | 'easeOut',

  duration?, ease?
})

// Pre-built follow-through easings
export const followThroughEases = {
  // Physics-accurate bounce that settles
  settle: CustomBounce.create('settle', {
    strength: 0.4,
    squash: 1.5
  }),

  // Overshoot then settle (like elastic but controlled)
  overshoot: CustomWiggle.create('overshoot', {
    type: 'anticipate',
    wiggles: 2
  }),

  // Gentle oscillation for floating elements
  float: CustomWiggle.create('float', {
    type: 'uniform',
    wiggles: 3
  }),

  // Snappy with tiny bounce
  snappy: CustomBounce.create('snappy', {
    strength: 0.2,
    squash: 0
  }),
}
```

**Physics & Inertia (InertiaPlugin):**
```typescript
inertia(props: {
  velocity?: number | 'auto',  // Starting velocity (auto = track)
  resistance?: number,         // Friction (higher = stops faster)
  min?: number,                // Minimum value constraint
  max?: number,                // Maximum value constraint
  end?: number | 'auto',       // Target end value
  duration?: { min, max },     // Duration constraints
  overshootTolerance?: number, // Allow overshooting bounds
})

// Common patterns
throwable(props: {
  bounds?: Element | { top, left, width, height },
  resistance?: number,
  edgeResistance?: number,     // Extra resistance at edges
  onThrow?: (velocity) => void,
  onLand?: (position) => void,
})

// Tracking and velocity
VelocityTracker.track(element, 'x,y')  // Start tracking
VelocityTracker.getVelocity(element, 'x')  // Get current velocity
InertiaPlugin.getVelocity(element, 'x')    // Alternative API
```

**Combined Motion:**
```typescript
{
  target: 'hero',
  action: 'combined',
  animations: [
    { action: 'fadeIn', duration: 0.6 },
    { action: 'slideIn', direction: 'up', distance: 30 },
    { action: 'followThrough', settle: 0.1 },
  ],
  at: 0.5
}
```

### Time-Based Positioning

```typescript
{ target: 'title', at: 0.5 }              // Absolute: 0.5s
{ target: 'subtitle', at: '+=0.2' }       // Relative: 0.2s after previous ends
{ target: 'cta', at: 'title' }            // Sync: when 'title' starts
{ target: 'fade', at: 'title+0.3' }       // Offset: 0.3s after 'title' starts
```

### GSAP Escape Hatch

```typescript
{
  target: 'character',
  action: 'gsap',
  at: 2,
  gsap: {
    keyframes: [
      { x: 0, rotation: 0 },
      { x: 100, rotation: 15, duration: 0.5 },
      { x: 50, rotation: -5, duration: 0.3 },
    ],
    ease: 'elastic.out',
  }
}
```

### Flip Plugin (State Transitions)

Smooth animations between DOM state changes - perfect for layout transitions, responsive reflows, and mobile variants.

```typescript
flip(props: {
  targets: string | Element[],
  duration?: number,
  ease?: string,
  absolute?: boolean,          // Use position: absolute during flip
  scale?: boolean,             // Animate scale changes
  nested?: boolean,            // Handle nested flips
  prune?: boolean,             // Skip elements that didn't change
  onEnter?: (elements) => void,
  onLeave?: (elements) => void,
  spin?: boolean | number,     // Rotation direction
  simple?: boolean,            // Skip scale, just position
})

// State capture → Change → Animate pattern
const state = Flip.getState('.items')  // Capture current state

// ... make DOM changes (reorder, resize, reparent)

Flip.from(state, {
  duration: 0.5,
  ease: 'power2.out',
  absolute: true,
  onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1 }),
  onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0 }),
})
```

**Common Flip Patterns:**

```typescript
// Responsive layout transition
function handleResize() {
  const state = Flip.getState('.grid-item')
  updateGridLayout()  // Change CSS/classes
  Flip.from(state, { duration: 0.4, ease: 'power1.out' })
}

// Mobile variant switch
function switchToMobileLayout(sectionConfig) {
  const state = Flip.getState('[data-content]')
  applyMobileConfig(sectionConfig.mobile)
  Flip.from(state, {
    duration: 0.3,
    scale: true,
    nested: true,
  })
}

// Reordering list items
function reorderItems(newOrder) {
  const state = Flip.getState('.item')
  container.append(...newOrder)  // Reparent elements
  Flip.from(state, {
    duration: 0.4,
    ease: 'power2.inOut',
  })
}

// Expand/collapse
function toggleExpand(element) {
  const state = Flip.getState(element)
  element.classList.toggle('expanded')
  Flip.from(state, { duration: 0.3 })
}
```

### Observer (Input Normalization)

Unified handling for scroll, touch, wheel, and pointer events across devices.

```typescript
// core/input.ts
import { Observer } from 'gsap/Observer'

observer(props: {
  target?: Element | Window,
  type: 'wheel' | 'touch' | 'pointer' | 'scroll' | string,  // Comma-separated
  axis?: 'x' | 'y' | 'both',
  tolerance?: number,          // Minimum movement before triggering
  preventDefault?: boolean,
  onUp?: (self) => void,
  onDown?: (self) => void,
  onLeft?: (self) => void,
  onRight?: (self) => void,
  onChange?: (self) => void,
  onChangeX?: (self) => void,
  onChangeY?: (self) => void,
  onStop?: (self) => void,
  onPress?: (self) => void,
  onRelease?: (self) => void,
  onHover?: (self) => void,
  onHoverEnd?: (self) => void,
  debounce?: boolean,
  lockAxis?: boolean,          // Lock to dominant axis
  capture?: boolean,           // Use capture phase
  wheelSpeed?: number,         // Wheel sensitivity multiplier
})

// Observer callback self object
interface ObserverSelf {
  deltaX: number
  deltaY: number
  velocityX: number
  velocityY: number
  isDragging: boolean
  isPressed: boolean
  x: number            // Pointer position
  y: number
  event: Event
  startX: number
  startY: number
}
```

**Common Observer Patterns:**

```typescript
// Section-based navigation
Observer.create({
  target: window,
  type: 'wheel,touch,pointer',
  onUp: () => goToPrevSection(),
  onDown: () => goToNextSection(),
  tolerance: 100,
  preventDefault: true,
  wheelSpeed: -1,  // Natural scrolling
})

// Horizontal scroll sections
Observer.create({
  target: horizontalSection,
  type: 'wheel,touch',
  onChangeX: (self) => {
    gsap.to(horizontalSection, {
      x: `-=${self.deltaX}`,
      duration: 0.3,
    })
  },
  lockAxis: true,
})

// Drag-to-reveal
Observer.create({
  target: revealElement,
  type: 'touch,pointer',
  onPress: (self) => startReveal(self),
  onChange: (self) => updateReveal(self.deltaY),
  onRelease: (self) => {
    if (self.deltaY > threshold) completeReveal()
    else cancelReveal()
  },
})

// Custom scroll velocity detection
const scrollObserver = Observer.create({
  type: 'scroll',
  onChange: (self) => {
    scrollVelocity = self.velocityY
    updateParallaxSpeed(scrollVelocity)
  },
})
```

**Integration with Experience Switching:**

```typescript
// core/experience.ts
export function createExperienceObserver() {
  return Observer.create({
    type: 'wheel,touch,scroll',
    tolerance: 50,

    // Detect scroll intent
    onDown: (self) => {
      if (self.velocityY > 1000) {
        // Fast scroll = skip to next section
        jumpToNextSection()
      }
    },

    // Detect pinch/zoom on mobile
    onChangeX: (self) => {
      if (self.isDragging && Math.abs(self.deltaX) > 100) {
        // Horizontal swipe = switch experience
        toggleExperienceMode()
      }
    },
  })
}
```

---

## GSAP Context & Cleanup Patterns

### The Golden Rule: Always Use `gsap.context()`

Every animation created in a Svelte component MUST be wrapped in `gsap.context()`. This is non-negotiable for preventing memory leaks during HMR and navigation.

```typescript
// ✅ CORRECT: All animations scoped to context
let ctx: gsap.Context

$effect(() => {
  ctx = gsap.context(() => {
    gsap.to('.element', { x: 100 })
    gsap.timeline().to('.a', { y: 50 }).to('.b', { opacity: 1 })
    ScrollTrigger.create({ trigger: '.section', ... })
  }, containerRef) // Scope selector queries to container

  return () => ctx.revert() // Single call kills ALL animations
})

// ❌ WRONG: Animations created outside context
$effect(() => {
  gsap.to('.element', { x: 100 }) // Memory leak on every HMR!
  return () => gsap.killTweensOf('.element') // Incomplete cleanup
})
```

### Plugin Registration Safeguard

Prevent double-registration errors during HMR:

```typescript
// core/timeline.ts
import gsap from 'gsap'

// Core plugins (free)
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'
import { Flip } from 'gsap/Flip'

// Premium plugins (Club GSAP)
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { SplitText } from 'gsap/SplitText'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { CustomBounce } from 'gsap/CustomBounce'
import { CustomWiggle } from 'gsap/CustomWiggle'

let registered = false

export function initGSAP() {
  if (registered) return

  gsap.registerPlugin(
    // Core (free)
    ScrollTrigger,
    Observer,
    Flip,

    // Premium - Scroll
    ScrollSmoother,

    // Premium - Text
    SplitText,
    ScrambleTextPlugin,

    // Premium - SVG
    MorphSVGPlugin,
    DrawSVGPlugin,
    MotionPathPlugin,

    // Premium - Physics
    InertiaPlugin,

    // Premium - Easing
    CustomEase,
    CustomBounce,
    CustomWiggle,
  )

  registered = true
}

// Reset on HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    registered = false
  })
}
```

**Plugin Feature Summary:**

| Plugin | Purpose | Common Use |
|--------|---------|------------|
| ScrollTrigger | Scroll-linked animations | Section enter/exit, scrub timelines |
| ScrollSmoother | Smooth scroll + effects | `data-speed`, `data-lag` parallax |
| Observer | Input normalization | Swipe, wheel, touch handling |
| Flip | State transitions | Layout changes, reordering |
| SplitText | Text splitting | Char/word/line animations |
| ScrambleTextPlugin | Text scramble | Decode/reveal effects |
| MorphSVGPlugin | SVG morphing | Shape transformations |
| DrawSVGPlugin | SVG drawing | Line art reveals |
| MotionPathPlugin | Path animation | Follow curves |
| InertiaPlugin | Physics/momentum | Throw, drag with inertia |
| CustomEase | Custom curves | Brand-specific timing |
| CustomBounce | Physics bounce | Settle/drop effects |
| CustomWiggle | Oscillation | Shake/wobble effects |

### ScrollSmoother Singleton Pattern

Only one ScrollSmoother instance should exist. This pattern survives HMR:

```typescript
// core/scroll.ts
let smoother: ScrollSmoother | null = null

export function getScrollSmoother(config?: ScrollSmootherConfig) {
  if (smoother) return smoother

  smoother = ScrollSmoother.create({
    smooth: 1.2,
    effects: true,
    ...config
  })

  return smoother
}

export function killScrollSmoother() {
  smoother?.kill()
  smoother = null
}

// HMR cleanup
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    killScrollSmoother()
  })
}
```

### ScrollSmoother Data Attributes (Simplified Parallax)

ScrollSmoother provides declarative parallax via data attributes - simpler than manual parallax primitives for many cases:

```html
<!-- Speed: < 1 slower, > 1 faster, 1 = normal -->
<div data-speed="0.5">Moves at half scroll speed (parallax back)</div>
<div data-speed="1.5">Moves at 1.5x scroll speed (parallax forward)</div>
<div data-speed="auto">Auto-calculated based on element position</div>

<!-- Lag: Delay in seconds before element catches up -->
<div data-lag="0.5">Follows scroll with 0.5s delay</div>
<div data-lag="1">Dreamy, floating effect</div>

<!-- Combine for complex effects -->
<div data-speed="0.8" data-lag="0.3">Slow parallax with lag</div>
```

**Layer Integration:**

```typescript
// Layers can use data attributes instead of parallax config
layers: [
  { id: 'bg', src: '/sky.png', attributes: { 'data-speed': '0.5' } },
  { id: 'clouds', src: '/clouds.png', attributes: { 'data-speed': '0.7', 'data-lag': '0.2' } },
  { id: 'mg', src: '/mountains.png' },  // Normal speed
  { id: 'fg', src: '/mist.png', attributes: { 'data-speed': '1.3' } },
]

// Or shorthand
layers: [
  { id: 'bg', src: '/sky.png', speed: 0.5 },      // Converts to data-speed
  { id: 'clouds', src: '/clouds.png', speed: 0.7, lag: 0.2 },
  { id: 'fg', src: '/mist.png', speed: 1.3 },
]
```

**ScrollSmoother Effects Configuration:**

```typescript
export function getScrollSmoother(config?: ScrollSmootherConfig) {
  if (smoother) return smoother

  smoother = ScrollSmoother.create({
    smooth: 1.2,              // Smoothing duration
    effects: true,            // Enable data-speed/data-lag
    smoothTouch: 0.1,         // Touch device smoothing (0 = native)
    normalizeScroll: true,    // Prevent iOS overscroll bounce
    ignoreMobileResize: true, // Prevent resize on mobile keyboard
    ...config
  })

  return smoother
}

// Runtime effect updates
ScrollSmoother.effects('[data-speed]', {
  speed: (i, el) => parseFloat(el.dataset.speed) * velocityMultiplier,
  lag: (i, el) => parseFloat(el.dataset.lag ?? '0'),
})
```

### ScrollTrigger Defaults

Set sensible defaults that prevent common issues:

```typescript
// core/scroll.ts
ScrollTrigger.defaults({
  invalidateOnRefresh: true, // Re-calculate values on resize
  toggleActions: 'play none none reverse',
})

// After dynamic content or route changes
ScrollTrigger.refresh(true) // Force recalculation
```

### Timeline Immutability Pattern

Never mutate timelines after creation. Rebuild on config changes:

```typescript
// ❌ WRONG: Mutating existing timeline
const tl = gsap.timeline()
tl.to('.a', { x: 100 })
// Later, in response to state change...
tl.to('.b', { y: 50 }) // Appending to existing = bugs

// ✅ CORRECT: Rebuild timeline fresh
$effect(() => {
  ctx?.revert() // Kill old timeline completely

  ctx = gsap.context(() => {
    const tl = gsap.timeline({ scrollTrigger: {...} })
    buildTimelineFromConfig(tl, config) // Fresh build
  })

  return () => ctx.revert()
})
```

---

## Svelte 5 Integration Patterns

### $effect Cleanup Pattern

Always return a cleanup function from `$effect` when creating GSAP animations:

```typescript
// content/scroll-state.ts
export function createScrollState(element: HTMLElement) {
  let state = $state<ScrollState>({
    progress: 0,
    isVisible: false,
    direction: null,
    velocity: 0,
    sectionProgress: 0,
    globalProgress: 0,
  })

  $effect(() => {
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        state.progress = self.progress
        state.direction = self.direction === 1 ? 'down' : 'up'
        state.velocity = self.getVelocity()
        state.isVisible = self.isActive
      },
    })

    return () => trigger.kill() // Critical: cleanup on unmount
  })

  return state
}
```

### bind:this Timing Gotcha

Element refs are `undefined` on the first `$effect` run. Always guard:

```svelte
<script lang="ts">
  let container: HTMLElement
  let ctx: gsap.Context

  // ❌ WRONG: ref may be undefined
  $effect(() => {
    ctx = gsap.context(() => {
      gsap.to(container, { opacity: 1 }) // Crashes if undefined!
    })
  })

  // ✅ CORRECT: Guard clause
  $effect(() => {
    if (!container) return // Wait for mount

    ctx = gsap.context(() => {
      gsap.to(container, { opacity: 1 })
    }, container)

    return () => ctx.revert()
  })
</script>

<div bind:this={container}>...</div>
```

### Belt-and-Suspenders Cleanup

For critical cleanup, use both `$effect` return and `onDestroy`:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte'

  let container: HTMLElement
  let ctx: gsap.Context

  $effect(() => {
    if (!container) return

    ctx = gsap.context(() => {
      buildSectionTimeline(config, container)
    }, container)

    return () => ctx?.revert()
  })

  // Backup for edge cases (rapid unmount, errors)
  onDestroy(() => ctx?.revert())
</script>
```

### Reactive Config Rebuilds

When config changes, the timeline must be rebuilt:

```svelte
<script lang="ts">
  interface Props {
    config: SectionConfig
  }

  let { config }: Props = $props()
  let container: HTMLElement
  let ctx: gsap.Context

  // Runs whenever `config` changes
  $effect(() => {
    if (!container) return

    // Previous context is automatically reverted by return cleanup
    ctx = gsap.context(() => {
      const tl = createSectionTimeline(config)
      // ...
    }, container)

    return () => ctx.revert()
  })
</script>
```

---

## Common Pitfalls & Antipatterns

### Quick Reference Table

| Antipattern | Problem | Solution |
|-------------|---------|----------|
| Animations without `gsap.context()` | Memory leaks on HMR/navigation | Always wrap in context, call `ctx.revert()` |
| Animating unmounted elements | GSAP warnings, null reference errors | Use `autoAlpha`, guard `bind:this` refs |
| ScrollTrigger without `kill()` | Zombie triggers persist after unmount | Cleanup in `$effect` return or `onDestroy` |
| `position: fixed` inside ScrollSmoother | Breaks smooth scroll wrapper | Use `data-scroll-sticky` or pinning |
| Percentage `start`/`end` without refresh | Stale values after resize | Set `invalidateOnRefresh: true` |
| Animating during `document.hidden` | Wasted CPU, animation jumps | Pause timeline when tab hidden |
| Multiple ScrollSmoother instances | Scroll conflicts, broken animations | Use singleton pattern |
| Double plugin registration | Console errors, undefined behavior | Guard with `registered` flag |
| Mutating timelines after creation | Unpredictable playback, sync issues | Rebuild timeline fresh on changes |
| Not scoping selectors to container | Wrong elements animated | Pass container to `gsap.context()` |

### Detailed Examples

#### Zombie ScrollTriggers

```typescript
// ❌ WRONG: ScrollTrigger persists after component unmount
$effect(() => {
  ScrollTrigger.create({
    trigger: element,
    onEnter: () => animate(),
  })
  // No cleanup! Trigger fires on destroyed component
})

// ✅ CORRECT: Kill on cleanup
$effect(() => {
  const trigger = ScrollTrigger.create({
    trigger: element,
    onEnter: () => animate(),
  })

  return () => trigger.kill()
})
```

#### Fixed Positioning Inside ScrollSmoother

```svelte
<!-- ❌ WRONG: Fixed element inside smooth wrapper -->
<div data-scroll-container>
  <div style="position: fixed; top: 0;">Header</div> <!-- Broken! -->
</div>

<!-- ✅ CORRECT: Use ScrollTrigger pinning -->
<div data-scroll-container>
  <div class="header">Header</div> <!-- Pinned via ScrollTrigger -->
</div>

<script>
  ScrollTrigger.create({
    trigger: '.header',
    pin: true,
    pinSpacing: false,
  })
</script>

<!-- ✅ ALSO CORRECT: Move outside smooth wrapper -->
<div style="position: fixed; top: 0;">Header</div>
<div data-scroll-container>
  <!-- Content -->
</div>
```

#### Tab Visibility Handling

```typescript
// core/timeline.ts
export function createVisibilityHandler(timeline: gsap.core.Timeline) {
  const handler = () => {
    if (document.hidden) {
      timeline.pause()
    } else {
      timeline.resume()
    }
  }

  document.addEventListener('visibilitychange', handler)

  return () => document.removeEventListener('visibilitychange', handler)
}
```

---

## Content System

### GSAP Best Practice: autoAlpha Pattern

All content is mounted immediately when the section mounts, but starts hidden using GSAP's `autoAlpha: 0` (which sets both `opacity: 0` and `visibility: hidden`). This ensures:

1. **GSAP can always find targets** - Elements exist in DOM when timeline is created
2. **No FOUC** - Content is hidden until animations reveal it
3. **Proper cleanup** - `autoAlpha: 0` also sets `visibility: hidden` for accessibility

The `at` and `until` properties control **animation timing**, not DOM mounting:
- `at` = when the fadeIn animation runs (content becomes visible)
- `until` = when the fadeOut animation runs (content becomes hidden)

### Svelte Components as Content

```typescript
content: [
  {
    id: 'headline',
    component: Headline,
    props: { text: 'Welcome', size: 'xl' },
    position: { x: '10%', y: '20%' },
    at: 0,      // Animation start time (fadeIn)
    until: 5,   // Animation end time (fadeOut) - optional
  },
]
```

### Animation Modes

**Wrapper Animation (Default):**
GSAP animates the wrapper div using `autoAlpha`. Component is unaware.

**Opt-In State Injection:**
```svelte
<script lang="ts">
  import type { ScrollState } from 'svelte-scrollytelling'

  interface Props {
    title: string
    scrollState?: ScrollState
  }

  let { title, scrollState }: Props = $props()
</script>
```

### ScrollState Interface

```typescript
interface ScrollState {
  progress: number        // 0-1 within content's lifespan
  isVisible: boolean
  direction: 'up' | 'down' | null
  velocity: number
  sectionProgress: number // 0-1 within parent section
  globalProgress: number  // 0-1 of entire experience
}
```

---

## Responsive System

### Reference Frame

```typescript
frame: {
  reference: { width: 1920, height: 1080 },
  scaling: 'cover' | 'contain' | 'fill',
  minScale: 0.5,
  maxScale: 1.5,
}
```

### Semantic Region Grid

```
┌─────────────────────────────────────────────────────┐
│  safe    │  left   │  center │  right  │    safe   │
│  zone    │  third  │         │  third  │    zone   │
├──────────┼─────────┼─────────┼─────────┼───────────┤
│          │    1    │    2    │    3    │           │
├──────────┼─────────┼─────────┼─────────┼───────────┤
│          │    4    │    5    │    6    │           │
│          │         │ (center)│         │           │
├──────────┼─────────┼─────────┼─────────┼───────────┤
│          │    7    │    8    │    9    │           │
└─────────────────────────────────────────────────────┘
```

```typescript
position: { region: 'left-third', vAlign: 'center' }
position: { preset: 'golden-left' }   // 38.2% from left
position: { preset: 'thirds-intersect-tl' }  // Top-left power point
```

### Safe Zones

```typescript
safeZones: {
  mobile: {
    top: 'env(safe-area-inset-top, 44px)',
    bottom: 'env(safe-area-inset-bottom, 34px)',
    left: '16px',
    right: '16px',
  },
  tablet: { top: '24px', bottom: '24px', left: '32px', right: '32px' },
  desktop: { top: '48px', bottom: '48px', left: '64px', right: '64px' },
}
```

### Fluid Size System (Utopia-style)

```typescript
fluid: {
  minViewport: 320,
  maxViewport: 1920,

  type: {
    base: [16, 20],
    scale: 1.25,
    steps: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl'],
  },

  space: {
    base: [8, 12],
    scale: 1.5,
    steps: ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl'],
  }
}
```

Generated CSS:
```css
:root {
  --text-m: clamp(1.00rem, 0.85rem + 0.81vw, 1.25rem);
  --space-m: clamp(1.00rem, 0.85rem + 0.81vw, 1.25rem);
}
```

### Binary Experience Split

```typescript
experiences: {
  desktop: {
    match: '(orientation: landscape), (pointer: fine)',
    frame: { width: 1920, height: 1080, scaling: 'cover' },
  },
  mobile: {
    match: '(orientation: portrait) and (pointer: coarse)',
    frame: { width: 390, height: 844, scaling: 'contain' },
  },
}
```

### Capability Detection

```typescript
capabilities: {
  tier: 'high' | 'medium' | 'low',
  gpu: detectGPU(),
  memory: navigator.deviceMemory,
  prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
}
```

### Mobile Variants

```typescript
const section = {
  id: 'hero',
  layers: [...],
  content: [...],
  animations: [...],

  mobile: {
    layers: [...],
    content: [...],
    animations: [...],
  }
}
```

---

## Threlte 3D Integration

### Architecture Overview

Threlte scenes integrate as layers in the stack, receiving scroll state and participating in the timeline system.

```
┌─────────────────────────────────────────────────────────┐
│                    ScrollContainer                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │                      Stage                         │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Layer: bg (z: 0)              [Image]       │  │  │
│  │  ├─────────────────────────────────────────────┤  │  │
│  │  │ Layer: scene-3d (z: 50)       [Threlte]     │  │  │
│  │  │   └─ <Canvas>                               │  │  │
│  │  │        └─ Scene.svelte (receives scroll)    │  │  │
│  │  ├─────────────────────────────────────────────┤  │  │
│  │  │ Layer: fg (z: 100)            [Image]       │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Threlte Scene Component Pattern

```svelte
<!-- components/ThrelteScene.svelte -->
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'

  interface Props {
    scrollProgress?: number  // 0-1, injected by Layer when scrollSync: true
    quality?: 'low' | 'medium' | 'high'
  }

  let { scrollProgress = 0, quality = 'medium' }: Props = $props()
</script>

<Canvas>
  <Scene {scrollProgress} {quality} />
</Canvas>
```

### Scroll-Synced 3D Animations

Use Threlte's `useTask` to sync with scroll progress:

```svelte
<!-- components/Scene.svelte -->
<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { interactivity } from '@threlte/extras'
  import type { Mesh } from 'three'

  interface Props {
    scrollProgress: number
  }

  let { scrollProgress }: Props = $props()

  let mesh = $state<Mesh>()
  let currentRotation = $state(0)

  // Smooth interpolation toward scroll-driven target
  useTask((delta) => {
    if (!mesh) return

    const targetRotation = scrollProgress * Math.PI * 2
    currentRotation += (targetRotation - currentRotation) * delta * 5

    mesh.rotation.y = currentRotation
  })

  interactivity()
</script>

<T.PerspectiveCamera makeDefault position={[0, 2, 5]} />
<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[10, 10, 5]} />

<T.Mesh bind:ref={mesh}>
  <T.BoxGeometry args={[1, 1, 1]} />
  <T.MeshStandardMaterial color="hotpink" />
</T.Mesh>
```

### Scroll Progress Helper for Threlte

```typescript
// lib/integrations/threlte.ts
import { useTask } from '@threlte/core'

/**
 * Smoothly interpolates toward scroll progress within Threlte's render loop.
 * Prevents janky updates when scroll and render are out of sync.
 */
export function useScrollProgress(getScrollProgress: () => number, smoothing = 5) {
  let current = $state(0)

  useTask((delta) => {
    const target = getScrollProgress()
    current += (target - current) * delta * smoothing
  })

  return {
    get value() { return current },
    get target() { return getScrollProgress() },
  }
}

// Usage in Scene.svelte:
// const scroll = useScrollProgress(() => scrollProgress)
// Then use scroll.value for smooth animations
```

### Performance Tiers for 3D

3D layers should respect capability detection:

```typescript
layers: [
  {
    id: 'scene-3d',
    type: '3d',
    z: 50,
    component: ThrelteScene,
    props: {
      quality: 'high',           // Will be overridden by capability system
    },
    performanceTier: 'medium',   // Only render on medium+ devices
    fallback: {                  // Show static image on low-tier
      src: '/3d-fallback.jpg',
    },
  },
]
```

Layer rendering with fallback:

```svelte
<!-- layers/Layer.svelte -->
{#if layer.type === '3d'}
  {#if capabilities.tier >= layer.performanceTier}
    <svelte:component
      this={layer.component}
      {...layer.props}
      quality={capabilities.tier}
      scrollProgress={layer.scrollSync ? scrollProgress : undefined}
    />
  {:else if layer.fallback}
    <img src={layer.fallback.src} alt="" class="layer-fallback" />
  {/if}
{/if}
```

### Pointer Events Strategy

3D layers need careful pointer-events handling to not block scroll:

```typescript
// Three interaction modes:

// 1. Non-interactive (scroll passes through)
{ interactive: false }  // pointer-events: none on container

// 2. Selective interaction (Threlte handles specific objects)
{ interactive: 'objects' }  // pointer-events: auto, but only 3D objects respond

// 3. Full interaction (canvas captures all events)
{ interactive: true }  // Full pointer capture - blocks scroll!
```

For mode 2, use Threlte's interactivity plugin with event filtering:

```svelte
<script>
  import { interactivity } from '@threlte/extras'

  // Only interactive objects receive events
  interactivity({
    filter: (hits) => hits.filter(hit => hit.object.userData.interactive)
  })
</script>

<T.Mesh userData={{ interactive: true }} onclick={handleClick}>
  <!-- This mesh is clickable -->
</T.Mesh>

<T.Mesh>
  <!-- This mesh lets events pass through -->
</T.Mesh>
```

### GSAP + Threlte Coordination

When GSAP animations need to affect 3D objects, use shared state:

```typescript
// Shared state approach
let cameraZ = $state(10)

// GSAP animates the state value
gsap.to({ z: 10 }, {
  z: 2,
  duration: 2,
  onUpdate: function() {
    cameraZ = this.targets()[0].z
  },
  scrollTrigger: { ... }
})

// Threlte reads the state
<T.PerspectiveCamera position.z={cameraZ} />
```

Or use GSAP's `quickTo` for performance:

```typescript
// core/timeline.ts
export function createGSAPThrelteBridge() {
  const values = { cameraZ: 10, rotation: 0 }
  const quickSetters = {
    cameraZ: gsap.quickTo(values, 'cameraZ', { duration: 0.3 }),
    rotation: gsap.quickTo(values, 'rotation', { duration: 0.3 }),
  }

  return {
    values,
    set: quickSetters,
  }
}
```

---

## Accessibility & Reduced Motion

### Respecting User Preferences

```typescript
// core/accessibility.ts
export function getMotionPreference(): 'full' | 'reduced' | 'none' {
  if (typeof window === 'undefined') return 'full'

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const prefersNone = matchMedia('(prefers-reduced-motion: no-preference)').matches

  if (prefersReduced) return 'reduced'
  return 'full'
}

export function createReducedMotionTimeline(config: SectionConfig) {
  // Skip animations, show final states immediately
  const tl = gsap.timeline()

  config.animations.forEach(anim => {
    // Instead of animating, just set final state
    tl.set(anim.target, getFinalState(anim), 0)
  })

  return tl
}
```

### Timeline Factory with Motion Check

```typescript
// core/timeline.ts
export function createTimeline(config: SectionConfig) {
  const motionPref = getMotionPreference()

  if (motionPref === 'reduced') {
    return createReducedMotionTimeline(config)
  }

  return createFullTimeline(config)
}
```

### Performance Tier Degradation

```typescript
// core/capabilities.ts
export interface Capabilities {
  tier: 'high' | 'medium' | 'low'
  gpu: GPUTier
  memory: number
  prefersReducedMotion: boolean
}

export function detectCapabilities(): Capabilities {
  return {
    tier: calculateTier(),
    gpu: detectGPU(),
    memory: navigator.deviceMemory ?? 4,
    prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

function calculateTier(): 'high' | 'medium' | 'low' {
  const memory = navigator.deviceMemory ?? 4
  const cores = navigator.hardwareConcurrency ?? 4

  if (memory >= 8 && cores >= 8) return 'high'
  if (memory >= 4 && cores >= 4) return 'medium'
  return 'low'
}
```

### Animation Config with Performance Tiers

```typescript
animations: [
  {
    target: 'particles',
    action: 'parallax',
    speed: 1.5,
    performanceTier: 'high',  // Skip on medium/low devices
  },
  {
    target: 'hero',
    action: 'fadeIn',
    // No tier = runs on all devices
  },
  {
    target: 'bg',
    action: 'parallax',
    speed: 0.8,
    performanceTier: 'medium', // Skip only on low devices
    fallback: {                // Alternative for low-tier
      action: 'fadeIn',
      duration: 0.5,
    },
  },
]
```

### Skip Links and Focus Management

```svelte
<!-- components/ScrollContainer.svelte -->
<script lang="ts">
  let sections: SectionConfig[]
</script>

<!-- Accessibility: Skip to content links -->
<nav class="skip-links" aria-label="Skip to section">
  {#each sections as section}
    <a href="#{section.id}" class="skip-link">
      Skip to {section.title ?? section.id}
    </a>
  {/each}
</nav>

<div data-scroll-container>
  {#each sections as section}
    <section id={section.id} tabindex="-1">
      <!-- Section content -->
    </section>
  {/each}
</div>

<style>
  .skip-links {
    position: absolute;
    top: -100%;
  }
  .skip-link:focus {
    top: 0;
    z-index: 9999;
  }
</style>
```

---

## Developer Experience

### Visual Timeline Debugger

```
┌─────────────────────────────────────────────────────────┐
│ ▶ 23.4s / 90s                              [45.2%] ━━━━ │
├─────────────────────────────────────────────────────────┤
│ Section: hero (12.0s - 28.0s)              ████░░░░ 71% │
├─────────────────────────────────────────────────────────┤
│ Active Animations:                                      │
│   → bg: parallax (continuous)                           │
│   → headline: fadeOut (23.0s - 24.5s) ██████░░ 80%     │
└─────────────────────────────────────────────────────────┘
```

Features:
- Scrub timeline manually
- Jump to section by name
- Pause/play animations
- Toggle layer visibility
- Show element bounding boxes

### Hot Reload Preservation

```typescript
hmr: {
  preserveScroll: true,
  preserveSection: true,
  animationReset: 'soft',
}
```

### Config Validation (TypeScript)

- Autocomplete for layer IDs in animations
- Animation props validated per action
- Timing conflict warnings
- Position preset validation
- Auto-generated types from config

---

## Project Structure

```
svelte-scrollytelling/
├── src/
│   ├── lib/
│   │   ├── core/
│   │   │   ├── timeline.ts          # GSAP timeline factory + context management
│   │   │   ├── scroll.ts            # ScrollSmoother singleton + ScrollTrigger defaults
│   │   │   ├── input.ts             # Observer-based input handling
│   │   │   ├── frame.ts             # Reference frame scaling
│   │   │   ├── experience.ts        # Experience orchestration
│   │   │   ├── accessibility.ts     # Reduced motion + preferences
│   │   │   └── capabilities.ts      # Device tier detection
│   │   │
│   │   ├── animation/
│   │   │   ├── primitives/
│   │   │   │   ├── fade.ts
│   │   │   │   ├── slide.ts
│   │   │   │   ├── zoom.ts
│   │   │   │   ├── parallax.ts
│   │   │   │   ├── morph.ts          # MorphSVGPlugin integration
│   │   │   │   ├── mask.ts
│   │   │   │   ├── dimension.ts
│   │   │   │   ├── stagger.ts
│   │   │   │   ├── text.ts           # SplitText + ScrambleText
│   │   │   │   ├── draw-svg.ts       # DrawSVGPlugin
│   │   │   │   ├── motion-path.ts    # MotionPathPlugin
│   │   │   │   ├── physics.ts        # InertiaPlugin, throwable
│   │   │   │   └── index.ts
│   │   │   ├── easing.ts             # CustomEase, CustomBounce, CustomWiggle
│   │   │   ├── flip.ts               # Flip plugin state transitions
│   │   │   ├── composer.ts
│   │   │   └── gsap-passthrough.ts
│   │   │
│   │   ├── layers/
│   │   │   ├── Layer.svelte         # Handles image, video, and 3D layer types
│   │   │   ├── Layer3D.svelte       # Threlte Canvas wrapper
│   │   │   ├── LayerGroup.svelte
│   │   │   ├── LayerStack.svelte
│   │   │   └── types.ts             # LayerConfig, Layer3D interface
│   │   │
│   │   ├── content/
│   │   │   ├── Content.svelte
│   │   │   ├── ContentSlot.svelte
│   │   │   └── scroll-state.ts      # createScrollState with cleanup
│   │   │
│   │   ├── responsive/
│   │   │   ├── regions.ts
│   │   │   ├── safe-zones.ts
│   │   │   ├── fluid.ts
│   │   │   └── presets.ts
│   │   │
│   │   ├── components/
│   │   │   ├── Stage.svelte
│   │   │   ├── Section.svelte       # Uses gsap.context() + $effect cleanup
│   │   │   └── ScrollContainer.svelte
│   │   │
│   │   ├── integrations/
│   │   │   └── threlte.ts           # useScrollProgress, GSAP-Threlte bridge
│   │   │
│   │   ├── dev/
│   │   │   ├── Debugger.svelte
│   │   │   ├── hmr.ts               # HMR-safe cleanup utilities
│   │   │   └── validation.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── experience/
│   │   ├── sections/
│   │   ├── components/
│   │   │   └── ThrelteScene.svelte  # Example 3D scene
│   │   └── index.ts
│   │
│   └── routes/
│       └── +page.svelte
│
├── scrollytelling.config.ts
├── panda.config.ts
└── package.json
```

---

## Migration from Violet Square

### Remove (Project-Specific)

- `brandEase`, `brandDurations`
- Hardcoded `chapterScrollRegions`
- 9 chapter timeline files
- `ProgressIndicator`
- `TextFragment`, `TypographyBeat`, `ConsentHotspot`
- `VioletMask`
- Word-count timing

### Keep/Refactor

- ScrollSmoother setup → `core/scroll.ts`
- GSAP plugin registration → `core/timeline.ts`
- `timeToScroll()` conversion → `core/timeline.ts`
- PandaCSS config → Add fluid tokens
- Layer concept → 3-tier system with groups

---

## Public API

```typescript
// Core
export { ScrollContainer, Stage, Section } from './components'
export { createTimeline, createExperience, initGSAP } from './core'
export { getScrollSmoother, killScrollSmoother } from './core/scroll'

// Accessibility & Capabilities
export { getMotionPreference, createReducedMotionTimeline } from './core/accessibility'
export { detectCapabilities, type Capabilities } from './core/capabilities'

// Layers
export { Layer, LayerGroup, LayerStack } from './layers'
export type { LayerConfig, Layer3D } from './layers/types'

// Content
export { Content, createScrollState, type ScrollState } from './content'

// Animation primitives
export {
  // Opacity
  fadeIn, fadeOut, crossfade,

  // Position
  slideIn, slideOut, pan,

  // Transform
  zoom, parallax, dimension,
  morph, mask, transform,

  // Text (SplitText + ScrambleText)
  textReveal, scrambleText,

  // SVG
  drawSVG, motionPath,

  // Timing
  stagger, combined,

  // Physics (CustomBounce/CustomWiggle/Inertia)
  followThrough, inertia, throwable,
} from './animation/primitives'

// Easing (CustomEase/CustomBounce/CustomWiggle)
export {
  brandEases,
  followThroughEases,
  createCustomEase,
} from './animation/easing'

// State transitions (Flip)
export {
  flip,
  captureState,
  animateStateChange,
} from './animation/flip'

// Input handling (Observer)
export {
  createObserver,
  createExperienceObserver,
} from './core/input'

// Responsive
export { type Region, type Position, type FluidSize, presets } from './responsive'

// Threlte integration
export { useScrollProgress, createGSAPThrelteBridge } from './integrations/threlte'

// Types
export type {
  ScrollytellingConfig,
  SectionConfig,
  LayerConfig,
  ContentConfig,
  AnimationConfig,
} from './types'

// Dev
export { Debugger } from './dev'
export { createVisibilityHandler } from './core/timeline'
```

---

## Minimal Usage Example

```typescript
// scrollytelling.config.ts
export default {
  totalDuration: 60,
  scrollSpeed: 65,

  experiences: {
    desktop: {
      match: '(orientation: landscape)',
      frame: { width: 1920, height: 1080, scaling: 'cover' },
    },
    mobile: {
      match: '(orientation: portrait)',
      frame: { width: 390, height: 844, scaling: 'contain' },
    },
  },

  fluid: {
    minViewport: 320,
    maxViewport: 1920,
    type: { base: [16, 20], scale: 1.25 },
    space: { base: [8, 12], scale: 1.5 },
  },
}
```

```typescript
// src/experience/sections/intro.ts
import { fadeIn, slideIn, parallax } from 'svelte-scrollytelling'
import Headline from '../components/Headline.svelte'

export const intro = {
  id: 'intro',

  layers: [
    { id: 'bg', src: '/bg.jpg', parallax: { speed: 0.6 } },
    { id: 'mg', src: '/subject.png' },
    { id: 'fg', src: '/foreground.png', parallax: { speed: 1.2 } },
  ],

  content: [
    {
      id: 'headline',
      component: Headline,
      props: { text: 'Welcome' },
      position: { preset: 'center' },
      at: 0,
    },
  ],

  animations: [
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },
    { target: 'mg', action: 'slideIn', direction: 'up', duration: 0.8, at: 0.3 },
    { target: 'headline', action: 'fadeIn', duration: 0.6, at: 0.5 },
  ],

  mobile: {
    content: [
      {
        id: 'headline',
        component: Headline,
        props: { text: 'Welcome', size: 'l' },
        position: { preset: 'center-top' },
        at: 0,
      },
    ],
  },
}
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ScrollContainer, Stage, Section, Debugger } from 'svelte-scrollytelling'
  import { intro, features, outro } from '$experience'
  import { dev } from '$app/environment'
</script>

<ScrollContainer>
  <Stage>
    <Section config={intro} />
    <Section config={features} />
    <Section config={outro} />
  </Stage>
</ScrollContainer>

{#if dev}
  <Debugger />
{/if}
```
