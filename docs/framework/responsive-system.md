# Responsive System

Frame scaling, semantic regions, safe zones, and fluid sizing.

## Overview

The responsive system provides:

- **Frame scaling** - Reference frame with cover/contain/fill modes
- **Semantic regions** - 9-grid positioning system
- **Safe zones** - Device-specific safe areas (notches, home indicator)
- **Fluid sizing** - Utopia-style clamp-based scaling

## Frame Scaling

**File:** `src/lib/responsive/frame.ts`

### Configuration

```typescript
interface FrameConfig {
  width: number           // Reference width (e.g., 1920)
  height: number          // Reference height (e.g., 1080)
  scaling: 'cover' | 'contain' | 'fill'
  minScale?: number       // Minimum scale factor
  maxScale?: number       // Maximum scale factor
}
```

### Scaling Modes

| Mode | Behavior |
|------|----------|
| `cover` | Scale to fill viewport, crop overflow |
| `contain` | Scale to fit viewport, letterbox if needed |
| `fill` | Stretch to fill (no uniform scaling) |

### Scale Calculation

```typescript
export function calculateScale(
  config: FrameConfig,
  viewportWidth: number,
  viewportHeight: number
): number {
  const scaleX = viewportWidth / config.width
  const scaleY = viewportHeight / config.height

  let scale: number
  switch (config.scaling) {
    case 'cover':
      scale = Math.max(scaleX, scaleY)
      break
    case 'contain':
      scale = Math.min(scaleX, scaleY)
      break
    case 'fill':
      return 1  // No uniform scaling
  }

  // Apply constraints
  if (config.minScale) scale = Math.max(scale, config.minScale)
  if (config.maxScale) scale = Math.min(scale, config.maxScale)

  return scale
}
```

### Dimension Helpers

```typescript
// Get scaled dimensions
export function getScaledDimensions(
  config: FrameConfig,
  scale: number
): { width: number; height: number } {
  return {
    width: config.width * scale,
    height: config.height * scale
  }
}

// Get centering offset
export function getFrameOffset(
  config: FrameConfig,
  scale: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  const scaled = getScaledDimensions(config, scale)
  return {
    x: (viewportWidth - scaled.width) / 2,
    y: (viewportHeight - scaled.height) / 2
  }
}
```

### CSS Variables

```typescript
export function getFrameCSSVars(
  config: FrameConfig,
  scale: number
): Record<string, string> {
  const scaled = getScaledDimensions(config, scale)
  return {
    '--frame-width': `${config.width}px`,
    '--frame-height': `${config.height}px`,
    '--frame-scale': `${scale}`,
    '--frame-scaled-width': `${scaled.width}px`,
    '--frame-scaled-height': `${scaled.height}px`
  }
}
```

### Resize Observer

```typescript
export function createFrameScaleObserver(
  config: FrameConfig,
  onScale: (scale: number, dimensions: { width: number; height: number }) => void
): () => void {
  const update = () => {
    const scale = calculateScale(config, window.innerWidth, window.innerHeight)
    const dimensions = getScaledDimensions(config, scale)
    onScale(scale, dimensions)
  }

  window.addEventListener('resize', update)
  update()

  return () => window.removeEventListener('resize', update)
}
```

## Semantic Regions

**File:** `src/lib/responsive/regions.ts`

### 9-Grid System

```
┌─────┬────────┬────────┬────────┬─────┐
│  1  │   2    │   3    │   4    │  5  │
│ 10% │  20%   │  20%   │  20%   │ 10% │
├─────┼────────┼────────┼────────┼─────┤
│  6  │   7    │   8    │   9    │ 10  │
│     │        │(center)│        │     │
├─────┼────────┼────────┼────────┼─────┤
│ 11  │  12    │  13    │  14    │ 15  │
│     │        │        │        │     │
└─────┴────────┴────────┴────────┴─────┘
```

### Region Coordinates

