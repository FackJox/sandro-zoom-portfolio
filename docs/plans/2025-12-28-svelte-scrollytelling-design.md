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

---

## Animation System

### Easing Primitives

```typescript
ease: {
  linear      // Constant speed, mechanical
  ease        // Subtle acceleration/deceleration
  easeIn      // Slow start, accelerates
  easeOut     // Fast start, decelerates
  cubic       // Extended accel/decel, fast middle
  // GSAP escape: any GSAP ease string
}
```

### Animation Primitives (Based on motion.zajno.com)

**Opacity:**
```typescript
fadeIn(duration?, ease?)
fadeOut(duration?, ease?)
crossfade(toTarget, duration?, ease?)
```

**Transform & Morph:**
```typescript
morph(toShape, duration?, ease?)           // SVG path morphing
transform(props: {
  scale?: [from, to],
  rotate?: [from, to],
  skew?: [from, to],
  duration?, ease?
})
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

**Follow-Through:**
```typescript
followThrough(props: {
  settle: number,
  wobble?: number,
  duration?, ease?
})
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
│   │   │   ├── timeline.ts
│   │   │   ├── scroll.ts
│   │   │   ├── frame.ts
│   │   │   └── experience.ts
│   │   │
│   │   ├── animation/
│   │   │   ├── primitives/
│   │   │   │   ├── fade.ts
│   │   │   │   ├── slide.ts
│   │   │   │   ├── zoom.ts
│   │   │   │   ├── parallax.ts
│   │   │   │   ├── morph.ts
│   │   │   │   ├── mask.ts
│   │   │   │   ├── dimension.ts
│   │   │   │   ├── stagger.ts
│   │   │   │   └── index.ts
│   │   │   ├── easing.ts
│   │   │   ├── composer.ts
│   │   │   └── gsap-passthrough.ts
│   │   │
│   │   ├── layers/
│   │   │   ├── Layer.svelte
│   │   │   ├── LayerGroup.svelte
│   │   │   ├── LayerStack.svelte
│   │   │   └── types.ts
│   │   │
│   │   ├── content/
│   │   │   ├── Content.svelte
│   │   │   ├── ContentSlot.svelte
│   │   │   └── scroll-state.ts
│   │   │
│   │   ├── responsive/
│   │   │   ├── regions.ts
│   │   │   ├── safe-zones.ts
│   │   │   ├── fluid.ts
│   │   │   └── presets.ts
│   │   │
│   │   ├── components/
│   │   │   ├── Stage.svelte
│   │   │   ├── Section.svelte
│   │   │   └── ScrollContainer.svelte
│   │   │
│   │   ├── dev/
│   │   │   ├── Debugger.svelte
│   │   │   ├── hmr.ts
│   │   │   └── validation.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── experience/
│   │   ├── sections/
│   │   ├── components/
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
export { createTimeline, createExperience } from './core'

// Layers
export { Layer, LayerGroup, LayerStack } from './layers'

// Content
export { Content, type ScrollState } from './content'

// Animation primitives
export {
  fadeIn, fadeOut, crossfade,
  slideIn, slideOut, pan,
  zoom, parallax, dimension,
  morph, mask,
  stagger, followThrough,
  combined,
} from './animation/primitives'

// Responsive
export { type Region, type Position, type FluidSize, presets } from './responsive'

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
