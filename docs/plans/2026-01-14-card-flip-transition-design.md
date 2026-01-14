# Card Flip Transition Design

**Date:** 2026-01-14
**Status:** Approved
**Scope:** Replace About→Services portal zoom with card flip grid transition

## Overview

Replace the portal zoom transition between the final About beat (Scene 4: "Values") and Services (Scene 5) with a card-flip grid effect inspired by junni.co.jp.

**Key Characteristics:**
- Grid of tiles reconstructs the About scene as an image
- Tiles flip vertically with center-outward wave stagger
- 10° over-rotation bounce before settling at 180°
- Scroll-triggered (not scrubbed) - plays through automatically
- 1.6s total duration

## Architecture

### Exclusive Transition Router

Single source of truth for all scene transitions. Only ONE transition type executes per boundary.

```typescript
// src/lib/transitions/router.ts

type TransitionType = 'portal' | 'cardFlip' | 'none'

interface TransitionDefinition {
  type: TransitionType
  config: PortalTransitionConfig | CardFlipTransitionConfig
}

const transitionMap: Record<string, TransitionDefinition> = {
  '0→1': { type: 'portal', config: { /* Hero → Films */ } },
  '1→2': { type: 'portal', config: { /* Films → About 1 */ } },
  '2→3': { type: 'portal', config: { /* About 1 → About 2 */ } },
  '3→4': { type: 'portal', config: { /* About 2 → About 3 */ } },
  '4→5': { type: 'cardFlip', config: { /* About 3 → Services */ } },
  '5→6': { type: 'portal', config: { /* Services → Contact */ } },
}

export function getTransition(from: number, to: number): TransitionDefinition {
  return transitionMap[`${from}→${to}`] ?? { type: 'none', config: {} }
}
```

### Transition Execution

```typescript
// In PortalContainer.svelte - replaces current transition logic

async function executeTransition(
  fromScene: number,
  toScene: number,
  outgoingEl: HTMLElement,
  incomingEl: HTMLElement
): Promise<void> {
  const { type, config } = getTransition(fromScene, toScene)

  switch (type) {
    case 'portal':
      await executePortalTransition(outgoingEl, incomingEl, config)
      break

    case 'cardFlip':
      await executeCardFlipTransition(outgoingEl, incomingEl, config)
      break

    case 'none':
      gsap.set(outgoingEl, { autoAlpha: 0 })
      gsap.set(incomingEl, { autoAlpha: 1 })
      break
  }
}
```

## Grid Sizing

**Goal:** Keep tiles as square as possible across all viewport sizes and orientations.

**Approach:** Calculate grid dimensions dynamically based on target tile size.

```typescript
interface GridDimensions {
  cols: number
  rows: number
  tileWidth: number
  tileHeight: number
}

function calculateGrid(
  viewportWidth: number,
  viewportHeight: number,
  targetTileSize: number
): GridDimensions {
  const cols = Math.round(viewportWidth / targetTileSize)
  const rows = Math.round(viewportHeight / targetTileSize)

  return {
    cols,
    rows,
    tileWidth: viewportWidth / cols,
    tileHeight: viewportHeight / rows
  }
}
```

**Target Tile Sizes:**
- Desktop: ~100px
- Mobile: ~80px

**Example Results:**

| Viewport | Target | Grid | Tile Size | Aspect |
|----------|--------|------|-----------|--------|
| 1920×1080 (desktop landscape) | 100px | 19×11 | 101×98px | ~1.03 |
| 1440×900 (laptop) | 100px | 14×9 | 103×100px | ~1.03 |
| 428×926 (iPhone portrait) | 80px | 5×12 | 86×77px | ~1.11 |
| 926×428 (iPhone landscape) | 80px | 12×5 | 77×86px | ~0.90 |

## Card Flip Execution Flow

```
Scene 4 (About: Values) scrolling...
         │
         ▼
    Threshold reached
         │
         ▼
  getTransition(4, 5) → 'cardFlip'
         │
         ▼
  1. html2canvas captures Scene 4
  2. CardFlipGrid mounts over viewport
  3. Scene 4 DOM hidden (autoAlpha: 0)
  4. Scene 5 (Services) positioned underneath
  5. Flip animation plays (1.6s)
  6. CardFlipGrid unmounts
  7. Scene 5 now visible
```

```typescript
// src/lib/transitions/card-flip.ts

async function executeCardFlipTransition(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  config: CardFlipTransitionConfig
): Promise<void> {
  // 1. Capture outgoing scene
  const snapshot = await captureScene(outgoing)

  // 2. Position incoming underneath (invisible but ready)
  gsap.set(incoming, { autoAlpha: 1, zIndex: 0 })

  // 3. Mount grid overlay (zIndex: 100, above incoming)
  const grid = mountCardFlipGrid(snapshot, config)

  // 4. Hide outgoing DOM (grid shows the snapshot)
  gsap.set(outgoing, { autoAlpha: 0 })

  // 5. Play flip animation (returns Promise)
  await grid.play()

  // 6. Cleanup grid
  grid.destroy()
}

async function captureScene(sceneElement: HTMLElement): Promise<string> {
  const canvas = await html2canvas(sceneElement, {
    useCORS: true,
    allowTaint: false,
    scale: window.devicePixelRatio,
    logging: false
  })
  return canvas.toDataURL('image/jpeg', 0.9)
}
```

