# Animation Primitives

Complete reference for all 22+ animation primitives with examples.

## Overview

Animation primitives are factory functions that add animations to GSAP timelines. They abstract common patterns while remaining composable.

### Usage Pattern

```typescript
// In section config
animations: [
  { target: 'headline', action: 'fadeIn', duration: 0.5, at: 0 },
  { target: 'headline', action: 'slideIn', direction: 'up', at: 0 }
]
```

### Direct Usage

```typescript
import { fadeIn } from '$lib/animation/primitives'

const tl = gsap.timeline()
fadeIn(element, { duration: 0.5 }, tl)
```

---

## Opacity Animations

**File:** `src/lib/animation/primitives/fade.ts`

### fadeIn

Fade element from transparent to visible.

```typescript
{ target: 'element', action: 'fadeIn', duration: 0.5, at: 0 }

// Full options
{
  target: 'element',
  action: 'fadeIn',
  duration: 0.5,
  at: 0,
  ease: 'power2.out',
  from: 0,      // Starting opacity (default: 0)
  to: 1         // Ending opacity (default: 1)
}
```

**Implementation:**
```typescript
export function fadeIn(
  target: gsap.TweenTarget,
  props: FadeProps,
  timeline: gsap.core.Timeline
): void {
  timeline.fromTo(target,
    { autoAlpha: props.from ?? 0 },
    {
      autoAlpha: props.to ?? 1,
      duration: props.duration ?? 0.5,
      ease: props.ease ?? 'power2.out'
    },
    props.position
  )
}
```

### fadeOut

Fade element to transparent.

```typescript
{ target: 'element', action: 'fadeOut', duration: 0.5, at: 2 }

// Options same as fadeIn, but defaults reversed
```

### crossfade

Fade out one element while fading in another.

```typescript
{
  target: 'outgoing',
  action: 'crossfade',
  crossfadeTo: 'incoming',
  duration: 0.8,
  at: 1.5,
  overlap: 0.5  // Overlap ratio (default: 0.5)
}
```

---

## Position Animations

**File:** `src/lib/animation/primitives/slide.ts`

### slideIn

Slide element into view from a direction.

```typescript
{
  target: 'element',
  action: 'slideIn',
  direction: 'up',     // 'up' | 'down' | 'left' | 'right'
  duration: 0.6,
  at: 0.5,
  distance: 100,       // Pixels (default: 100)
  ease: 'power3.out'
}
```

**Direction offsets:**
- `up`: `{ y: distance }` → `{ y: 0 }`
- `down`: `{ y: -distance }` → `{ y: 0 }`
- `left`: `{ x: distance }` → `{ x: 0 }`
- `right`: `{ x: -distance }` → `{ x: 0 }`

### slideOut

Slide element out of view.

```typescript
{
  target: 'element',
  action: 'slideOut',
  direction: 'down',
  duration: 0.5,
  at: 3
}
```

### pan

Continuous movement (for parallax-like effects).

```typescript
{
  target: 'element',
  action: 'pan',
  x: -200,        // End x position
  y: 0,           // End y position
  duration: 2,
  at: 0,
  ease: 'none'    // Linear for scroll sync
}
```

---

## Scale Animations

**File:** `src/lib/animation/primitives/zoom.ts`

### zoom

Scale element with optional pan and rotation.

```typescript
{
  target: 'element',
  action: 'zoom',
  scale: 1.5,          // Scale factor
  duration: 1,
  at: 0
}

// Full options
{
  target: 'element',
  action: 'zoom',
  scale: 1.5,
  from: 1,             // Starting scale
  x: 100,              // Pan x
  y: -50,              // Pan y
  rotation: 5,         // Degrees
  transformOrigin: 'center center',
  duration: 1.5,
  ease: 'power2.inOut'
}
```

### scaleIn

Scale from small to normal.

```typescript
{
  target: 'element',
  action: 'scaleIn',
  from: 0.8,
  duration: 0.5
}
```

### scaleOut

Scale from normal to small/large.

```typescript
{
  target: 'element',
  action: 'scaleOut',
  to: 0,
  duration: 0.5
}
```

---

## Parallax Animations

**File:** `src/lib/animation/primitives/parallax.ts`

### parallax

Creates scroll-linked movement at different speeds.

```typescript
{
  target: 'background',
  action: 'parallax',
  speed: 0.5,        // < 1 = slower, > 1 = faster than scroll
  axis: 'y',         // 'x' | 'y' | 'both'
  duration: 'full'   // 'full' = entire section
}
```

