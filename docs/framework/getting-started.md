# Getting Started

Quick setup guide for the svelte-scrollytelling boilerplate.

## Prerequisites

- Node.js 18+
- GSAP Club membership (for ScrollSmoother, SplitText, etc.)
- Basic understanding of Svelte 5 runes

## Installation

```bash
# Clone boilerplate
git clone <repo-url> my-project
cd my-project

# Install dependencies
npm install

# Add GSAP Club plugins (requires membership)
npm config set @gsap:registry https://npm.greensock.com
npm login --registry=https://npm.greensock.com
npm install gsap@npm:@gsap/shockingly

# Start development
npm run dev
```

## Project Configuration

Create or edit `src/lib/config/scrollytelling.config.ts`:

```typescript
import type { ScrollytellingConfig } from '$lib/types'

export const config: ScrollytellingConfig = {
  // Total experience duration in seconds
  totalDuration: 60,

  // Scroll speed in pixels per second (65 = comfortable reading pace)
  scrollSpeed: 65,

  // Reference frame for responsive scaling
  frame: {
    width: 1920,
    height: 1080,
    scaling: 'cover',  // 'cover' | 'contain' | 'fill'
    minScale: 0.5,
    maxScale: 2
  },

  // Desktop/mobile experience split
  experiences: {
    desktop: {
      match: '(orientation: landscape), (pointer: fine)',
      frame: { width: 1920, height: 1080, scaling: 'cover' }
    },
    mobile: {
      match: '(orientation: portrait) and (pointer: coarse)',
      frame: { width: 390, height: 844, scaling: 'contain' }
    }
  }
}
```

## Your First Section

### 1. Create Section Configuration

```typescript
// src/experience/sections/hero.ts
import type { SectionConfig } from '$lib/types'
import Headline from '$lib/components/Headline.svelte'

export const heroSection: SectionConfig = {
  id: 'hero',
  title: 'Hero Section',

  // Layers render behind content
  layers: [
    {
      id: 'background',
      src: '/images/hero-bg.jpg',
      z: 0,  // Background layer
      parallax: { speed: 0.5 }  // Slower than scroll
    },
    {
      id: 'subject',
      src: '/images/hero-subject.png',
      z: 50  // Midground layer
    },
    {
      id: 'foreground',
      src: '/images/hero-fg.png',
      z: 100,  // Foreground layer
      parallax: { speed: 1.3 }  // Faster than scroll
    }
  ],

  // Content positioned over layers
  content: [
    {
      id: 'headline',
      component: Headline,
      props: { text: 'Welcome to the Experience' },
      position: { preset: 'center' },
      at: 0  // Visible from start (seconds)
    }
  ],

  // Animation timeline
  animations: [
    // Fade in background immediately
    { target: 'background', action: 'fadeIn', duration: 1, at: 0 },

    // Subject slides up
    { target: 'subject', action: 'slideIn', direction: 'up', at: 0.3 },

    // Headline fades and slides in
    { target: 'headline', action: 'fadeIn', duration: 0.6, at: 0.5 },
    { target: 'headline', action: 'slideIn', direction: 'up', at: 0.5 },

    // Foreground parallax continues through scroll
    { target: 'foreground', action: 'fadeIn', at: 0.5 }
  ]
}
```

### 2. Create the Page

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ScrollContainer, Stage, Section } from '$lib'
  import { heroSection } from '$experience/sections/hero'
  import { dev } from '$app/environment'

  // Optional: import debugger for development
  let Debugger: typeof import('$lib/dev/Debugger.svelte').default
  if (dev) {
    import('$lib/dev/Debugger.svelte').then(m => Debugger = m.default)
  }
</script>

<ScrollContainer>
  <Stage>
    <Section config={heroSection} />
  </Stage>
</ScrollContainer>

{#if dev && Debugger}
  <svelte:component this={Debugger} />
{/if}
```

### 3. Create Content Component

```svelte
<!-- src/lib/components/Headline.svelte -->
<script lang="ts">
  let { text }: { text: string } = $props()
</script>

<h1 class="headline">{text}</h1>

<style>
  .headline {
    font-size: clamp(2rem, 5vw, 6rem);
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  }
</style>
```

## Adding More Sections

```typescript
// src/experience/sections/index.ts
export { heroSection } from './hero'
export { featuresSection } from './features'
export { outroSection } from './outro'
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ScrollContainer, Stage, Section } from '$lib'
  import { heroSection, featuresSection, outroSection } from '$experience/sections'
</script>

<ScrollContainer>
  <Stage>
    <Section config={heroSection} />
    <Section config={featuresSection} />
    <Section config={outroSection} />
  </Stage>
</ScrollContainer>
```

## Mobile Variants

Add mobile-specific overrides to any section:

```typescript
const section: SectionConfig = {
  id: 'hero',
  layers: [...],
  content: [...],
  animations: [...],

  // Mobile overrides (merged when detected)
  mobile: {
    content: [
      {
        id: 'headline',
        component: Headline,
        props: { text: 'Welcome', size: 'compact' },
        position: { preset: 'center-top' },  // Different position
        at: 0
      }
    ],
    animations: [
      // Simplified animations for mobile
      { target: 'headline', action: 'fadeIn', at: 0 }
    ]
  }
}
```

## Development Tools

### Timeline Debugger

The debugger shows:
- Current playback time and progress
- Section progress indicators
- Active animations
- Layer visibility toggles

```svelte
{#if dev}
  <Debugger />
{/if}
```

### GSDevTools

GSAP's visual timeline inspector:

```svelte
{#if dev}
  <GSDevTools />
{/if}
```

### Config Validation

Validate section configs in development:

```typescript
import { validateSection, logValidationResult } from '$lib/dev/validation'

const result = validateSection(heroSection)
if (!result.valid) {
  logValidationResult(result)
}
```

## Next Steps

- [Architecture](./architecture.md) - Understand the system design
- [Animation Primitives](./animation-primitives.md) - Learn all animation types
- [Layer System](./layer-system.md) - Master parallax and z-ordering
- [Patterns](./patterns.md) - Critical patterns to follow