```typescript
const regionCoords: Record<number, { x: string; y: string }> = {
  1:  { x: '10%',  y: '20%' },
  2:  { x: '30%',  y: '20%' },
  3:  { x: '50%',  y: '20%' },
  4:  { x: '70%',  y: '20%' },
  5:  { x: '90%',  y: '20%' },
  6:  { x: '10%',  y: '50%' },
  7:  { x: '30%',  y: '50%' },
  8:  { x: '50%',  y: '50%' },  // Center
  9:  { x: '70%',  y: '50%' },
  10: { x: '90%',  y: '50%' },
  11: { x: '10%',  y: '80%' },
  12: { x: '30%',  y: '80%' },
  13: { x: '50%',  y: '80%' },
  14: { x: '70%',  y: '80%' },
  15: { x: '90%',  y: '80%' }
}

export function getRegionCoords(region: number): { x: string; y: string } {
  return regionCoords[region] ?? regionCoords[8]  // Default to center
}
```

### Position Presets

```typescript
const presetCoords: Record<PositionPreset, { x: string; y: string }> = {
  'center':           { x: '50%', y: '50%' },
  'center-top':       { x: '50%', y: '15%' },
  'center-bottom':    { x: '50%', y: '85%' },
  'left-center':      { x: '15%', y: '50%' },
  'right-center':     { x: '85%', y: '50%' },
  'top-left':         { x: '15%', y: '15%' },
  'top-right':        { x: '85%', y: '15%' },
  'bottom-left':      { x: '15%', y: '85%' },
  'bottom-right':     { x: '85%', y: '85%' },

  // Golden ratio (≈38.2% / 61.8%)
  'golden-left':      { x: '38.2%', y: '50%' },
  'golden-right':     { x: '61.8%', y: '50%' },
  'golden-top':       { x: '50%', y: '38.2%' },
  'golden-bottom':    { x: '50%', y: '61.8%' },

  // Rule of thirds (33.3% / 66.6%)
  'thirds-intersect-tl': { x: '33.3%', y: '33.3%' },
  'thirds-intersect-tr': { x: '66.6%', y: '33.3%' },
  'thirds-intersect-bl': { x: '33.3%', y: '66.6%' },
  'thirds-intersect-br': { x: '66.6%', y: '66.6%' }
}

export function getPresetCoords(preset: PositionPreset): { x: string; y: string } {
  return presetCoords[preset] ?? presetCoords.center
}
```

### Position Resolution

```typescript
export function resolvePosition(config: PositionConfig): string {
  let x: string
  let y: string

  // Priority: direct coords > preset > region
  if (config.x !== undefined && config.y !== undefined) {
    x = typeof config.x === 'number' ? `${config.x}px` : config.x
    y = typeof config.y === 'number' ? `${config.y}px` : config.y
  } else if (config.preset) {
    const coords = getPresetCoords(config.preset)
    x = coords.x
    y = coords.y
  } else if (config.region) {
    const coords = getRegionCoords(
      typeof config.region === 'number' ? config.region : parseInt(config.region)
    )
    x = coords.x
    y = coords.y
  } else {
    x = '50%'
    y = '50%'
  }

  // Build transform
  let transform = 'translate(-50%, -50%)'  // Center by default

  // Alignment adjustments
  if (config.hAlign === 'left') transform = transform.replace('-50%', '0')
  if (config.hAlign === 'right') transform = transform.replace('-50%', '-100%')
  if (config.vAlign === 'top') transform = transform.replace(', -50%', ', 0')
  if (config.vAlign === 'bottom') transform = transform.replace(', -50%', ', -100%')

  // Additional transform
  if (config.transform) {
    transform = `${transform} ${config.transform}`
  }

  return `left: ${x}; top: ${y}; transform: ${transform};`
}
```

## Safe Zones

**File:** `src/lib/responsive/safe-zones.ts`

### Configuration

```typescript
interface SafeZone {
  top?: string
  bottom?: string
  left?: string
  right?: string
}

interface SafeZonesConfig {
  mobile: SafeZone
  tablet: SafeZone
  desktop: SafeZone
}
```

### Default Safe Zones

```typescript
const defaultSafeZones: SafeZonesConfig = {
  mobile: {
    top: 'env(safe-area-inset-top, 44px)',      // Notch
    bottom: 'env(safe-area-inset-bottom, 34px)', // Home indicator
    left: '16px',
    right: '16px'
  },
  tablet: {
    top: '24px',
    bottom: '24px',
    left: '32px',
    right: '32px'
  },
  desktop: {
    top: '40px',
    bottom: '40px',
    left: '60px',
    right: '60px'
  }
}
```

