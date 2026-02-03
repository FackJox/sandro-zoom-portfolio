# Transition Cache Design

**Created:** 2026-01-16T01:54:44Z
**Status:** Approved
**Problem:** About → Services card flip transition has visible lag due to html2canvas capturing screenshots at transition time.

## Solution Summary

Pre-cache scene screenshots as canvas elements during idle time, with resize invalidation and proximity fallback. Swap html2canvas for modern-screenshot (~3x faster recaptures).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TransitionCache                          │
│  (singleton module: src/lib/transitions/cache.ts)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  cacheKey: `${width}x${height}` (e.g., "1920x1080")        │
│                                                             │
│  entries: Map<string, {                                     │
│    about: HTMLCanvasElement,                                │
│    services: HTMLCanvasElement,                             │
│    timestamp: number                                        │
│  }>                                                         │
│                                                             │
│  state: 'empty' | 'capturing' | 'ready'                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Methods:                                                   │
│  - warmCache(aboutEl, servicesEl) → Promise<void>          │
│  - getCanvases() → { about, services } | null              │
│  - invalidate() → void                                      │
│  - isReady() → boolean                                      │
└─────────────────────────────────────────────────────────────┘
```

## Trigger Points

1. **Page load** → `requestIdleCallback` → `warmCache()`
2. **Resize** → debounce 250ms → `invalidate()` → `warmCache()`
3. **Scroll proximity** (fallback) → if not ready → `warmCache()`
4. **Transition execute** → `getCanvases()` → use directly (no capture)

## Capture Implementation

**Library:** `modern-screenshot` (replaces `html2canvas`)

```typescript
import { domToCanvas } from 'modern-screenshot'

async function captureScene(element: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = await domToCanvas(element, {
    scale: window.devicePixelRatio,
    backgroundColor: null,
    style: {
      visibility: 'visible',
      opacity: '1'
    }
  })
  return canvas  // Return canvas directly, no base64 conversion
}
```

**Parallel capture:**

```typescript
async function warmCache(aboutEl: HTMLElement, servicesEl: HTMLElement) {
  if (state === 'capturing') return
  state = 'capturing'

  const key = `${window.innerWidth}x${window.innerHeight}`

  const [about, services] = await Promise.all([
    captureScene(aboutEl),
    captureScene(servicesEl)
  ])

  entries.set(key, { about, services, timestamp: Date.now() })
  state = 'ready'
}
```

## Trigger Integration

### 1. Idle callback on page load

```typescript
export function initCacheWarmup(aboutEl: HTMLElement, servicesEl: HTMLElement) {
  sceneRefs = { about: aboutEl, services: servicesEl }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => warmCache(aboutEl, servicesEl), { timeout: 3000 })
  } else {
    setTimeout(() => warmCache(aboutEl, servicesEl), 1000)
  }
}
```

### 2. Resize handler (debounced)

```typescript
let resizeTimer: ReturnType<typeof setTimeout>

function handleResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    invalidate()
    if (sceneRefs) {
      warmCache(sceneRefs.about, sceneRefs.services)
    }
  }, 250)
}

export function setupResizeListener() {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}
```

### 3. Proximity fallback

```typescript
// In PortalContainer.svelte
ScrollTrigger.create({
  trigger: transitionZone,
  start: 'top-=500px center',
  onEnter: () => {
    if (!transitionCache.isReady()) {
      transitionCache.warmCache(aboutEl, servicesEl)
    }
  },
  once: true
})
```

## Transition Consumption

```typescript
export async function executeCardFlipTransition(
  outgoingEl: HTMLElement,
  incomingEl: HTMLElement,
  config: CardFlipConfig,
  direction: 'forward' | 'reverse'
) {
  lockScroll()

  let outgoingCanvas: HTMLCanvasElement
  let incomingCanvas: HTMLCanvasElement

  const cached = transitionCache.getCanvases()

  if (cached) {
    outgoingCanvas = direction === 'forward' ? cached.about : cached.services
    incomingCanvas = direction === 'forward' ? cached.services : cached.about
  } else {
    console.warn('Transition cache miss - capturing live')
    outgoingCanvas = await captureScene(outgoingEl)
    incomingCanvas = await captureScene(incomingEl)
  }

  const grid = buildFlipGrid(outgoingCanvas, incomingCanvas, config)
  await playFlipAnimation(grid, config)
  destroyGrid(grid)
  unlockScroll()
}
```

**Grid building - canvas-to-canvas drawing:**

```typescript
function buildFlipGrid(
  frontCanvas: HTMLCanvasElement,
  backCanvas: HTMLCanvasElement,
  config: CardFlipConfig
) {
  tiles.forEach(tile => {
    const tileCanvas = document.createElement('canvas')
    const ctx = tileCanvas.getContext('2d')

    ctx.drawImage(
      frontCanvas,
      tile.x, tile.y, tile.width, tile.height,
      0, 0, tile.width, tile.height
    )

    tile.frontFace.appendChild(tileCanvas)
    // Same for backFace with backCanvas
  })
}
```

## File Changes

**New file:**
- `src/lib/transitions/cache.ts` - Cache singleton

**Modified files:**
- `src/lib/transitions/card-flip.ts` - Remove html2canvas, use cache
- `src/lib/components/PortalContainer.svelte` - Add init + proximity trigger
- `package.json` - Swap html2canvas → modern-screenshot

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cache invalidation | Exact pixel match | User requirement for accuracy |
| Initial capture | Hybrid (idle + proximity) | Non-blocking with guaranteed fallback |
| Storage | Canvas elements in memory | Fastest access, no encode/decode |
| Resize handling | Debounced immediate (250ms) | Balance between responsiveness and CPU |
| Screenshot library | modern-screenshot | ~3x faster than html2canvas |

## Performance Expectations

| Scenario | Before | After |
|----------|--------|-------|
| Transition (cache hit) | 200-400ms delay | ~0ms delay |
| Transition (cache miss) | 200-400ms delay | 70-130ms delay |
| Resize recapture | N/A | ~150ms (non-blocking) |
| Initial page load | No impact | Idle capture ~150ms |
