# Card Flip Transition Design

**Date:** 2026-01-14
**Status:** Approved
**Scope:** Replace About→Services portal zoom with card flip grid transition

## Overview

Replace the portal zoom transition between the final About beat (Scene 4: "Values") and Services (Scene 5) with a card-flip grid effect inspired by junni.co.jp.

**Key Characteristics:**
- Grid of tiles reconstructs the About scene as an image
- **Scan corruption pattern** - row-by-row flip (top→bottom, left→right) with random variation
- **10% glitch tiles** - flip at unexpected times for controlled imperfection
- **Mechanical easing** - `ease-lock-on` (gimbal acquisition), no bounce
- **Digital visual treatment** - scan lines, 1px gaps, subtle borders
- Scroll-triggered (not scrubbed) - plays through automatically
- 1.6s total duration
- **Scroll locked during transition** - prevents jump-forward on completion

**Alpine Noir / Machine Archetype:**
The effect feels like a digital display refresh or satellite data transmission rather than a smooth organic ripple. Precision landing with controlled imperfection.

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
- Desktop: ~150px (larger tiles, fewer = more deliberate, machine-like)
- Mobile: ~100px

**Example Results:**

| Viewport | Target | Grid | Tile Size | Aspect |
|----------|--------|------|-----------|--------|
| 1920×1080 (desktop landscape) | 150px | 13×7 | 148×154px | ~0.96 |
| 1440×900 (laptop) | 150px | 10×6 | 144×150px | ~0.96 |
| 428×926 (iPhone portrait) | 100px | 4×9 | 107×103px | ~1.04 |
| 926×428 (iPhone landscape) | 100px | 9×4 | 103×107px | ~0.96 |

## Scroll Locking (GSAP Observer)

**Problem:** The transition plays at fixed duration (1.6s) but isn't scrub-controlled. If the user continues scrolling during the animation, scroll position advances past the transition zone, causing a "jump" when the animation completes.

**Solution:** Use GSAP Observer to intercept all scroll input during the transition.

```typescript
// src/lib/transitions/scroll-lock.ts

import { Observer } from 'gsap/Observer'

let scrollObserver: Observer | null = null

export function lockScroll(): void {
  // Kill any existing observer
  scrollObserver?.kill()

  scrollObserver = Observer.create({
    type: 'wheel,touch,scroll',
    preventDefault: true,
    allowClicks: true,
    tolerance: 0,
    onPress: (self) => self.event?.preventDefault(),
  })
}

export function unlockScroll(targetScrollY: number): void {
  scrollObserver?.kill()
  scrollObserver = null

  // Set scroll to where the incoming scene begins
  window.scrollTo({ top: targetScrollY, behavior: 'instant' })
}
```

**Why GSAP Observer?**
- Handles wheel, touch, and programmatic scroll
- Cross-browser touch device support
- Doesn't modify body/html styles (which breaks fixed positioning)
- Clean kill/cleanup via GSAP

**Target Scroll Position:**
When unlocking, set scroll to the START of Scene 5 (Services):

```typescript
// Scene 5 starts after scenes 0-4: (16 + 36 + 8 + 8 + 8) * scrollSpeed
const scene5StartScroll = 76 * 65  // = 4940px
```

## Scan Corruption Pattern

**Row-by-Row Scan with Variation:**

Tiles flip in a scan pattern (top→bottom, left→right within each row) with random timing variation to simulate data transmission latency.

