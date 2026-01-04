# Layer System

Images, video, 3D components, parallax, and z-ordering.

## Overview

Layers are full-viewport media that stack behind content. The layer system provides:

- **Z-ordering** - Automatic stacking by z-index
- **Parallax** - Scroll-linked movement at different speeds
- **Media types** - Images, video, 3D components
- **Groups** - Coordinate multiple layers together

## Layer Types

### Image Layer

```typescript
{
  id: 'background',
  src: '/images/hero-bg.jpg',
  alt: 'Hero background',
  z: 0,                    // Z-index (0 = back)
  parallax: { speed: 0.5 } // Optional parallax
}
```

### Video Layer

```typescript
{
  id: 'video-bg',
  type: 'video',
  src: '/videos/ambient.mp4',
  autoplay: true,
  loop: true,
  muted: true,
  z: 0
}
```

### 3D Layer (Threlte)

```typescript
{
  id: 'scene',
  type: '3d',
  component: Scene3D,           // Svelte component
  props: { quality: 'high' },
  scrollSync: true,             // Inject scrollProgress prop
  interactive: 'objects',       // Enable 3D object interaction
  performanceTier: 'high',      // Required device tier
  fallback: {                   // Fallback for low-tier devices
    src: '/images/static-scene.jpg',
    alt: '3D scene fallback'
  },
  z: 50
}
```

### Layer Group

```typescript
{
  id: 'parallax-group',
  type: 'group',
  children: [
    { id: 'mountain-far', src: '/layers/mountain-3.png', z: 10 },
    { id: 'mountain-mid', src: '/layers/mountain-2.png', z: 20 },
    { id: 'mountain-near', src: '/layers/mountain-1.png', z: 30 }
  ],
  z: 0
}
```

## Z-Ordering

### Convention

```
z: 0-30    Background tier
z: 30-70   Midground tier
z: 70-100  Foreground tier
```

### Rendering Order

LayerStack sorts by z-index automatically:

```typescript
// Internal implementation
const sortedLayers = $derived(
  [...layers].sort((a, b) => (a.z ?? 50) - (b.z ?? 50))
)
```

Lower z-index renders first (behind higher values).

## Parallax

### Speed Values