## CardFlipGrid Component

**File:** `src/lib/components/CardFlipGrid.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { gsap } from 'gsap'

  interface Props {
    snapshot: string
    onComplete: () => void
    config: CardFlipTransitionConfig
  }

  let { snapshot, onComplete, config }: Props = $props()

  let container: HTMLElement
  let ctx: gsap.Context
  let tiles: HTMLElement[] = []

  let grid = $state({ cols: 0, rows: 0, tileW: 0, tileH: 0 })

  $effect(() => {
    if (typeof window === 'undefined') return

    const targetSize = window.innerWidth < 768 ? 80 : 100
    const cols = Math.round(window.innerWidth / targetSize)
    const rows = Math.round(window.innerHeight / targetSize)

    grid = {
      cols,
      rows,
      tileW: window.innerWidth / cols,
      tileH: window.innerHeight / rows
    }
  })

  const tileCount = $derived(grid.cols * grid.rows)
  const centerX = $derived((grid.cols - 1) / 2)
  const centerY = $derived((grid.rows - 1) / 2)
  const maxDist = $derived(Math.sqrt(centerX ** 2 + centerY ** 2))

  function getDelay(index: number): number {
    const col = index % grid.cols
    const row = Math.floor(index / grid.cols)
    const dist = Math.sqrt((col - centerX) ** 2 + (row - centerY) ** 2)
    return (dist / maxDist) * config.staggerDuration
  }

  function getBgPosition(index: number): string {
    const col = index % grid.cols
    const row = Math.floor(index / grid.cols)
    return `-${col * grid.tileW}px -${row * grid.tileH}px`
  }

  export function play(): Promise<void> {
    return new Promise((resolve) => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            resolve()
            onComplete()
          }
        })

        tiles.forEach((tile, i) => {
          tl.to(tile, {
            rotateX: 180,
            duration: config.duration - config.staggerDuration,
            ease: 'flipBounce'
          }, getDelay(i))
        })
      }, container)
    })
  }

  export function destroy(): void {
    ctx?.revert()
  }
</script>

<div
  bind:this={container}
  class="flip-grid"
  aria-hidden="true"
  style:--cols={grid.cols}
  style:--rows={grid.rows}
>
  {#each Array(tileCount) as _, i}
    <div
      class="tile"
      bind:this={tiles[i]}
      style:--bg-pos={getBgPosition(i)}
      style:--bg-size={`${window.innerWidth}px ${window.innerHeight}px`}
    >
      <div class="tile-front" style:background-image="url({snapshot})" />
      <div class="tile-back" />
    </div>
  {/each}
</div>

<style>
  .flip-grid {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    perspective: 1200px;
  }

  .tile {
    transform-style: preserve-3d;
    position: relative;
  }

  .tile-front,
  .tile-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
  }

  .tile-front {
    background-image: inherit;
    background-size: var(--bg-size);
    background-position: var(--bg-pos);
  }

  .tile-back {
    transform: rotateX(180deg);
    background: transparent;
  }
</style>
```

## Animation Configuration

```typescript
interface CardFlipTransitionConfig {
  duration: number           // 1.6s total
  staggerDuration: number    // 0.8s - spread of stagger delays
  overshoot: number          // 10 degrees
  targetTileSize: number     // 100px desktop, 80px mobile
}

const defaultConfig: CardFlipTransitionConfig = {
  duration: 1.6,
  staggerDuration: 0.8,
  overshoot: 10,
  targetTileSize: 100
}
```

## Custom Easing

```typescript
// In src/lib/core/gsap.ts

// Peaks at ~105% (≈190°), settles to 100% (180°)
CustomEase.create('flipBounce',
  'M0,0 C0.17,0.67 0.4,1.07 0.5,1.05 0.65,1.02 0.82,1 1,1'
)
```

## Files to Create/Modify

**New Files:**

| File | Purpose |
|------|---------|
| `src/lib/components/CardFlipGrid.svelte` | Grid overlay component |
| `src/lib/transitions/router.ts` | Exclusive transition routing |
| `src/lib/transitions/card-flip.ts` | Card flip execution logic |

**Modified Files:**

| File | Changes |
|------|---------|
| `src/lib/components/PortalContainer.svelte` | Use router instead of hardcoded portal |
| `src/lib/core/gsap.ts` | Add `flipBounce` custom ease |

## Dependencies

```bash
npm install html2canvas
```

## Performance Considerations

- `html2canvas` capture takes ~50-150ms depending on complexity
- Pre-warm by capturing slightly before threshold if needed
- Grid uses CSS Grid (GPU-accelerated) not JS positioning
- Tiles use `will-change: transform` during animation

## Accessibility

- Grid has `aria-hidden="true"` (decorative transition)
- Reduced motion: skip flip, instant crossfade instead

```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

if (prefersReducedMotion) {
  gsap.set(outgoing, { autoAlpha: 0 })
  gsap.set(incoming, { autoAlpha: 1 })
  return
}
```

## Framework Pattern Compliance

- All animations wrapped in `gsap.context()`
- Single cleanup via `ctx.revert()`
- Uses `autoAlpha` for visibility
- Proper guard patterns for DOM/browser APIs
- Mobile variant support via responsive grid calculation
