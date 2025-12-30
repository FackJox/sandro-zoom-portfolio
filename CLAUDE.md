# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Overview

**svelte-scrollytelling** is a general-purpose SvelteKit + GSAP scrollytelling boilerplate. It provides:

- Time-based animation authoring (After Effects style)
- 3-tier layer system (BG/MG/FG) with optional grouping
- Composable animation primitives + GSAP escape hatch
- Responsive positioning with semantic regions and fluid sizing
- Binary desktop/mobile experience split
- Full TypeScript support with config validation

## Development Commands

```bash
npm run dev          # Start dev server (runs panda codegen first)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript/Svelte type checking
npm run lint         # Prettier + ESLint
npm run panda        # Regenerate styled-system from panda.config.ts
```

## Architecture

### Project Structure

```
src/lib/
├── core/                 # Timeline, scroll, frame, experience detection
│   ├── gsap.ts          # GSAP plugin registration
│   ├── timeline.ts      # Master timeline creation
│   ├── scroll.ts        # ScrollSmoother integration
│   ├── frame.ts         # Reference frame scaling
│   └── experience.ts    # Desktop/mobile detection
│
├── animation/           # Animation system
│   ├── primitives/      # Individual animation primitives
│   │   ├── fade.ts      # fadeIn, fadeOut, crossfade
│   │   ├── slide.ts     # slideIn, slideOut, pan
│   │   ├── zoom.ts      # zoom, scale
│   │   ├── parallax.ts  # scroll/mouse parallax
│   │   ├── dimension.ts # z-depth effects
│   │   ├── morph.ts     # SVG morphing
│   │   ├── mask.ts      # Mask reveal effects
│   │   ├── stagger.ts   # Sequenced animations
│   │   └── follow-through.ts # Physics-based settle
│   ├── easing.ts        # Named easing constants
│   ├── composer.ts      # Combine multiple primitives
│   └── gsap-passthrough.ts # GSAP escape hatch
│
├── layers/              # Layer rendering
│   ├── Layer.svelte     # Single layer (img/video)
│   ├── LayerGroup.svelte # Grouped layers
│   └── LayerStack.svelte # Render all layers
│
├── content/             # Content components
│   ├── Content.svelte   # Component wrapper
│   ├── ContentSlot.svelte # Positioned slot
│   └── scroll-state.ts  # ScrollState injection
│
├── responsive/          # Responsive system
│   ├── regions.ts       # Semantic regions (thirds, etc.)
│   ├── presets.ts       # Position presets (golden ratio)
│   ├── safe-zones.ts    # Device safe zones
│   ├── fluid.ts         # Utopia-style fluid sizing
│   └── position.ts      # Position resolver
│
├── components/          # Main components
│   ├── ScrollContainer.svelte
│   ├── Stage.svelte
│   └── Section.svelte
│
├── dev/                 # Developer tools
│   ├── Debugger.svelte  # Visual timeline debugger
│   ├── hmr.ts           # HMR scroll preservation
│   └── validation.ts    # Config validation
│
├── types/               # TypeScript definitions
│   └── index.ts         # All type exports
│
└── index.ts             # Public API exports
```

### Path Aliases

```
$lib         → src/lib
$experience  → src/experience
$styled      → styled-system
svelte-scrollytelling → src/lib/index.ts
```

## Core Concepts

### Timeline Model

Everything is measured in **seconds**, not scroll percentages:

```typescript
// scrollytelling.config.ts
export default {
  totalDuration: 60,    // 60 seconds at perfect pace
  scrollSpeed: 65,      // 65px/s comfortable reading speed
}
```

Time converts to scroll position: `scrollPosition = timeSeconds / totalDuration`

### Section Structure

Sections contain layers, content, and animations:

```typescript
const section: SectionConfig = {
  id: 'hero',
  layers: [...],       // Visual layers (BG/MG/FG)
  content: [...],      // Svelte components
  animations: [...],   // Time-based animations
  mobile: {...},       // Mobile variant (optional)
}
```

Section duration is derived from animations (last animation end time).

### Layer System

Three standard layers with semantic z-indices:

| Layer | Z-Index | Purpose |
|-------|---------|---------|
| BG    | 0       | Backgrounds, environments |
| MG    | 50      | **Primary subjects** (main content) |
| FG    | 100     | Foreground framing, overlays |

Groups allow coordinated motion:

```typescript
layers: [
  {
    id: 'parallax-bg',
    type: 'group',
    children: [
      { id: 'sky', src: '/sky.png', z: 0 },
      { id: 'clouds', src: '/clouds.png', z: 5 },
    ]
  },
]
```

### Animation Primitives