| Speed | Behavior |
|-------|----------|
| 0 | Fixed (doesn't move) |
| 0.5 | Moves at half scroll speed |
| 1 | Moves at scroll speed (no parallax) |
| 1.5 | Moves faster than scroll |

### Configuration Methods

**Method 1: Layer config**

```typescript
{
  id: 'bg',
  src: '/bg.jpg',
  parallax: { speed: 0.5, axis: 'y' }
}
```

**Method 2: Speed shorthand**

```typescript
{
  id: 'bg',
  src: '/bg.jpg',
  speed: 0.5  // Shorthand for parallax.speed
}
```

**Method 3: Data attributes (ScrollSmoother)**

```html
<img data-speed="0.5" data-lag="0.2" src="bg.jpg" />
```

### Z-Based Auto Parallax

Parallax speed can derive from z-index:

```typescript
// z: 0   → speed: 0.5
// z: 50  → speed: 1.0
// z: 100 → speed: 1.5

function calculateParallaxSpeed(z: number): number {
  return 0.5 + (z / 100)  // Linear mapping
}
```

Enable with:

```typescript
{
  id: 'layer',
  src: '/image.jpg',
  z: 25,
  parallax: true  // Auto-calculate from z
}
```

### Lag (Delay Following)

Add trailing delay to parallax:

```typescript
{
  id: 'element',
  parallax: { speed: 1, lag: 0.2 }  // 0.2s delay
}
```

## Layer Component

**File:** `src/lib/layers/Layer.svelte`

### Props

```typescript
interface Props {
  layer: LayerConfig
  scrollProgress?: number  // 0-1 for 3D sync
}
```

### Rendering Logic

```svelte
<script lang="ts">
  let { layer, scrollProgress = 0 }: Props = $props()

  // Detect layer type
  const isGroup = $derived(layer.type === 'group')
  const is3D = $derived(layer.type === '3d')
  const isVideo = $derived(layer.type === 'video')
  const isImage = $derived(!layer.type || layer.type === 'image')

  // Calculate parallax speed from z
  const dataSpeed = $derived.by(() => {
    if (layer.parallax === true) {
      return calculateParallaxSpeed(layer.z ?? 50)
    }
    if (typeof layer.parallax === 'object') {
      return layer.parallax.speed
    }
    return layer.speed
  })

  // Calculate lag
  const dataLag = $derived(
    typeof layer.parallax === 'object' ? layer.parallax.lag : undefined
  )
</script>

{#if isGroup}
  <LayerGroup group={layer} {scrollProgress} />
{:else if is3D}
  {@const props3D = { ...layer.props, scrollProgress: layer.scrollSync ? scrollProgress : undefined }}
  <div class="layer layer-3d" style:z-index={layer.z ?? 50}>
    <svelte:component this={layer.component} {...props3D} />
  </div>
{:else if isVideo}
  <video
    class="layer"
    data-layer={layer.id}
    data-speed={dataSpeed}
    data-lag={dataLag}
    style:z-index={layer.z ?? 50}
    src={layer.src}
    autoplay={layer.autoplay}
    loop={layer.loop}
    muted={layer.muted}
    playsinline
  />
{:else}
  <img
    class="layer"
    data-layer={layer.id}
    data-speed={dataSpeed}
    data-lag={dataLag}
    style:z-index={layer.z ?? 50}
    src={layer.src}
    alt={layer.alt ?? ''}
  />
{/if}
```

### Styling

```css
.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.layer-3d {
  pointer-events: none;  /* Allow scroll through */
}

.layer-3d.interactive {
  pointer-events: auto;
}
```

## LayerStack Component

**File:** `src/lib/layers/LayerStack.svelte`

### Props

```typescript
interface Props {
  layers: LayerConfig[]
  scrollProgress?: number
}
```

### Implementation

```svelte
<script lang="ts">
  let { layers, scrollProgress = 0 }: Props = $props()

  // Sort by z-index (lowest first = rendered behind)
  const sortedLayers = $derived(
    [...layers].sort((a, b) => (a.z ?? 50) - (b.z ?? 50))
  )
</script>

<div class="layer-stack">
  {#each sortedLayers as layer (layer.id)}
    <Layer {layer} {scrollProgress} />
  {/each}
</div>

<style>
  .layer-stack {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
</style>
```

## LayerGroup Component

**File:** `src/lib/layers/LayerGroup.svelte`

Groups allow coordinated animation of multiple layers.

```svelte
<script lang="ts">
  import type { LayerGroup } from './types'
  import Layer from './Layer.svelte'

  let { group, scrollProgress = 0 }: { group: LayerGroup; scrollProgress?: number } = $props()
</script>

<div
  class="layer-group"
  data-layer={group.id}
  style:z-index={group.z ?? 50}
>
  {#each group.children as child (child.id)}
    <Layer layer={child} {scrollProgress} />
  {/each}
</div>
```

### Group Animation

Animate the group container, children move together:

```typescript
animations: [
  { target: 'parallax-group', action: 'fadeIn', duration: 1 },
  { target: 'parallax-group', action: 'zoom', scale: 1.1, duration: 5 }
]
```

## 3D Layer Integration

### Scroll Sync

When `scrollSync: true`, the 3D component receives `scrollProgress`:

```svelte
<!-- Scene3D.svelte -->
<script lang="ts">
  let { scrollProgress = 0 }: { scrollProgress?: number } = $props()

  // Use progress for camera movement, object animation, etc.
</script>
```

### Interactivity

| Mode | Behavior |
|------|----------|
| `false` | `pointer-events: none` - scroll passes through |
| `'objects'` | Only 3D objects receive pointer events |
| `true` | Canvas captures all events |

### Performance Fallback

```typescript
{
  type: '3d',
  component: Scene3D,
  performanceTier: 'high',
  fallback: {
    src: '/static-scene.jpg',
    alt: 'Scene fallback'
  }
}
```

On low-tier devices, renders static image instead.

### Threlte Bridge

**File:** `src/lib/integrations/threlte.ts`

```typescript
import { useScrollProgress, createGSAPThrelteBridge } from '$lib/integrations/threlte'

// In Threlte component
const { value: progress } = useScrollProgress(() => scrollProgress, 5)

// Smooth GSAP-driven properties
const bridge = createGSAPThrelteBridge()
$effect(() => {
  bridge.set.cameraZ(5 + progress.current * 10)
})
```

## Full Section Example

```typescript
const section: SectionConfig = {
  id: 'parallax-mountains',

  layers: [
    // Sky - fixed (no parallax)
    {
      id: 'sky',
      src: '/layers/sky.jpg',
      z: 0,
      parallax: { speed: 0 }
    },

    // Mountains - slow parallax
    {
      id: 'mountains-group',
      type: 'group',
      z: 10,
      children: [
        { id: 'mountain-far', src: '/layers/mountain-3.png', z: 10, parallax: { speed: 0.3 } },
        { id: 'mountain-mid', src: '/layers/mountain-2.png', z: 20, parallax: { speed: 0.5 } },
        { id: 'mountain-near', src: '/layers/mountain-1.png', z: 30, parallax: { speed: 0.7 } }
      ]
    },

    // Forest - medium parallax
    { id: 'forest', src: '/layers/forest.png', z: 50, parallax: { speed: 0.9 } },

    // Foreground - fast parallax
    { id: 'grass', src: '/layers/grass.png', z: 80, parallax: { speed: 1.3 } },

    // Atmospheric effects
    { id: 'fog', src: '/layers/fog.png', z: 90, parallax: { speed: 1.1 } }
  ],

  content: [...],

  animations: [
    // Staggered reveal
    { target: 'sky', action: 'fadeIn', duration: 0.5, at: 0 },
    { target: 'mountains-group', action: 'fadeIn', duration: 0.8, at: 0.2 },
    { target: 'forest', action: 'fadeIn', duration: 0.6, at: 0.5 },
    { target: 'grass', action: 'slideIn', direction: 'up', at: 0.8 },
    { target: 'fog', action: 'fadeIn', duration: 1.5, at: 1 }
  ]
}
```

## Type Definitions

```typescript
// Base layer properties
interface LayerBase {
  id: string
  z?: number                    // Z-index (default: 50)
  parallax?: boolean | ParallaxConfig
  speed?: number                // Shorthand for parallax.speed
  lag?: number                  // Shorthand for parallax.lag
  attributes?: Record<string, string>  // Custom data attributes
}

// Parallax configuration
interface ParallaxConfig {
  speed?: number                // Parallax multiplier
  axis?: 'x' | 'y' | 'both'     // Movement axis
  lag?: number                  // Following delay
}

// Image/video layer
interface LayerMedia extends LayerBase {
  type?: 'image' | 'video'
  src: string
  alt?: string
  autoplay?: boolean           // Video only
  loop?: boolean               // Video only
  muted?: boolean              // Video only
}

// 3D layer
interface Layer3D extends LayerBase {
  type: '3d'
  component: typeof SvelteComponent
  props?: Record<string, unknown>
  scrollSync?: boolean
  interactive?: boolean | 'objects'
  performanceTier?: PerformanceTier
  fallback?: { src: string; alt?: string }
}

// Grouped layers
interface LayerGroup extends LayerBase {
  type: 'group'
  children: LayerConfig[]
}

// Union type
type LayerConfig = LayerMedia | Layer3D | LayerGroup
```

## Next Steps

- [Content System](./content-system.md) - Positioning and scroll state
- [Animation Primitives](./animation-primitives.md) - Animate layers
- [Patterns](./patterns.md) - Best practices
