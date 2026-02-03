# Components

Complete reference for ScrollContainer, Stage, and Section components.

## ScrollContainer

**File:** `src/lib/components/ScrollContainer.svelte`

Root wrapper that orchestrates the entire scroll experience.

### Responsibilities

1. Initialize GSAP plugins
2. Create ScrollSmoother singleton
3. Track global scroll progress
4. Manage cleanup on destroy

### Props

```typescript
interface Props {
  config?: Partial<ScrollSmootherConfig>
  onProgress?: (progress: number) => void
  children: Snippet
}
```

### Usage

```svelte
<script lang="ts">
  import { ScrollContainer } from '$lib'

  function handleProgress(progress: number) {
    console.log('Scroll progress:', progress)
  }
</script>

<ScrollContainer onProgress={handleProgress}>
  <!-- Stage and Sections go here -->
</ScrollContainer>
```

### Custom ScrollSmoother Config

```svelte
<ScrollContainer config={{
  smooth: 1.5,          // Smoothing amount (default: 1.2)
  effects: true,        // Enable data-speed/data-lag (default: true)
  smoothTouch: 0.1,     // Touch smoothing (default: 0.1)
  normalizeScroll: true // Consistent cross-browser (default: true)
}}>
  ...
</ScrollContainer>
```

### Implementation Details

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { initGSAP, ScrollTrigger } from '$lib/core/register'
  import {
    getScrollSmoother,
    killScrollSmoother,
    killAllScrollTriggers
  } from '$lib/core/scroll'
  import {
    setGlobalScrollProgress,
    setIsScrolling,
    resetGlobalScrollState
  } from '$lib/content/scroll-state'
  import { revertAllSplits } from '$lib/animation/primitives/text'

  let { config, onProgress, children }: Props = $props()

  let wrapper: HTMLElement
  let content: HTMLElement
  let smoother: ScrollSmoother
  let ctx: gsap.Context
  let resizeObserver: ResizeObserver
  let scrollTimeout: number

  onMount(() => {
    // 1. Initialize GSAP
    initGSAP()

    // 2. Wait for content to render
    resizeObserver = new ResizeObserver(() => {
      setupScrollSmoother()
    })
    resizeObserver.observe(content)
  })

  function setupScrollSmoother() {
    ctx = gsap.context(() => {
      smoother = getScrollSmoother({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        ...config,
        onUpdate: (self) => {
          const progress = self.progress
          setGlobalScrollProgress(progress)
          onProgress?.(progress)

          // Debounce scrolling state
          setIsScrolling(true)
          clearTimeout(scrollTimeout)
          scrollTimeout = setTimeout(() => setIsScrolling(false), 150)
        }
      })
    }, wrapper)
  }

  onDestroy(() => {
    // Cleanup in correct order
    resizeObserver?.disconnect()
    clearTimeout(scrollTimeout)
    ctx?.revert()
    killAllScrollTriggers()
    killScrollSmoother()
    revertAllSplits()
    resetGlobalScrollState()
  })
</script>

<div id="smooth-wrapper" bind:this={wrapper}>
  <div id="smooth-content" bind:this={content}>
    {@render children()}
  </div>
</div>

<style>
  #smooth-wrapper {
    position: fixed;
    inset: 0;
    overflow: hidden;
  }

  #smooth-content {
    will-change: transform;
  }
</style>
```

---

## Stage

**File:** `src/lib/components/Stage.svelte`

Pinned viewport with reference frame scaling.

### Responsibilities

1. Apply reference frame scaling
2. Provide CSS variables for responsive sizing
3. Center content in viewport

### Props

```typescript
interface Props {
  config?: FrameConfig
  children: Snippet
}

interface FrameConfig {
  width: number           // Reference width (default: 1920)
  height: number          // Reference height (default: 1080)
  scaling: 'cover' | 'contain' | 'fill'
  minScale?: number
  maxScale?: number
}
```

### Usage

```svelte
<script lang="ts">
  import { ScrollContainer, Stage, Section } from '$lib'
</script>

<ScrollContainer>
  <Stage config={{ width: 1920, height: 1080, scaling: 'cover' }}>
    <Section config={heroSection} />
    <Section config={featuresSection} />
  </Stage>