### parallaxLayer

Automatic parallax based on z-index.

```typescript
{
  target: 'layer',
  action: 'parallaxLayer',
  z: 0,              // Z position (0=back, 100=front)
  intensity: 1       // Multiplier
}

// Speed calculation:
// z: 0   → speed: 0.5  (slow)
// z: 50  → speed: 1.0  (normal)
// z: 100 → speed: 1.5  (fast)
```

### ScrollSmoother Parallax

Declarative parallax via data attributes (handled by ScrollSmoother):

```html
<img data-speed="0.5" src="bg.jpg" />
<img data-speed="1.3" src="fg.jpg" />
```

---

## Transform Animations

**File:** `src/lib/animation/primitives/transform.ts`

### transform

General-purpose transform animation.

```typescript
{
  target: 'element',
  action: 'transform',
  scale: 1.2,
  rotation: 45,
  skewX: 10,
  skewY: 0,
  x: 100,
  y: 50,
  transformOrigin: 'center center',
  duration: 0.8
}
```

### rotate

Rotation animation.

```typescript
{
  target: 'element',
  action: 'rotate',
  rotation: 360,     // Degrees
  duration: 1,
  ease: 'power1.inOut'
}
```

### flip

3D flip effect.

```typescript
{
  target: 'element',
  action: 'flip',
  axis: 'y',         // 'x' | 'y'
  degrees: 180,
  duration: 0.6
}
```

---

## Stagger Animations

**File:** `src/lib/animation/primitives/stagger.ts`

### stagger

Apply animation to multiple targets with offset.

```typescript
{
  target: '.cards',   // Selector matching multiple elements
  action: 'stagger',
  animation: 'fadeIn',
  stagger: 0.1,       // Delay between each
  from: 'start',      // 'start' | 'end' | 'center' | 'random'
  duration: 0.5
}
```

### staggerFadeIn

Staggered fade in.

```typescript
{
  target: '.list-items',
  action: 'staggerFadeIn',
  stagger: 0.08,
  duration: 0.4
}
```

### staggerSlideIn

Staggered slide in.

```typescript
{
  target: '.cards',
  action: 'staggerSlideIn',
  direction: 'up',
  stagger: 0.1,
  distance: 50
}
```

### staggerScaleIn

Staggered scale in.

```typescript
{
  target: '.icons',
  action: 'staggerScaleIn',
  from: 0,
  stagger: 0.05
}
```

---

## Text Animations

**File:** `src/lib/animation/primitives/text.ts`

Requires SplitText plugin (GSAP Club).

### textReveal

Animate characters, words, or lines.

```typescript
{
  target: 'headline',
  action: 'textReveal',
  type: 'chars',       // 'chars' | 'words' | 'lines'
  stagger: 0.03,
  duration: 0.5,
  direction: 'up',     // 'up' | 'down' | 'left' | 'right' | 'none'
  distance: 20
}
```

**Implementation:**
```typescript
export function textReveal(
  target: gsap.TweenTarget,
  props: TextRevealProps,
  timeline: gsap.core.Timeline
): void {
  const element = typeof target === 'string'
    ? document.querySelector(target)
    : target as Element

  const split = new SplitText(element, {
    type: props.type ?? 'chars'
  })

  // Track for cleanup
  splitTextInstances.push(split)

  const targets = split[props.type ?? 'chars']

  timeline.from(targets, {
    autoAlpha: 0,
    y: props.direction === 'up' ? props.distance : 0,
    stagger: props.stagger ?? 0.03,
    duration: props.duration ?? 0.5,
    ease: props.ease ?? 'power2.out'
  }, props.position)
}
```

### scrambleText

Decode/scramble text effect.

```typescript
{
  target: 'code-text',
  action: 'scrambleText',
  text: 'Final text',       // Text to reveal
  chars: 'upperCase',       // 'upperCase' | 'lowerCase' | 'numbers' | custom
  speed: 1,
  delimiter: ''
}
```

### typewriter

Character-by-character typing.

```typescript
{
  target: 'terminal',
  action: 'typewriter',
  text: 'Hello, World!',
  speed: 0.05,             // Seconds per character
  cursor: true
}
```

### textWave

Wave effect on characters.

```typescript
{
  target: 'wavy-text',
  action: 'textWave',
  amplitude: 10,
  frequency: 0.5
}
```

### textBlurReveal

Blur-to-focus text reveal.