### Breakpoint Detection

```typescript
type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}
```

### Safe Zone Access

```typescript
export function getSafeZone(breakpoint?: Breakpoint): SafeZone {
  const bp = breakpoint ?? getBreakpoint()
  return defaultSafeZones[bp]
}

export function getSafeZoneCSSVars(breakpoint?: Breakpoint): Record<string, string> {
  const zone = getSafeZone(breakpoint)
  return {
    '--safe-top': zone.top ?? '0px',
    '--safe-bottom': zone.bottom ?? '0px',
    '--safe-left': zone.left ?? '0px',
    '--safe-right': zone.right ?? '0px'
  }
}

export function getSafeZonePadding(breakpoint?: Breakpoint): {
  paddingTop: string
  paddingBottom: string
  paddingLeft: string
  paddingRight: string
} {
  const zone = getSafeZone(breakpoint)
  return {
    paddingTop: zone.top ?? '0px',
    paddingBottom: zone.bottom ?? '0px',
    paddingLeft: zone.left ?? '0px',
    paddingRight: zone.right ?? '0px'
  }
}
```

### Safe Zone Observer

```typescript
export function createSafeZoneObserver(
  onChange: (breakpoint: Breakpoint, safeZone: SafeZone) => void
): () => void {
  const update = () => {
    const bp = getBreakpoint()
    onChange(bp, getSafeZone(bp))
  }

  window.addEventListener('resize', update)
  update()

  return () => window.removeEventListener('resize', update)
}
```

## Fluid Sizing

**File:** `src/lib/responsive/fluid.ts`

Utopia-style fluid typography and spacing using CSS `clamp()`.

### Configuration

```typescript
interface FluidConfig {
  minViewport: number       // e.g., 320
  maxViewport: number       // e.g., 1920

  type: {
    base: [number, number]  // [minSize, maxSize] in px
    scale: number           // Type scale ratio
    steps: string[]         // Step names: ['xs', 's', 'm', 'l', 'xl']
  }

  space: {
    base: [number, number]  // [minSize, maxSize] in px
    scale: number           // Space scale ratio
    steps: string[]         // Step names: ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl']
  }
}
```

### Default Configuration

```typescript
const defaultFluidConfig: FluidConfig = {
  minViewport: 320,
  maxViewport: 1920,

  type: {
    base: [16, 20],
    scale: 1.25,
    steps: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl']
  },

  space: {
    base: [8, 12],
    scale: 1.5,
    steps: ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl']
  }
}
```

### Clamp Calculation

```typescript
function calculateClamp(
  minSize: number,
  maxSize: number,
  minVw: number,
  maxVw: number
): string {
  // Convert to rem (assuming 16px root)
  const minRem = minSize / 16
  const maxRem = maxSize / 16

  // Calculate slope
  const slope = (maxSize - minSize) / (maxVw - minVw)
  const slopeVw = slope * 100

  // Calculate y-intercept
  const intercept = minSize - slope * minVw
  const interceptRem = intercept / 16

  return `clamp(${minRem.toFixed(2)}rem, ${interceptRem.toFixed(2)}rem + ${slopeVw.toFixed(2)}vw, ${maxRem.toFixed(2)}rem)`
}
```

### Scale Generation

```typescript
export function generateTypeScale(config: FluidConfig): Record<string, string> {
  const { type, minViewport, maxViewport } = config
  const [baseMin, baseMax] = type.base
  const scale: Record<string, string> = {}

  const baseIndex = type.steps.indexOf('m')

  type.steps.forEach((step, i) => {
    const power = i - baseIndex
    const minSize = baseMin * Math.pow(type.scale, power)
    const maxSize = baseMax * Math.pow(type.scale, power)

    scale[`--text-${step}`] = calculateClamp(minSize, maxSize, minViewport, maxViewport)
  })

  return scale
}

export function generateSpaceScale(config: FluidConfig): Record<string, string> {
  const { space, minViewport, maxViewport } = config
  const [baseMin, baseMax] = space.base
  const scale: Record<string, string> = {}

  const baseIndex = space.steps.indexOf('m')

  space.steps.forEach((step, i) => {
    const power = i - baseIndex
    const minSize = baseMin * Math.pow(space.scale, power)
    const maxSize = baseMax * Math.pow(space.scale, power)

    scale[`--space-${step}`] = calculateClamp(minSize, maxSize, minViewport, maxViewport)
  })

  return scale
}
```