</ScrollContainer>
```

### CSS Variables Provided

```css
--frame-width: 1920px;
--frame-height: 1080px;
--frame-scale: 0.85;
--frame-scaled-width: 1632px;
--frame-scaled-height: 918px;
```

### Implementation Details

```svelte
<script lang="ts">
  import {
    calculateScale,
    getScaledDimensions,
    getFrameCSSVars
  } from '$lib/responsive/frame'

  let { config, children }: Props = $props()

  const defaultConfig: FrameConfig = {
    width: 1920,
    height: 1080,
    scaling: 'cover'
  }

  const frameConfig = $derived({ ...defaultConfig, ...config })

  let scale = $state(1)
  let frameVars = $state<Record<string, string>>({})

  $effect(() => {
    const update = () => {
      scale = calculateScale(frameConfig, window.innerWidth, window.innerHeight)
      frameVars = getFrameCSSVars(frameConfig, scale)
    }

    window.addEventListener('resize', update)
    update()

    return () => window.removeEventListener('resize', update)
  })

  const styleString = $derived(
    Object.entries(frameVars).map(([k, v]) => `${k}: ${v}`).join('; ')
  )
</script>

<div id="stage" style={styleString}>
  <div
    class="stage-content"
    style:transform={`scale(${scale})`}
    style:width={`${frameConfig.width}px`}
    style:height={`${frameConfig.height}px`}
  >
    {@render children()}
  </div>
</div>

<style>
  #stage {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stage-content {
    position: relative;
    transform-origin: center center;
  }
</style>
```

---

## Section

**File:** `src/lib/components/Section.svelte`

Individual section with layers, content, and animations.

### Responsibilities

1. Render layers with z-ordering
2. Position content components
3. Build and manage animation timeline
4. Handle mobile variants

### Props

```typescript
interface Props {
  config: SectionConfig
  scrollTrigger?: Partial<ScrollTrigger.Vars>
}
```

### SectionConfig Interface

```typescript
interface SectionConfig {
  id: string
  title?: string
  layers: LayerConfig[]
  content?: ContentConfig[]
  animations: AnimationConfig[]
  mobile?: Partial<SectionConfig>  // Mobile overrides
}
```

### Usage

```svelte
<script lang="ts">
  import { Section } from '$lib'
  import { heroSection } from '$experience/sections/hero'
</script>

<Section config={heroSection} />

<!-- With ScrollTrigger overrides -->
<Section
  config={heroSection}
  scrollTrigger={{
    scrub: 0.5,
    anticipatePin: 1
  }}
/>
```

### Mobile Variants

```typescript
const section: SectionConfig = {
  id: 'hero',
  layers: [
    { id: 'bg', src: '/bg.jpg', z: 0 }
  ],
  content: [
    {
      id: 'headline',
      component: Headline,
      position: { preset: 'center' },
      at: 0
    }
  ],
  animations: [...],

  // Mobile overrides
  mobile: {
    content: [
      {
        id: 'headline',
        component: Headline,
        position: { preset: 'center-top' },  // Different position
        at: 0,
        props: { size: 'compact' }  // Different props
      }
    ],
    animations: [
      // Simplified animations
      { target: 'headline', action: 'fadeIn', at: 0 }
    ]
  }
}
```

### Implementation Details

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from 'gsap'
  import { ScrollTrigger } from '$lib/core/register'
  import { buildSectionTimeline } from '$lib/animation/composer'
  import LayerStack from '$lib/layers/LayerStack.svelte'
  import Content from '$lib/content/Content.svelte'

  let { config, scrollTrigger }: Props = $props()

  let container: HTMLElement
  let ctx: gsap.Context
  let scrollProgress = $state(0)

  // Mobile detection
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

  // Merge mobile overrides
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

  // Build timeline
  $effect(() => {
    if (!container) return

    ctx = gsap.context(() => {
      const tl = buildSectionTimeline(effectiveConfig, container)

      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: false,
        ...scrollTrigger,
        animation: tl,
        onUpdate: (self) => {
          scrollProgress = self.progress
        }
      })
    }, container)

    return () => ctx?.revert()
  })

  // Initial visibility
  const isFirst = $derived(config.id === 'hero' || config.id === 'section-1')
</script>

<section
  bind:this={container}
  class="section"
  data-section={effectiveConfig.id}
  style:visibility={isFirst ? 'visible' : 'hidden'}
  style:opacity={isFirst ? 1 : 0}
>
  <LayerStack
    layers={effectiveConfig.layers}
    {scrollProgress}
  />

  {#if effectiveConfig.content}
    {#each effectiveConfig.content as contentConfig (contentConfig.id)}
      <Content
        config={contentConfig}
        {scrollProgress}
      />
    {/each}
  {/if}
</section>

<style>
  .section {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
```