```typescript
{
  target: 'title',
  action: 'textBlurReveal',
  blur: 20,               // Starting blur (px)
  duration: 0.8
}
```

### Cleanup

```typescript
import { revertAllSplits } from '$lib/animation/primitives/text'

// Call on component destroy
onDestroy(() => {
  revertAllSplits()
})
```

---

## SVG Animations

### drawSVG

**File:** `src/lib/animation/primitives/draw-svg.ts`

Animate SVG stroke drawing.

```typescript
{
  target: 'path',
  action: 'drawSVG',
  from: '0%',              // Start point
  to: '100%',              // End point
  duration: 2,
  ease: 'power2.inOut'
}

// Draw from center outward
{
  target: 'circle',
  action: 'drawSVG',
  from: '50% 50%',
  to: '0% 100%'
}
```

### morph

**File:** `src/lib/animation/primitives/morph.ts`

Morph one SVG shape to another.

```typescript
{
  target: '#shape1',
  action: 'morph',
  to: '#shape2',           // Target shape
  duration: 1,
  shapeIndex: 'auto',      // Point matching
  origin: '50% 50%'
}
```

### motionPath

**File:** `src/lib/animation/primitives/motion-path.ts`

Animate element along SVG path.

```typescript
{
  target: 'icon',
  action: 'motionPath',
  path: '#curve',          // SVG path element
  align: '#curve',
  autoRotate: true,        // Orient to path
  start: 0,                // 0-1
  end: 1,
  duration: 3
}
```

---

## Physics Animations

**File:** `src/lib/animation/primitives/physics.ts`

### inertia

Momentum-based animation (requires InertiaPlugin).

```typescript
{
  target: 'slider',
  action: 'inertia',
  x: { velocity: 500, min: 0, max: 1000 },
  resistance: 200
}
```

### followThrough

Secondary motion (overshoot, settle).

```typescript
{
  target: 'element',
  action: 'followThrough',
  type: 'bounce',          // 'bounce' | 'wiggle' | 'settle'
  strength: 0.5,
  duration: 1
}
```

### bounce

Bounce effect.

```typescript
{
  target: 'ball',
  action: 'bounce',
  y: -200,
  bounces: 3,
  squash: 0.3,            // Squash amount
  duration: 1.5
}
```

### wiggle

Oscillating wiggle.

```typescript
{
  target: 'notification',
  action: 'wiggle',
  amplitude: 10,
  frequency: 5,
  axis: 'x',
  duration: 0.5
}
```

### spring

Spring physics.

```typescript
{
  target: 'element',
  action: 'spring',
  to: { x: 100 },
  mass: 1,
  stiffness: 100,
  damping: 10
}
```

### gravityDrop

Gravity-based fall.

```typescript
{
  target: 'object',
  action: 'gravityDrop',
  distance: 500,
  bounce: 0.6,
  duration: 1.2
}
```

---

## Mask Animations

**File:** `src/lib/animation/primitives/mask.ts`

### mask

Reveal content through animated mask.

```typescript
{
  target: 'content',
  action: 'mask',
  shape: 'circle',         // 'circle' | 'rect' | 'inset' | 'path'
  from: 0,                 // Starting size/progress
  to: 100,                 // Ending size/progress
  x: '50%',
  y: '50%',
  duration: 1
}
```

### circleReveal

Circular reveal from center.

```typescript
{
  target: 'image',
  action: 'circleReveal',
  x: '50%',
  y: '50%',
  duration: 1.2
}
```

### wipeReveal

Directional wipe reveal.

```typescript
{
  target: 'panel',
  action: 'wipeReveal',
  direction: 'left',       // 'left' | 'right' | 'up' | 'down'
  duration: 0.8
}
```

### insetReveal

Inset rectangle reveal.

```typescript
{
  target: 'content',
  action: 'insetReveal',
  from: '50%',             // All sides at 50%
  to: '0%',                // Full reveal
  duration: 1
}
```

---

## Dimension Animations

**File:** `src/lib/animation/primitives/dimension.ts`

Z-depth and 3D perspective animations.

### dimension

Animate z-depth position.

```typescript
{
  target: 'card',
  action: 'dimension',
  z: -200,                 // Z translate
  opacity: 0.5,            // Fade with depth
  duration: 0.8
}
```

### recede

Push element back in z-space.

```typescript
{
  target: 'background',
  action: 'recede',
  distance: 300,
  scale: 0.8,
  duration: 1
}
```

### approach

Bring element forward.