Based on [motion.zajno.com](https://motion.zajno.com/):

```typescript
// Opacity
fadeIn(duration?, ease?)
fadeOut(duration?, ease?)
crossfade(toTarget, duration?, ease?)

// Position
slideIn(direction, distance?, duration?, ease?)
slideOut(direction, distance?, duration?, ease?)
pan({ x?, y?, duration?, ease? })

// Scale
zoom({ scale: [from, to], pan?, rotate?, duration?, ease? })

// Depth
parallax({ speed, axis?, trigger? })
dimension({ z?, recede?, approach?, duration?, ease? })

// Effects
morph(toShape, duration?, ease?)
mask({ shape, content: { pan?, scale?, rotate? }, duration?, ease? })

// Sequencing
stagger(targets[], { animation, delay, overlap?, direction? })
followThrough({ settle, wobble?, duration?, ease? })

// Combined
combined(animations[])
```

### Time-Based Animation Authoring

Animations use absolute or relative timing:

```typescript
animations: [
  { target: 'bg', action: 'fadeIn', at: 0, duration: 1 },
  { target: 'title', action: 'slideIn', at: 0.5, direction: 'up' },
  { target: 'subtitle', at: '+=0.2' },     // 0.2s after previous
  { target: 'cta', at: 'title+0.3' },      // 0.3s after title starts
]
```

### Responsive System

**Binary Experience Split:**
- Desktop: `(orientation: landscape), (pointer: fine)`
- Mobile: `(orientation: portrait) and (pointer: coarse)`

**Semantic Positioning:**
```typescript
position: { preset: 'golden-left' }        // 38.2% from left
position: { preset: 'thirds-intersect-tl' } // Top-left power point
position: { region: 'center', vAlign: 'top' }
```

**Fluid Sizing (Utopia-style):**
```typescript
fluid: {
  type: { base: [16, 20], scale: 1.25 },
  space: { base: [8, 12], scale: 1.5 },
}
// Generates: --text-m, --text-l, --space-m, etc.
```

## Common Patterns

### Creating a Section

```typescript
// src/experience/sections/hero.ts
import type { SectionConfig } from 'svelte-scrollytelling'
import Headline from '../components/Headline.svelte'

export const hero: SectionConfig = {
  id: 'hero',

  layers: [
    { id: 'bg', src: '/assets/hero-bg.jpg' },
    { id: 'mg', src: '/assets/character.png' },
    { id: 'fg', src: '/assets/foreground.png', parallax: { speed: 1.2 } },
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
    { target: 'bg', action: 'fadeIn', at: 0, duration: 1 },
    { target: 'mg', action: 'slideIn', at: 0.3, direction: 'up', duration: 0.8 },
    { target: 'headline', action: 'fadeIn', at: 0.5, duration: 0.6 },
  ],
}
```

### Content Component with ScrollState

```svelte
<!-- src/experience/components/Progress.svelte -->
<script lang="ts">
  import type { ScrollState } from 'svelte-scrollytelling'

  interface Props {
    scrollState?: ScrollState
  }

  let { scrollState }: Props = $props()
</script>

<div style:width="{(scrollState?.progress ?? 0) * 100}%">
  Progress
</div>
```

### Mobile Variant

```typescript
export const hero: SectionConfig = {
  id: 'hero',
  layers: [...],
  content: [...],
  animations: [...],

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

### GSAP Escape Hatch

```typescript
animations: [
  {
    target: 'character',
    action: 'gsap',
    at: 2,
    gsap: {
      keyframes: [
        { x: 0, rotation: 0 },
        { x: 100, rotation: 15, duration: 0.5 },
      ],
      ease: 'elastic.out',
    }
  }
]
```

## Key Files Reference

| Purpose | File |
|---------|------|
| Root config | `scrollytelling.config.ts` |
| Type definitions | `src/lib/types/index.ts` |
| Public API | `src/lib/index.ts` |
| GSAP setup | `src/lib/core/gsap.ts` |
| PandaCSS config | `panda.config.ts` |

## Guidelines

### Code Style

- Use Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props()`
- Full TypeScript with JSDoc for all exports
- Use PandaCSS for styling: `import { css } from '$styled/css'`
- Data attributes for GSAP targeting: `data-layer`, `data-content`, `data-section`

### Animation Best Practices

- Define durations in seconds (human-readable)
- Use named easing from the easing module
- Prefer primitives over raw GSAP for consistency
- Use `combined()` for multi-property animations
- Keep section animations under 30 seconds for pacing

### Responsive Best Practices

- Design desktop first, add `mobile` variant for portrait
- Use semantic presets over explicit coordinates
- Test both orientations on tablet
- Respect `prefers-reduced-motion`

### Performance

- Layer images should be optimized (WebP, proper sizing)
- Limit to 5-7 layers per section for performance
- Use `parallax: true` shorthand for auto speed calculation
- Debugger is tree-shaken in production builds