### CSS Generation

```typescript
export function generateFluidCSSVars(config?: FluidConfig): Record<string, string> {
  const cfg = config ?? defaultFluidConfig
  return {
    ...generateTypeScale(cfg),
    ...generateSpaceScale(cfg)
  }
}

export function generateFluidCSS(config?: FluidConfig): string {
  const vars = generateFluidCSSVars(config)
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')
}
```

### Usage

```svelte
<script>
  import { generateFluidCSSVars } from '$lib/responsive/fluid'

  const fluidVars = generateFluidCSSVars()
</script>

<div style={Object.entries(fluidVars).map(([k, v]) => `${k}: ${v}`).join('; ')}>
  <h1 style="font-size: var(--text-xl)">Heading</h1>
  <p style="font-size: var(--text-m); margin: var(--space-m)">Paragraph</p>
</div>
```

### Direct Size Access

```typescript
export function getFluidSize(step: string, type: 'text' | 'space' = 'text'): string {
  const vars = generateFluidCSSVars()
  return vars[`--${type}-${step}`] ?? vars[`--${type}-m`]
}

// Usage
const headingSize = getFluidSize('xl', 'text')  // clamp(...)
const gapSize = getFluidSize('l', 'space')      // clamp(...)
```

## Putting It Together

### Stage Component Usage

```svelte
<!-- Stage.svelte -->
<script lang="ts">
  import {
    calculateScale,
    getFrameCSSVars,
    createFrameScaleObserver
  } from '$lib/responsive/frame'
  import { getSafeZoneCSSVars } from '$lib/responsive/safe-zones'
  import { generateFluidCSSVars } from '$lib/responsive/fluid'

  let { config, children }: Props = $props()

  let scale = $state(1)
  let frameVars = $state<Record<string, string>>({})

  $effect(() => {
    return createFrameScaleObserver(config.frame, (newScale) => {
      scale = newScale
      frameVars = getFrameCSSVars(config.frame, newScale)
    })
  })

  const safeVars = $derived(getSafeZoneCSSVars())
  const fluidVars = $derived(generateFluidCSSVars(config.fluid))

  const allVars = $derived({
    ...frameVars,
    ...safeVars,
    ...fluidVars
  })

  const styleString = $derived(
    Object.entries(allVars).map(([k, v]) => `${k}: ${v}`).join('; ')
  )
</script>

<div class="stage" style={styleString}>
  <div class="stage-content" style:transform={`scale(${scale})`}>
    {@render children()}
  </div>
</div>
```

## Type Definitions

```typescript
interface FrameConfig {
  width: number
  height: number
  scaling: 'cover' | 'contain' | 'fill'
  minScale?: number
  maxScale?: number
}

interface SafeZone {
  top?: string
  bottom?: string
  left?: string
  right?: string
}

interface SafeZonesConfig {
  mobile: SafeZone
  tablet: SafeZone
  desktop: SafeZone
}

interface FluidConfig {
  minViewport: number
  maxViewport: number
  type: {
    base: [number, number]
    scale: number
    steps: string[]
  }
  space: {
    base: [number, number]
    scale: number
    steps: string[]
  }
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

type PositionPreset =
  | 'center' | 'center-top' | 'center-bottom'
  | 'left-center' | 'right-center'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'golden-left' | 'golden-right' | 'golden-top' | 'golden-bottom'
  | 'thirds-intersect-tl' | 'thirds-intersect-tr'
  | 'thirds-intersect-bl' | 'thirds-intersect-br'
```

## Next Steps

- [Components](./components.md) - ScrollContainer, Stage, Section
- [Content System](./content-system.md) - Use regions for positioning
- [Patterns](./patterns.md) - Best practices