```typescript
{
  target: 'focus-element',
  action: 'approach',
  distance: 100,
  scale: 1.1,
  duration: 0.6
}
```

### layeredDepth

Animate multiple layers at different depths.

```typescript
{
  target: '.depth-layers',
  action: 'layeredDepth',
  layers: [
    { selector: '.bg', z: -200, opacity: 0.6 },
    { selector: '.mg', z: 0, opacity: 1 },
    { selector: '.fg', z: 100, opacity: 1 }
  ],
  duration: 1.5
}
```

### flip3D

3D card flip.

```typescript
{
  target: 'card',
  action: 'flip3D',
  axis: 'y',
  degrees: 180,
  perspective: 1000,
  duration: 0.8
}
```

---

## Combined Animations

**File:** `src/lib/animation/primitives/combined.ts`

### combined

Run multiple animations on same target.

```typescript
{
  target: 'element',
  action: 'combined',
  animations: [
    { action: 'fadeIn', duration: 0.5 },
    { action: 'slideIn', direction: 'up', duration: 0.6 },
    { action: 'scaleIn', from: 0.9, duration: 0.5 }
  ],
  at: 0
}
```

### sequence

Animations in sequence.

```typescript
{
  target: 'element',
  action: 'sequence',
  animations: [
    { action: 'fadeIn', duration: 0.3 },
    { action: 'slideIn', duration: 0.5 },
    { action: 'bounce', duration: 0.2 }
  ]
}
```

### parallel

Animations in parallel (alias for combined).

```typescript
{
  target: 'element',
  action: 'parallel',
  animations: [...]
}
```

### keyframes

GSAP keyframes animation.

```typescript
{
  target: 'element',
  action: 'keyframes',
  keyframes: [
    { x: 0, y: 0, scale: 1, duration: 0.5 },
    { x: 100, y: -50, scale: 1.2, duration: 0.3 },
    { x: 200, y: 0, scale: 1, duration: 0.5 }
  ]
}
```

---

## GSAP Escape Hatch

**File:** `src/lib/animation/gsap-passthrough.ts`

When primitives aren't enough, use raw GSAP.

### gsapPassthrough

```typescript
{
  target: 'element',
  action: 'gsap',
  gsap: {
    to: { x: 100, rotation: 360, ease: 'elastic.out' },
    duration: 1
  }
}
```

### gsapFromTo

```typescript
{
  target: 'element',
  action: 'gsapFromTo',
  from: { x: -100, opacity: 0 },
  to: { x: 0, opacity: 1 },
  duration: 0.8
}
```

### gsapSet

Immediate property set.

```typescript
{
  target: 'element',
  action: 'gsapSet',
  props: { visibility: 'visible', zIndex: 100 }
}
```

### gsapCall

Timeline callback.

```typescript
{
  action: 'gsapCall',
  callback: () => console.log('Reached this point!'),
  at: 5
}
```

### gsapLabel

Add timeline label.

```typescript
{
  action: 'gsapLabel',
  label: 'section2Start',
  at: 10
}

// Reference in other animations
{ target: 'element', action: 'fadeIn', at: 'section2Start' }
{ target: 'other', action: 'slideIn', at: 'section2Start+0.3' }
```

---

## Easing Reference

**File:** `src/lib/animation/easing.ts`

### Core Easings

```typescript
'linear' | 'ease' | 'easeIn' | 'easeOut' | 'cubic'
```

### GSAP Easings

```typescript
'elastic' | 'bounce' | 'back' | 'expo' | 'circ'
'power1.in' | 'power1.out' | 'power1.inOut'
'power2.in' | 'power2.out' | 'power2.inOut'
'power3.in' | 'power3.out' | 'power3.inOut'
'power4.in' | 'power4.out' | 'power4.inOut'
```

### Brand Easings

```typescript
'enter'     // power2.out - elements entering
'exit'      // power2.inOut - elements leaving
'transform' // power3.out - transformations
'smooth'    // Custom smooth curve
'snappy'    // Quick, snappy motion
'dramatic'  // Slow start, fast end
```

### Custom Easing

```typescript
import { registerCustomEase } from '$lib/animation/easing'

registerCustomEase('myEase', 'M0,0 C0.4,0 0.2,1 1,1')

// Use in animations
{ ease: 'myEase' }
```

---

## Next Steps

- [Layer System](./layer-system.md) - Images, video, 3D layers
- [Content System](./content-system.md) - Positioning and scroll state
- [Patterns](./patterns.md) - Best practices