```typescript
// src/lib/transitions/card-flip.ts

interface TileDelay {
  index: number
  delay: number
  isGlitch: boolean
}

function calculateScanDelays(
  cols: number,
  rows: number,
  staggerDuration: number,
  seed: number = 42  // Reproducible across sessions
): TileDelay[] {
  const rng = seededRandom(seed)
  const tileCount = cols * rows
  const delays: TileDelay[] = []

  // Base delay per row (stagger spread across all rows)
  const rowDelay = staggerDuration / rows

  for (let i = 0; i < tileCount; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    // Base scan timing: row position + column offset within row
    const colOffset = (col / cols) * rowDelay * 0.3  // 30% variation within row
    let delay = row * rowDelay + colOffset

    // Add random "latency" variation (-10% to +10% of row delay)
    const latencyVariation = (rng() - 0.5) * 0.2 * rowDelay
    delay += latencyVariation

    // 10% chance of glitch tile (flips at unexpected time)
    const isGlitch = rng() < 0.1
    if (isGlitch) {
      // Glitch tiles flip either early or late (±30% of total stagger)
      const glitchOffset = (rng() - 0.5) * 0.6 * staggerDuration
      delay = Math.max(0, delay + glitchOffset)
    }

    delays.push({ index: i, delay, isGlitch })
  }

  return delays
}

// Seeded random for reproducible results
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}
```

**Glitch Tiles (10%):**
- Flip at unexpected times (early or late)
- Creates controlled imperfection
- Seeded random ensures same pattern every session

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
  1. LOCK SCROLL (Observer intercepts input)
  2. html2canvas captures Scene 4
  3. CardFlipGrid mounts over viewport
  4. Scene 4 DOM hidden (autoAlpha: 0)
  5. Scene 5 (Services) positioned underneath
  6. Flip animation plays (1.6s)
  7. CardFlipGrid unmounts
  8. UNLOCK SCROLL → set to Scene 5 start position
  9. Scene 5 now visible, scroll continues normally
```

```typescript
// src/lib/transitions/card-flip.ts

import { lockScroll, unlockScroll } from './scroll-lock'

interface ExecuteCardFlipConfig extends CardFlipTransitionConfig {
  targetScrollY: number  // Where to set scroll after transition
}