---

## Debugger

**File:** `src/lib/dev/Debugger.svelte`

Development tool for visualizing timeline and layers.

### Features

- Current playback time and progress
- Section progress indicators
- Active animation list
- Layer visibility toggles
- Element bounding box visualization
- Pause/play controls

### Usage

```svelte
<script lang="ts">
  import { dev } from '$app/environment'

  let Debugger: typeof import('$lib/dev/Debugger.svelte').default

  if (dev) {
    import('$lib/dev/Debugger.svelte').then(m => Debugger = m.default)
  }
</script>

{#if dev && Debugger}
  <svelte:component this={Debugger} />
{/if}
```

### Props

```typescript
interface Props {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  collapsed?: boolean
}
```

---

## GSDevTools

**File:** `src/lib/dev/GSDevTools.svelte`

GSAP's visual timeline inspector.

### Usage

```svelte
<script lang="ts">
  import { dev } from '$app/environment'
  import GSDevTools from '$lib/dev/GSDevTools.svelte'
</script>

{#if dev}
  <GSDevTools />
{/if}
```

### Props

```typescript
interface Props {
  animation?: gsap.core.Timeline  // Target timeline (auto-detects if not provided)
  minimal?: boolean               // Minimal UI
  keyboard?: boolean              // Enable keyboard controls
}
```

---

## Component Hierarchy

```
+page.svelte
│
└── ScrollContainer          # GSAP init, ScrollSmoother
    │
    └── Stage                # Frame scaling, CSS variables
        │
        ├── Section          # Section 1
        │   ├── LayerStack   # Z-sorted layers
        │   │   ├── Layer    # Background
        │   │   ├── Layer    # Midground
        │   │   └── Layer    # Foreground
        │   │
        │   └── Content[]    # Positioned content
        │       └── Component
        │
        ├── Section          # Section 2
        │   └── ...
        │
        └── Section          # Section N
            └── ...
```

---

## Full Page Example

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ScrollContainer, Stage, Section } from '$lib'
  import {
    heroSection,
    featuresSection,
    testimonialSection,
    outroSection
  } from '$experience/sections'
  import { dev } from '$app/environment'

  // Progress tracking
  let progress = $state(0)

  function handleProgress(p: number) {
    progress = p
  }

  // Dev tools
  let Debugger: typeof import('$lib/dev/Debugger.svelte').default
  let GSDevTools: typeof import('$lib/dev/GSDevTools.svelte').default

  if (dev) {
    Promise.all([
      import('$lib/dev/Debugger.svelte'),
      import('$lib/dev/GSDevTools.svelte')
    ]).then(([d, g]) => {
      Debugger = d.default
      GSDevTools = g.default
    })
  }
</script>

<ScrollContainer onProgress={handleProgress}>
  <Stage config={{ width: 1920, height: 1080, scaling: 'cover' }}>
    <Section config={heroSection} />
    <Section config={featuresSection} />
    <Section config={testimonialSection} />
    <Section config={outroSection} />
  </Stage>
</ScrollContainer>

<!-- Dev tools -->
{#if dev && Debugger}
  <svelte:component this={Debugger} position="bottom-right" />
{/if}

{#if dev && GSDevTools}
  <svelte:component this={GSDevTools} />
{/if}

<!-- Progress indicator (example) -->
<div class="progress-bar" style:width={`${progress * 100}%`}></div>

<style>
  .progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: white;
    z-index: 9999;
  }
</style>
```

## Next Steps

- [Patterns](./patterns.md) - Critical patterns to follow
- [Animation Primitives](./animation-primitives.md) - Animate sections
- [API Reference](./api-reference.md) - Complete function reference
