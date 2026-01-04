# Content System

Content positioning, scroll state tracking, and visibility management.

## Overview

Content components are positioned over layers and animated based on scroll progress. The content system provides:

- **Semantic positioning** - Presets, regions, coordinates
- **Scroll state** - Progress, velocity, direction
- **autoAlpha pattern** - No FOUC, accessible visibility
- **Performance tiers** - Conditional rendering

## Content Configuration

```typescript
interface ContentConfig {
  id: string
  component: typeof SvelteComponent
  props?: Record<string, unknown>
  position: PositionConfig
  at: number                    // Visibility start (seconds)
  until?: number                // Visibility end (seconds)
  injectScrollState?: boolean   // Pass scroll state as prop
  performanceTier?: PerformanceTier
}
```

### Basic Example

```typescript
{
  id: 'headline',
  component: Headline,
  props: { text: 'Welcome' },
  position: { preset: 'center' },
  at: 0
}
```

### With Scroll State

```typescript
{
  id: 'progress-indicator',
  component: ProgressBar,
  position: { preset: 'bottom-center' },
  at: 0,
  injectScrollState: true  // Component receives scrollState prop
}
```

## Position Configuration

### Presets

Named positions based on common layouts:

```typescript
position: { preset: 'center' }
position: { preset: 'golden-left' }
position: { preset: 'thirds-intersect-tl' }
```

**Available presets:**

| Preset | Description |
|--------|-------------|
| `center` | Viewport center |
| `center-top` | Top center |
| `center-bottom` | Bottom center |
| `left-center` | Left center |
| `right-center` | Right center |
| `top-left` | Top left corner |
| `top-right` | Top right corner |
| `bottom-left` | Bottom left corner |
| `bottom-right` | Bottom right corner |
| `golden-left` | Golden ratio from left |
| `golden-right` | Golden ratio from right |
| `golden-top` | Golden ratio from top |
| `golden-bottom` | Golden ratio from bottom |
| `thirds-intersect-tl` | Rule of thirds top-left |
| `thirds-intersect-tr` | Rule of thirds top-right |
| `thirds-intersect-bl` | Rule of thirds bottom-left |
| `thirds-intersect-br` | Rule of thirds bottom-right |

### Regions

9-grid semantic regions:

```
┌─────┬────────┬────────┬────────┬─────┐
│  1  │   2    │   3    │   4    │  5  │
├─────┼────────┼────────┼────────┼─────┤
│  6  │   7    │   8    │   9    │ 10  │
├─────┼────────┼────────┼────────┼─────┤
│ 11  │  12    │  13    │  14    │ 15  │
└─────┴────────┴────────┴────────┴─────┘
```

```typescript
position: { region: 7 }        // Center
position: { region: 1 }        // Top-left
position: { region: 13 }       // Bottom-center
```

### Coordinates

Direct x/y positioning:

```typescript
position: {
  x: '50%',
  y: '30%'
}

position: {
  x: 100,        // Pixels
  y: '25vh'      // Viewport units
}
```

### Alignment

Fine-tune positioning:

```typescript
position: {
  preset: 'center',
  vAlign: 'top',       // 'top' | 'center' | 'bottom'
  hAlign: 'left'       // 'left' | 'center' | 'right'
}
```

### Transform

Additional transform:

```typescript
position: {
  preset: 'center',
  transform: 'translateY(-20px)'
}
```

## Scroll State

**File:** `src/lib/content/scroll-state.ts`

### ScrollState Interface

```typescript
interface ScrollState {
  progress: number          // 0-1 within content's lifespan
  isVisible: boolean        // Currently in view
  direction: 'up' | 'down' | null
  velocity: number          // Scroll velocity
  sectionProgress: number   // 0-1 within section
  globalProgress: number    // 0-1 of entire experience
}
```

### Individual Element Tracking

```typescript
import { createScrollState } from '$lib/content/scroll-state'

let element: HTMLElement
let sectionElement: HTMLElement

$effect(() => {
  if (!element) return

  const { state, cleanup } = createScrollState(element, sectionElement)

  // state is reactive
  console.log(state.progress, state.isVisible)

  return cleanup
})
```

### Action Hook