async function executeCardFlipTransition(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  config: ExecuteCardFlipConfig
): Promise<void> {
  // 1. Lock scroll immediately
  lockScroll()

  try {
    // 2. Capture outgoing scene
    const snapshot = await captureScene(outgoing)

    // 3. Position incoming underneath (visible but behind grid)
    gsap.set(incoming, { autoAlpha: 1, zIndex: 0 })
    incoming.style.visibility = 'visible'

    // 4. Mount grid overlay (zIndex: 100, above incoming)
    const grid = mountCardFlipGrid(snapshot, config)

    // 5. Hide outgoing DOM (grid shows the snapshot)
    gsap.set(outgoing, { autoAlpha: 0 })

    // 6. Play flip animation (returns Promise)
    await grid.play()

    // 7. Cleanup grid
    grid.destroy()

    // 8. Update z-index states (match portal behavior)
    outgoing.style.visibility = 'hidden'
    outgoing.style.zIndex = '0'
    incoming.style.zIndex = '20'

  } finally {
    // 9. Always unlock scroll, even if error
    unlockScroll(config.targetScrollY)
  }
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

**Visual Treatment (Alpine Noir / Machine):**
- 1px gaps between tiles (Black Stallion #0f171a visible through gaps)
- Front face: subtle border (Cover of Night at 20% opacity)
- Back face: Egg Toast accent (15% opacity) - digital activation state
- Scan line overlay on entire grid

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { gsap } from 'gsap'
  import { calculateScanDelays } from '../transitions/card-flip'

  // Brand colors
  const COLORS = {
    blackStallion: '#0f171a',     // Background through gaps
    coverOfNight: '#0c1012',      // Front border (20% opacity)
    eggToast: '#f4a261',          // Back accent (15% opacity)
  }

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
  let tileDelays = $state<TileDelay[]>([])

  $effect(() => {
    if (typeof window === 'undefined') return

    // 150px desktop, 100px mobile
    const targetSize = window.innerWidth < 768 ? 100 : 150
    const cols = Math.round(window.innerWidth / targetSize)
    const rows = Math.round(window.innerHeight / targetSize)

    grid = {
      cols,
      rows,
      tileW: window.innerWidth / cols,
      tileH: window.innerHeight / rows
    }

    // Calculate scan pattern delays with glitch tiles
    tileDelays = calculateScanDelays(cols, rows, config.staggerDuration)
  })

  const tileCount = $derived(grid.cols * grid.rows)

  function getBgPosition(index: number): string {
    const col = index % grid.cols
    const row = Math.floor(index / grid.cols)
    // Account for 1px gaps in background positioning
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

        // Use pre-calculated scan delays
        tileDelays.forEach(({ index, delay }) => {
          tl.to(tiles[index], {
            rotateX: 180,
            duration: config.duration - config.staggerDuration,
            ease: 'ease-lock-on'  // Mechanical: fast acquisition, smooth settle
          }, delay)
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
  style:--bg-color={COLORS.blackStallion}
>
  <!-- Scan line overlay -->
  <div class="scan-lines" />

  {#each Array(tileCount) as _, i}
    {@const isGlitch = tileDelays[i]?.isGlitch}
    <div
      class="tile"
      class:glitch={isGlitch}
      bind:this={tiles[i]}
    >
      <div
        class="tile-front"
        style:background-image="url({snapshot})"
        style:--bg-pos={getBgPosition(i)}
        style:--bg-size={`${window.innerWidth}px ${window.innerHeight}px`}
      />
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
    gap: 1px;  /* Digital data block separation */
    background: var(--bg-color);  /* Black Stallion visible through gaps */
    perspective: 1200px;
  }

  /* Scan line overlay - CRT/digital display effect */
  .scan-lines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1000;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
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
    background-size: var(--bg-size);
    background-position: var(--bg-pos);
    /* Subtle border - Cover of Night at 20% opacity */
    box-shadow: inset 0 0 0 1px rgba(12, 16, 18, 0.2);
  }

  .tile-back {
    transform: rotateX(180deg);
    background: transparent;
    /* Egg Toast accent - digital activation state */
    box-shadow: inset 0 0 0 1px rgba(244, 162, 97, 0.15);
  }

  /* Glitch tiles get subtle visual distinction */
  .tile.glitch .tile-front {
    box-shadow: inset 0 0 0 1px rgba(244, 162, 97, 0.1);
  }
</style>
```

## Animation Configuration

```typescript
interface CardFlipTransitionConfig {
  duration: number           // 1.6s per tile flip
  staggerDuration: number    // 0.8s - spread of scan timing
  glitchProbability: number  // 0.1 (10% of tiles)
  seed: number               // Random seed for reproducibility
}

const defaultConfig: CardFlipTransitionConfig = {
  duration: 1.6,
  staggerDuration: 0.8,
  glitchProbability: 0.1,
  seed: 42
}

// Tile sizes determined by viewport, not config
// Desktop: 150px, Mobile: 100px
```

## Mechanical Easing

Uses existing brand easing - no new custom ease needed:

```typescript
// Already defined in src/lib/core/gsap.ts

// ease-lock-on: "Fast acquisition, smooth settle—like a gimbal finding and locking onto a subject"
CustomEase.create('ease-lock-on', 'M0,0 C0.19,1 0.22,1 1,1')

// No bounce, no overshoot - precision landing
// The card snaps to 180° with mechanical accuracy
```

**Why ease-lock-on:**
- Matches Alpine Noir / Machine archetype
- Fast initial rotation (gimbal acquiring target)
- Smooth deceleration into final position
- No hunting, no correction - precision landing

## Files to Create/Modify

**New Files:**

| File | Purpose |
|------|---------|
| `src/lib/components/CardFlipGrid.svelte` | Grid overlay component |
| `src/lib/transitions/router.ts` | Exclusive transition routing |
| `src/lib/transitions/card-flip.ts` | Card flip execution logic |
| `src/lib/transitions/scroll-lock.ts` | GSAP Observer scroll locking |
| `src/lib/transitions/index.ts` | Barrel exports |

**Modified Files:**

| File | Changes |
|------|---------|
| `src/lib/components/PortalContainer.svelte` | Use router instead of hardcoded portal |
| `src/lib/core/gsap.ts` | Register Observer plugin (ease-lock-on already exists) |

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
