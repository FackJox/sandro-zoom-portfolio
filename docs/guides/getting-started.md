# Getting Started with svelte-scrollytelling

This guide walks you through creating your first scrollytelling experience.

## Prerequisites

- Node.js 18+
- Basic familiarity with Svelte/SvelteKit
- Understanding of GSAP concepts (helpful but not required)

## Installation

```bash
# Clone the boilerplate
git clone https://github.com/your-username/svelte-scrollytelling.git
cd svelte-scrollytelling

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
src/
├── lib/                    # The svelte-scrollytelling library
├── experience/            # Your scrollytelling content
│   ├── sections/         # Section configurations
│   └── components/       # Custom content components
└── routes/
    └── +page.svelte      # Main experience page
```

## Configuration

The root `scrollytelling.config.ts` controls global settings:

```typescript
export default {
  // Total experience duration in seconds
  totalDuration: 60,

  // Scroll speed (pixels per second)
  scrollSpeed: 65,

  // Desktop and mobile experiences
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

  // Fluid typography and spacing
  fluid: {
    minViewport: 320,
    maxViewport: 1920,
    type: { base: [16, 20], scale: 1.25 },
    space: { base: [8, 12], scale: 1.5 },
  },
}
```

## Creating Your First Section

### 1. Create a Section Configuration

```typescript
// src/experience/sections/intro.ts
import type { SectionConfig } from 'svelte-scrollytelling'
import Title from '../components/Title.svelte'

export const intro: SectionConfig = {
  id: 'intro',

  // Visual layers (back to front)
  layers: [
    { id: 'bg', src: '/assets/intro-bg.jpg' },
    { id: 'mg', src: '/assets/subject.png' },
  ],

  // Content components
  content: [
    {
      id: 'title',
      component: Title,
      props: { text: 'Welcome to the Journey' },
      position: { preset: 'center' },
      at: 0,
    },
  ],

  // Animations (time-based in seconds)
  animations: [
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },
    { target: 'mg', action: 'slideIn', direction: 'up', at: 0.5 },
    { target: 'title', action: 'fadeIn', at: 1 },
  ],
}
```

### 2. Create a Content Component

```svelte
<!-- src/experience/components/Title.svelte -->
<script lang="ts">
  interface Props {
    text: string
    size?: 'l' | 'xl' | '2xl'
  }

  let { text, size = 'xl' }: Props = $props()
</script>

<h1 class="title title-{size}">{text}</h1>

<style>
  .title {
    font-family: var(--font-display);
    color: white;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  .title-l { font-size: var(--text-l); }
  .title-xl { font-size: var(--text-xl); }
  .title-2xl { font-size: var(--text-2xl); }
</style>
```

### 3. Export Your Sections

```typescript
// src/experience/index.ts
export { intro } from './sections/intro'
```

### 4. Render the Experience

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ScrollContainer, Stage, Section, Debugger } from 'svelte-scrollytelling'
  import { intro } from '$experience'
  import { dev } from '$app/environment'
</script>

<ScrollContainer>
  <Stage>
    <Section config={intro} />
  </Stage>
</ScrollContainer>

{#if dev}
  <Debugger />
{/if}
```

## Understanding Time-Based Animation

Unlike traditional scroll-based animation where you work with percentages, svelte-scrollytelling uses **seconds**:

```typescript
animations: [
  // This animation starts at 0 seconds and lasts 1 second
  { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },

  // This starts at 2 seconds
  { target: 'title', action: 'fadeIn', at: 2 },

  // This starts 0.5 seconds after the previous animation ends
  { target: 'subtitle', action: 'fadeIn', at: '+=0.5' },
]
```

The system converts time to scroll position based on your `totalDuration` and `scrollSpeed` settings.

## Layer System

Layers stack from background to foreground:

| Layer | Z-Index | Purpose |
|-------|---------|---------|
| `bg` | 0 | Backgrounds |
| `mg` | 50 | Main subjects |
| `fg` | 100 | Foreground elements |

```typescript
layers: [
  { id: 'bg', src: '/sky.jpg' },                    // z=0
  { id: 'clouds', src: '/clouds.png', z: 10 },      // z=10
  { id: 'mg', src: '/character.png' },              // z=50
  { id: 'fg', src: '/leaves.png' },                 // z=100
]
```

## Position Presets

Use design-fundamental positions:

```typescript
// Golden ratio
position: { preset: 'golden-left' }   // 38.2% from left

// Rule of thirds
position: { preset: 'thirds-intersect-tl' }  // Top-left power point

// Center variants
position: { preset: 'center-top' }    // Center horizontal, 25% from top
```

## Adding Multiple Sections

```typescript
// src/experience/sections/outro.ts
export const outro: SectionConfig = {
  id: 'outro',
  layers: [
    { id: 'bg', src: '/assets/outro-bg.jpg' },
  ],
  content: [
    {
      id: 'farewell',
      component: Title,
      props: { text: 'The End' },
      position: { preset: 'center' },
      at: 0,
    },
  ],
  animations: [
    { target: 'bg', action: 'fadeIn', at: 0 },
    { target: 'farewell', action: 'fadeIn', at: 1 },
  ],
}
```

```typescript
// src/experience/index.ts
export { intro } from './sections/intro'
export { outro } from './sections/outro'
```

```svelte
<!-- src/routes/+page.svelte -->
<ScrollContainer>
  <Stage>
    <Section config={intro} />
    <Section config={outro} />
  </Stage>
</ScrollContainer>
```

## Using the Debugger

The debugger shows:
- Current time and progress
- Active section
- Running animations
- Layer visibility toggles

Enable it in development:

```svelte
{#if dev}
  <Debugger position="bottom-right" />
{/if}
```

## Next Steps

- [Animation Primitives](./animations.md) - Learn all available animations
- [Responsive Design](./responsive-design.md) - Desktop and mobile experiences
- [Creating Sections](./creating-sections.md) - Advanced section patterns
