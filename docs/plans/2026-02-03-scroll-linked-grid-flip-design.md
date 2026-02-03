# Scroll-Linked Grid Flip Transition Design

**Date:** 2026-02-03
**Status:** Approved
**Scope:** Convert card-flip transition from threshold-triggered to scroll-scrubbed

## Overview

Convert the card-flip grid transition from a threshold-triggered, time-based animation to a fully scroll-scrubbed animation that matches the rest of the site's transitions.

**Current behavior:** Scroll hits threshold → locks scroll → plays 1.6s animation → unlocks scroll

**New behavior:** Scroll enters transition zone → grid mounts → tile rotation driven by scroll progress → grid unmounts when leaving zone

## Goals

1. **Scroll-linked** - Flip progress maps directly to scroll position
2. **Simplified visuals** - Remove gaps, outlines, cut effects that cause jank
3. **Bidirectional** - User can scroll forward and backward through the transition
4. **Consistent** - Matches the feel of portal zoom transitions

## Architecture

### Lifecycle

```
Scroll enters transition zone (either direction)
         │
         ▼
    mountCardFlipGrid()
    - Create grid element with DOM clones
    - Hide outgoing/incoming scenes
    - Attach scrubbed ScrollTrigger
         │
         ▼
    User scrolls through zone
    - Tile rotations driven by scroll progress
    - Can pause, reverse, scrub at any speed
         │
         ▼
Scroll leaves transition zone (either direction)
         │
         ▼
    unmountCardFlipGrid()
    - Revert GSAP context
    - Remove grid element
    - Scene visibility handled by existing logic
```

### ScrollTrigger Integration

```typescript
// Mount/unmount triggers
ScrollTrigger.create({
  trigger: portalContainer,
  start: `top+=${transitionStart} top`,
  end: `top+=${transitionEnd} top`,

  onEnter: () => mountCardFlipGrid('forward'),
  onEnterBack: () => mountCardFlipGrid('reverse'),
  onLeave: () => unmountCardFlipGrid(),
  onLeaveBack: () => unmountCardFlipGrid(),
})

// Inside mountCardFlipGrid - scrubbed animation
ScrollTrigger.create({
  trigger: portalContainer,
  start: `top+=${transitionStart} top`,
  end: `top+=${transitionEnd} top`,
  animation: flipTimeline,
  scrub: true,
})
```

## Tile Animation Timing

### Stagger Pattern

Each tile has a calculated start position (in scroll progress) based on:
- Row position (top rows start first)
- Column offset within row (left-to-right bias)
- Random variation (organic feel)
- Glitch offset (10% of tiles flip way early or late)

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Stagger spread | 60% | Tile start times span first 60% of scroll range |
| Flip duration | 40% | Each tile takes 40% of scroll range to complete 180° |
| Glitch probability | 10% | Tiles that flip way early or late |
| Glitch offset | ±25% | How far glitch tiles deviate from expected timing |

### Timing Visualization

```
Scroll Progress: 0% -------- 50% -------- 100%
                 │           │            │
Tile (row 0):    [====flip====]           │  starts ~0%
Tile (row 2):         [====flip====]      │  starts ~20%
Tile (row 4):              [====flip====] │  starts ~40%
Glitch (early):  [====flip====]           │  from row 4, starts ~5%
Glitch (late):                  [====flip====]  from row 1, starts ~55%
```

### Delay Calculation

```typescript
function calculateScrubDelays(
  cols: number,
  rows: number,
  glitchProbability: number = 0.1,
  seed: number = 42
): { delay: number; isGlitch: boolean }[] {
  const rng = seededRandom(seed)
  const delays: { delay: number; isGlitch: boolean }[] = []
  const staggerSpread = 0.6

  for (let i = 0; i < cols * rows; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    // Base: row position
    const rowDelay = (row / rows) * staggerSpread

    // Column offset: left-to-right bias within row
    const colOffset = (col / cols) * (staggerSpread / rows) * 0.3

    // Random variation: ±15% of one row's delay range
    const rowRange = staggerSpread / rows
    const randomOffset = (rng() - 0.5) * 0.3 * rowRange

    let delay = rowDelay + colOffset + randomOffset

    // 10% glitch tiles: flip way early or way late
    const isGlitch = rng() < glitchProbability
    if (isGlitch) {
      const glitchOffset = (rng() - 0.5) * 0.5 * staggerSpread
      delay = Math.max(0, Math.min(staggerSpread, delay + glitchOffset))
    }

    delays.push({ delay, isGlitch })
  }

  return delays
}
```

