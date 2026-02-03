# svelte-scrollytelling

A general-purpose SvelteKit + GSAP scrollytelling boilerplate with time-based animation authoring, responsive positioning, and a composable animation system.

## Features

- **Time-Based Authoring** - Define animations in seconds, not scroll percentages
- **3-Tier Layer System** - BG/MG/FG with optional grouping for coordinated motion
- **Animation Primitives** - Composable animations based on [motion.zajno.com](https://motion.zajno.com/)
- **GSAP Escape Hatch** - Full GSAP power when you need it
- **Semantic Positioning** - Golden ratio, thirds, fifths, and safe zones
- **Fluid Sizing** - Utopia-style responsive typography and spacing
- **Desktop/Mobile Split** - Binary experience detection with complete variants
- **Visual Debugger** - Timeline scrubber, layer toggles, and state inspection
- **Full TypeScript** - Complete type safety with IntelliSense

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/svelte-scrollytelling.git
cd svelte-scrollytelling

# Install dependencies
npm install

# Start development
npm run dev
```

## Basic Usage

### Configure Your Experience

```typescript
// scrollytelling.config.ts
export default {
  totalDuration: 60,  // seconds
  scrollSpeed: 65,    // px/s

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

### Create a Section

```typescript
// src/experience/sections/hero.ts
import type { SectionConfig } from 'svelte-scrollytelling'
import Headline from '../components/Headline.svelte'

export const hero: SectionConfig = {
  id: 'hero',

  layers: [
    { id: 'bg', src: '/assets/bg.jpg', parallax: { speed: 0.6 } },
    { id: 'mg', src: '/assets/subject.png' },
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
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },
    { target: 'mg', action: 'slideIn', direction: 'up', duration: 0.8, at: 0.3 },
    { target: 'headline', action: 'fadeIn', duration: 0.6, at: 0.5 },
  ],
}
```

### Render the Experience

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ScrollContainer, Stage, Section, Debugger } from 'svelte-scrollytelling'
  import { hero, features, outro } from '$experience'
  import { dev } from '$app/environment'
</script>

<ScrollContainer>
  <Stage>
    <Section config={hero} />
    <Section config={features} />
    <Section config={outro} />
  </Stage>
</ScrollContainer>

{#if dev}
  <Debugger />
{/if}
```

## Animation Primitives

All primitives return GSAP-compatible configurations:

| Category | Primitives |
|----------|------------|
| Opacity | `fadeIn`, `fadeOut`, `crossfade` |
| Position | `slideIn`, `slideOut`, `pan` |
| Scale | `zoom`, `scale` |
| Depth | `parallax`, `dimension` |
| Effects | `morph`, `mask` |
| Sequencing | `stagger`, `followThrough` |
| Combined | `combined`, `transform` |

### Example

```typescript
animations: [
  // Simple fade
  { target: 'bg', action: 'fadeIn', at: 0 },

  // Slide with direction
  { target: 'title', action: 'slideIn', direction: 'up', distance: 50, at: 0.5 },

  // Staggered reveal
  {
    action: 'stagger',
    targets: ['card-1', 'card-2', 'card-3'],
    animation: { action: 'fadeIn', duration: 0.4 },
    delay: 0.1,
    at: 2,
  },

  // GSAP escape hatch
  {
    target: 'hero',
    action: 'gsap',
    at: 3,
    gsap: {
      keyframes: [
        { scale: 1, rotation: 0 },
        { scale: 1.1, rotation: 5, duration: 0.5 },
      ],
    },
  },
]
```

## Position Presets

Semantic positioning based on design fundamentals:

```typescript
// Golden ratio
position: { preset: 'golden-left' }   // 38.2%
position: { preset: 'golden-right' }  // 61.8%

// Rule of thirds
position: { preset: 'third-left' }
position: { preset: 'thirds-intersect-tl' }

// Rule of fifths
position: { preset: 'fifth-2' }

// Center variants
position: { preset: 'center' }
position: { preset: 'center-left' }
```

## Mobile Variants

Define completely different experiences for mobile:

```typescript
const section: SectionConfig = {
  id: 'hero',
  layers: [...],
  content: [...],
  animations: [...],

  mobile: {
    layers: [
      { id: 'bg', src: '/assets/bg-mobile.jpg' },  // Different asset
    ],
    content: [
      {
        id: 'headline',
        props: { text: 'Welcome', size: 'l' },
        position: { preset: 'center-top' },
      },
    ],
  },
}
```

## Documentation

- [Getting Started](./docs/guides/getting-started.md)
- [API Reference](./docs/api/)
- [Animation Primitives](./docs/api/primitives.md)
- [Responsive Design](./docs/guides/responsive-design.md)

## Tech Stack

- **SvelteKit 5** with Svelte 5 runes
- **GSAP** with ScrollTrigger (ScrollSmoother optional)
- **PandaCSS** for styling
- **TypeScript** for type safety

## License

MIT