Automatic cleanup with Svelte actions:

```svelte
<script>
  import { scrollStateAction } from '$lib/content/scroll-state'

  function handleState(state: ScrollState) {
    console.log(state.progress)
  }
</script>

<div use:scrollStateAction={{ onState: handleState }}>
  Content
</div>
```

### Global State

```typescript
import {
  getGlobalScrollState,
  setGlobalScrollProgress,
  setCurrentSection,
  resetGlobalScrollState
} from '$lib/content/scroll-state'

// Get current state
const state = getGlobalScrollState()
console.log(state.progress, state.currentSection)

// Set from ScrollContainer
setGlobalScrollProgress(0.5)
setCurrentSection('section-2')

// Reset on unmount
resetGlobalScrollState()
```

### Simple Progress Getter

```typescript
import { createScrollProgress } from '$lib/content/scroll-state'

const getProgress = createScrollProgress()

// In animation frame or effect
const progress = getProgress()  // 0-1
```

## autoAlpha Pattern

Content is mounted immediately but hidden with `autoAlpha: 0`.

### Why autoAlpha?

| Property | Behavior |
|----------|----------|
| `opacity: 0` | Invisible but occupies space, receives events |
| `visibility: hidden` | Hidden, no events, but sudden toggle |
| `autoAlpha: 0` | Both opacity:0 AND visibility:hidden |
| `autoAlpha: 1` | Both opacity:1 AND visibility:visible |

### Benefits

1. **GSAP always finds targets** - Elements exist in DOM
2. **No FOUC** - Hidden before animation starts
3. **Accessibility** - `visibility: hidden` = screen reader skip
4. **Smooth transitions** - Opacity animates, visibility toggles

### Implementation

```typescript
// Section timeline initialization
config.content?.forEach(content => {
  const el = container.querySelector(`[data-content="${content.id}"]`)
  if (el) {
    gsap.set(el, { autoAlpha: 0 })  // Start hidden
  }
})

// Animation reveals at correct time
animations: [
  { target: 'headline', action: 'fadeIn', at: 0.5 }
  // fadeIn uses autoAlpha internally
]
```

## Content Component

**File:** `src/lib/content/Content.svelte`

### Props

```typescript
interface Props {
  config: ContentConfig
  scrollProgress?: number
}
```

### Implementation

```svelte
<script lang="ts">
  import { resolvePosition } from '$lib/responsive/regions'
  import { isFeatureEnabled, detectCapabilities } from '$lib/core/capabilities'

  let { config, scrollProgress = 0 }: Props = $props()

  // Check performance tier
  const capabilities = detectCapabilities()
  const shouldRender = $derived(
    !config.performanceTier ||
    isFeatureEnabled(config.performanceTier, capabilities.tier)
  )

  // Resolve position to CSS
  const positionStyle = $derived(resolvePosition(config.position))

  // Build scroll state if requested
  const scrollState = $derived.by(() => {
    if (!config.injectScrollState) return undefined
    return {
      progress: scrollProgress,
      isVisible: true,
      direction: null,
      velocity: 0,
      sectionProgress: scrollProgress,
      globalProgress: scrollProgress
    }
  })

  // Merge props
  const componentProps = $derived({
    ...config.props,
    ...(scrollState ? { scrollState } : {})
  })
</script>

{#if shouldRender}
  <div
    class="content"
    data-content={config.id}
    style={positionStyle}
  >
    <svelte:component this={config.component} {...componentProps} />
  </div>
{/if}

<style>
  .content {
    position: absolute;
    /* Position styles applied inline from positionStyle */
  }
</style>
```

## ContentSlot Component

**File:** `src/lib/content/ContentSlot.svelte`

For simpler positioning needs:

```svelte
<ContentSlot position={{ preset: 'center' }}>
  <h1>Hello World</h1>
</ContentSlot>
```

### Implementation

```svelte
<script lang="ts">
  import type { PositionConfig } from '$lib/types'
  import { resolvePosition } from '$lib/responsive/regions'

  let {
    position,
    children
  }: {
    position: PositionConfig
    children: Snippet
  } = $props()

  const style = $derived(resolvePosition(position))
</script>

<div class="content-slot" {style}>
  {@render children()}
</div>
```