## Timeline Construction

```typescript
function buildScrubTimeline(
  tiles: HTMLElement[],
  tileDelays: { delay: number; isGlitch: boolean }[],
  flipDuration: number = 0.4
): gsap.core.Timeline {
  const tl = gsap.timeline()

  tileDelays.forEach(({ delay }, i) => {
    const tile = tiles[i]
    if (!tile) return

    tl.fromTo(tile,
      { rotateX: 0 },
      { rotateX: 180, duration: flipDuration, ease: 'none' },
      delay
    )
  })

  return tl
}
```

**Easing:** `ease: 'none'` on individual tiles - the scroll itself provides the control. Linear mapping feels mechanical and deliberate.

## Simplified Visual Treatment

### Removed

| Element | Reason |
|---------|--------|
| 1px gaps between tiles | Sub-pixel rendering issues, content shifting |
| Border/cut-line animations | Time-based phased animation incompatible with scrub |
| Scan line overlay | Decorative noise, not needed |
| Box-shadow borders on faces | Layout jank |

### Grid Structure

```html
<div class="card-flip-grid">
  <!-- Container: fixed, inset 0, perspective 1200px -->

  <div class="flip-tile">
    <!-- Absolute positioned, transform-style: preserve-3d -->

    <div class="tile-front">
      <!-- backface-visibility: hidden -->
      <!-- Clone of outgoing scene, offset for this tile's region -->
    </div>

    <div class="tile-back">
      <!-- rotateX(180deg), backface-visibility: hidden -->
      <!-- Clone of incoming scene, offset for this tile's region -->
    </div>
  </div>

  <!-- ... more tiles -->
</div>
```

### Tile Positioning

No gaps - tiles cover viewport exactly:

```typescript
const tileWidth = viewportWidth / cols
const tileHeight = viewportHeight / rows

// Position each tile
const left = col * tileWidth
const top = row * tileHeight
```

### Minimal Styles

```css
.card-flip-grid {
  position: fixed;
  inset: 0;
  z-index: 100;
  perspective: 1200px;
  pointer-events: none;
}

.flip-tile {
  position: absolute;
  transform-style: preserve-3d;
}

.tile-front,
.tile-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  overflow: hidden;
}

.tile-back {
  transform: rotateX(180deg);
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/transitions/card-flip.ts` | Remove time-based animation, add `buildScrubTimeline()`, simplify grid creation |
| `src/lib/transitions/router.ts` | Update to scrubbed approach with mount/unmount lifecycle |

### Changes to `card-flip.ts`

**Remove:**
- `createFlipAnimation()` (time-based with cut-line phases)
- `lockScroll` / `unlockScroll` imports and usage
- Border/outline animations in grid creation
- Gap styling
- Scan line overlay creation

**Add:**
- `buildScrubTimeline()` - creates timeline for ScrollTrigger scrub
- `calculateScrubDelays()` - updated delay calculation

**Simplify:**
- `createFlipGridElement()` - no borders, no gaps, no scan lines
- `mountCardFlipGrid()` - returns element + timeline for external attachment

## Preserved Behavior

- DOM cloning approach (pixel-perfect rendering)
- Grid calculation (cols/rows based on viewport)
- Row-by-row scan wave progression
- Random variation within rows
- 10% glitch tiles (early/late flip)
- Seeded random for reproducibility
- Reduced motion support (instant crossfade)

## Removed Behavior

- Scroll locking during transition
- Fixed 1.6s duration
- Cut-line animation phases
- Visual gaps between tiles
- Tile borders/outlines
- Scan line overlay

## Performance Considerations

- No change to DOM cloning approach (already efficient)
- Simpler styles = less paint/composite work
- `scrub: true` uses requestAnimationFrame internally
- Grid only exists while in transition zone