## Full Section Example

```typescript
const section: SectionConfig = {
  id: 'feature-section',

  layers: [
    { id: 'bg', src: '/bg.jpg', z: 0 }
  ],

  content: [
    // Main headline - centered
    {
      id: 'headline',
      component: Headline,
      props: { text: 'Features', size: 'xl' },
      position: { preset: 'center-top', transform: 'translateY(10vh)' },
      at: 0
    },

    // Feature cards - rule of thirds
    {
      id: 'feature-1',
      component: FeatureCard,
      props: { title: 'Fast', icon: 'bolt' },
      position: { preset: 'thirds-intersect-tl' },
      at: 1
    },
    {
      id: 'feature-2',
      component: FeatureCard,
      props: { title: 'Simple', icon: 'cube' },
      position: { preset: 'center' },
      at: 1.5
    },
    {
      id: 'feature-3',
      component: FeatureCard,
      props: { title: 'Powerful', icon: 'rocket' },
      position: { preset: 'thirds-intersect-br' },
      at: 2
    },

    // Progress indicator - always visible
    {
      id: 'progress',
      component: ProgressBar,
      position: { preset: 'bottom-center' },
      at: 0,
      injectScrollState: true  // Receives scrollState prop
    },

    // High-tier only content
    {
      id: 'particle-effect',
      component: ParticleSystem,
      position: { preset: 'center' },
      at: 0,
      performanceTier: 'high'
    }
  ],

  animations: [
    // Headline
    { target: 'headline', action: 'fadeIn', duration: 0.5, at: 0 },
    { target: 'headline', action: 'textReveal', type: 'words', at: 0.2 },

    // Feature cards staggered
    { target: 'feature-1', action: 'fadeIn', at: 1 },
    { target: 'feature-1', action: 'slideIn', direction: 'right', at: 1 },
    { target: 'feature-2', action: 'fadeIn', at: 1.5 },
    { target: 'feature-2', action: 'scaleIn', from: 0.9, at: 1.5 },
    { target: 'feature-3', action: 'fadeIn', at: 2 },
    { target: 'feature-3', action: 'slideIn', direction: 'left', at: 2 },

    // Progress bar
    { target: 'progress', action: 'fadeIn', at: 0 }
  ]
}
```

## Scroll-Reactive Component

```svelte
<!-- ProgressBar.svelte -->
<script lang="ts">
  import type { ScrollState } from '$lib/content/scroll-state'

  let { scrollState }: { scrollState?: ScrollState } = $props()

  const progress = $derived(scrollState?.progress ?? 0)
  const width = $derived(`${progress * 100}%`)
</script>

<div class="progress-bar">
  <div class="progress-fill" style:width></div>
</div>

<style>
  .progress-bar {
    width: 200px;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
  }

  .progress-fill {
    height: 100%;
    background: white;
    border-radius: 2px;
    transition: width 0.1s ease-out;
  }
</style>
```

## Type Definitions

```typescript
interface ContentConfig {
  id: string
  component: typeof SvelteComponent
  props?: Record<string, unknown>
  position: PositionConfig
  at: number
  until?: number
  injectScrollState?: boolean
  performanceTier?: 'high' | 'medium' | 'low'
}

interface PositionConfig {
  x?: string | number
  y?: string | number
  region?: number | string
  preset?: PositionPreset
  vAlign?: 'top' | 'center' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
  transform?: string
}

interface ScrollState {
  progress: number
  isVisible: boolean
  direction: 'up' | 'down' | null
  velocity: number
  sectionProgress: number
  globalProgress: number
}

type PositionPreset =
  | 'center' | 'center-top' | 'center-bottom'
  | 'left-center' | 'right-center'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'golden-left' | 'golden-right' | 'golden-top' | 'golden-bottom'
  | 'thirds-intersect-tl' | 'thirds-intersect-tr'
  | 'thirds-intersect-bl' | 'thirds-intersect-br'
```

## Next Steps

- [Responsive System](./responsive-system.md) - Frame scaling, fluid sizing
- [Animation Primitives](./animation-primitives.md) - Animate content
- [Patterns](./patterns.md) - Best practices
