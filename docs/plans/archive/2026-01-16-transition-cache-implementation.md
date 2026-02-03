# Transition Cache Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate lag in About→Services card flip transition by pre-caching scene screenshots as canvas elements during idle time.

**Architecture:** Singleton cache module stores HTMLCanvasElement references keyed by viewport dimensions. Dual-phase warmup (idle + proximity fallback) ensures cache is ready before transition. Canvas-to-canvas drawing eliminates base64 encode/decode overhead.

**Tech Stack:** modern-screenshot (replacing html2canvas), GSAP ScrollTrigger, Svelte 5

---

## Task 1: Install modern-screenshot and remove html2canvas

**Files:**
- Modify: `package.json`

**Step 1: Remove html2canvas and add modern-screenshot**

Run:
```bash
npm uninstall html2canvas && npm install modern-screenshot
```

Expected: `html2canvas` removed from package.json, `modern-screenshot` added to dependencies

**Step 2: Verify installation**

Run:
```bash
cat package.json | grep -E "(html2canvas|modern-screenshot)"
```

Expected: Only `modern-screenshot` appears in output

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap html2canvas for modern-screenshot (~3x faster)"
```

---

## Task 2: Create the transition cache module

**Files:**
- Create: `src/lib/transitions/cache.ts`

**Step 1: Create cache module with types and state**

```typescript
/**
 * Transition Cache
 *
 * Pre-caches scene screenshots as canvas elements for instant transitions.
 * Uses dual-phase warmup: idle callback + proximity fallback.
 */
import { domToCanvas } from 'modern-screenshot'

// ============================================================================
// Types
// ============================================================================

interface CacheEntry {
  about: HTMLCanvasElement
  services: HTMLCanvasElement
  timestamp: number
}

type CacheState = 'empty' | 'capturing' | 'ready'

// ============================================================================
// State (module-level singleton)
// ============================================================================

let entries = new Map<string, CacheEntry>()
let state: CacheState = 'empty'
let sceneRefs: { about: HTMLElement; services: HTMLElement } | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let resizeCleanup: (() => void) | null = null

// ============================================================================
// Helpers
// ============================================================================

function getCacheKey(): string {
  return `${window.innerWidth}x${window.innerHeight}`
}

// ============================================================================
// Capture
// ============================================================================

async function captureScene(element: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = await domToCanvas(element, {
    scale: window.devicePixelRatio,
    backgroundColor: null,
    style: {
      visibility: 'visible',
      opacity: '1',
    },
  })
  return canvas
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Warm the cache by capturing both scenes.
 * Safe to call multiple times - will skip if already capturing.
 */
export async function warmCache(
  aboutEl: HTMLElement,
  servicesEl: HTMLElement
): Promise<void> {
  if (state === 'capturing') {
    console.log('[TransitionCache] Already capturing, skipping')
    return
  }

  state = 'capturing'
  const key = getCacheKey()

  console.log(`[TransitionCache] Warming cache for ${key}...`)

  try {
    // Store refs for resize recapture
    sceneRefs = { about: aboutEl, services: servicesEl }

    // Temporarily ensure services is visible for capture
    const servicesWasHidden = servicesEl.style.visibility === 'hidden'
    const servicesAutoAlpha = servicesEl.style.opacity
    if (servicesWasHidden) {
      servicesEl.style.visibility = 'visible'
      servicesEl.style.opacity = '1'
    }

    // Capture in parallel
    const [about, services] = await Promise.all([
      captureScene(aboutEl),
      captureScene(servicesEl),
    ])

    // Restore services visibility
    if (servicesWasHidden) {
      servicesEl.style.visibility = 'hidden'
      servicesEl.style.opacity = servicesAutoAlpha
    }

    // Store in cache
    entries.set(key, { about, services, timestamp: Date.now() })
    state = 'ready'

    console.log(`[TransitionCache] Cache ready for ${key}`)
  } catch (error) {
    console.error('[TransitionCache] Capture failed:', error)
    state = 'empty'
  }
}

/**
 * Get cached canvases for current viewport size.
 * Returns null if cache miss.
 */
export function getCanvases(): { about: HTMLCanvasElement; services: HTMLCanvasElement } | null {
  const key = getCacheKey()
  const entry = entries.get(key)

  if (entry) {
    console.log(`[TransitionCache] Cache hit for ${key}`)
    return { about: entry.about, services: entry.services }
  }

  console.log(`[TransitionCache] Cache miss for ${key}`)
  return null
}

/**
 * Invalidate all cached entries.
 */
export function invalidate(): void {
  entries.clear()
  state = 'empty'
  console.log('[TransitionCache] Cache invalidated')
}

/**
 * Check if cache is ready for current viewport.
 */
export function isReady(): boolean {
  return state === 'ready' && entries.has(getCacheKey())
}

/**
 * Get current cache state.
 */
export function getState(): CacheState {
  return state
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize cache warmup on idle.
 * Call this once on mount with scene element references.
 */
export function initCacheWarmup(
  aboutEl: HTMLElement,
  servicesEl: HTMLElement
): void {
  sceneRefs = { about: aboutEl, services: servicesEl }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => warmCache(aboutEl, servicesEl),
      { timeout: 3000 }
    )
    console.log('[TransitionCache] Scheduled idle warmup')
  } else {
    // Safari fallback
    setTimeout(() => warmCache(aboutEl, servicesEl), 1000)
    console.log('[TransitionCache] Scheduled timeout warmup (Safari fallback)')
  }
}

/**
 * Set up resize listener for cache invalidation.
 * Returns cleanup function.
 */
export function setupResizeListener(): () => void {
  function handleResize() {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }

    resizeTimer = setTimeout(() => {
      invalidate()
      if (sceneRefs) {
        warmCache(sceneRefs.about, sceneRefs.services)
      }
    }, 250)
  }

  window.addEventListener('resize', handleResize)
  resizeCleanup = () => window.removeEventListener('resize', handleResize)

  console.log('[TransitionCache] Resize listener active')
  return resizeCleanup
}

// ============================================================================
// Cleanup (for HMR)
// ============================================================================

/**
 * Destroy cache and clean up listeners.
 * Call this on component unmount.
 */
export function destroyCache(): void {
  entries.clear()
  state = 'empty'
  sceneRefs = null

  if (resizeTimer) {
    clearTimeout(resizeTimer)
    resizeTimer = null
  }

  if (resizeCleanup) {
    resizeCleanup()
    resizeCleanup = null
  }

  console.log('[TransitionCache] Cache destroyed')
}
```

**Step 2: Verify file created**

Run:
```bash
test -f src/lib/transitions/cache.ts && echo "File exists"
```

Expected: `File exists`

**Step 3: Commit**

```bash
git add src/lib/transitions/cache.ts
git commit -m "feat: add transition cache module for pre-cached screenshots"
```

---

## Task 3: Export cache from transitions index

**Files:**
- Modify: `src/lib/transitions/index.ts`

**Step 1: Add cache exports**

Add to the end of `src/lib/transitions/index.ts`:

```typescript
export {
  warmCache,
  getCanvases,
  invalidate,
  isReady,
  getState,
  initCacheWarmup,
  setupResizeListener,
  destroyCache,
} from './cache'
```

**Step 2: Verify exports**

Run:
```bash
grep -c "from './cache'" src/lib/transitions/index.ts
```

Expected: `1`

**Step 3: Commit**

```bash
git add src/lib/transitions/index.ts
git commit -m "feat: export cache module from transitions"
```

---

## Task 4: Modify card-flip.ts to use cached canvases

**Files:**
- Modify: `src/lib/transitions/card-flip.ts`

**Step 1: Remove html2canvas import**

Replace line 14:
```typescript
import html2canvas from 'html2canvas'
```

With:
```typescript
import { domToCanvas } from 'modern-screenshot'
import { getCanvases } from './cache'
```

**Step 2: Update captureScene to use modern-screenshot and return canvas**

Replace `captureScene` function (lines 174-183) with:

```typescript
/**
 * Capture a scene element as a canvas using modern-screenshot.
 * Returns the canvas directly (no base64 conversion).
 */
export async function captureScene(sceneElement: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = await domToCanvas(sceneElement, {
    scale: window.devicePixelRatio,
    backgroundColor: null,
    style: {
      visibility: 'visible',
      opacity: '1',
    },
  })
  return canvas
}
```

**Step 3: Update createFlipGridElement to accept canvas elements**

Replace the function signature and body (lines 196-291). Change the parameter types from `string` to `HTMLCanvasElement`:

```typescript
/**
 * Create the flip grid DOM element with all tiles.
 * Includes digital visual treatment: 1px gaps, borders, scan lines.
 *
 * @param outgoingCanvas - Canvas of the outgoing scene (front face)
 * @param incomingCanvas - Canvas of the incoming scene (back face)
 */
export function createFlipGridElement(
  outgoingCanvas: HTMLCanvasElement,
  incomingCanvas: HTMLCanvasElement,
  dimensions: GridDimensions,
  tileDelays: TileDelay[]
): HTMLElement {
  const { cols, rows, tileWidth, tileHeight } = dimensions
  const viewportWidth = cols * tileWidth
  const viewportHeight = rows * tileHeight

  // Create container with 1px gaps
  const container = document.createElement('div')
  container.className = 'card-flip-grid'
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
    gap: 1px;
    background: ${COLORS.blackStallion};
    perspective: 1200px;
    pointer-events: none;
  `

  // Create scan line overlay
  const scanLines = document.createElement('div')
  scanLines.className = 'scan-lines'
  scanLines.style.cssText = `
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
  `
  container.appendChild(scanLines)

  // Create tiles using canvas-to-canvas drawing
  const tileCount = cols * rows
  for (let i = 0; i < tileCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const isGlitch = tileDelays[i]?.isGlitch ?? false

    const tile = document.createElement('div')
    tile.className = `flip-tile${isGlitch ? ' glitch' : ''}`
    tile.dataset.index = String(i)
    tile.style.cssText = `
      transform-style: preserve-3d;
      position: relative;
    `

    // Front face canvas (shows OUTGOING scene slice)
    const frontCanvas = document.createElement('canvas')
    frontCanvas.width = tileWidth * window.devicePixelRatio
    frontCanvas.height = tileHeight * window.devicePixelRatio
    frontCanvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      box-shadow: inset 0 0 0 1px ${isGlitch ? COLORS.eggToastGlitch : COLORS.coverOfNight};
    `
    const frontCtx = frontCanvas.getContext('2d')
    if (frontCtx) {
      // Draw the relevant region from outgoing canvas
      frontCtx.drawImage(
        outgoingCanvas,
        col * tileWidth * window.devicePixelRatio,
        row * tileHeight * window.devicePixelRatio,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio,
        0,
        0,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio
      )
    }

    // Back face canvas (shows INCOMING scene slice)
    const backCanvas = document.createElement('canvas')
    backCanvas.width = tileWidth * window.devicePixelRatio
    backCanvas.height = tileHeight * window.devicePixelRatio
    backCanvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      transform: rotateX(180deg);
      box-shadow: inset 0 0 0 1px ${COLORS.eggToast};
    `
    const backCtx = backCanvas.getContext('2d')
    if (backCtx) {
      // Draw the relevant region from incoming canvas
      backCtx.drawImage(
        incomingCanvas,
        col * tileWidth * window.devicePixelRatio,
        row * tileHeight * window.devicePixelRatio,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio,
        0,
        0,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio
      )
    }

    tile.appendChild(frontCanvas)
    tile.appendChild(backCanvas)
    container.appendChild(tile)
  }

  return container
}
```

**Step 4: Update mountCardFlipGrid signature**

Replace the function (lines 350-384) to accept canvas elements:

```typescript
/**
 * Mount the card flip grid and return control functions.
 *
 * @param outgoingCanvas - Canvas of the outgoing scene (front face)
 * @param incomingCanvas - Canvas of the incoming scene (back face)
 * @param config - Transition configuration
 */
export function mountCardFlipGrid(
  outgoingCanvas: HTMLCanvasElement,
  incomingCanvas: HTMLCanvasElement,
  config: CardFlipTransitionConfig
): CardFlipGrid {
  const targetSize = getTargetTileSize()
  const dimensions = calculateGrid(
    window.innerWidth,
    window.innerHeight,
    targetSize
  )

  const tileDelays = calculateScanDelays(
    dimensions.cols,
    dimensions.rows,
    config.staggerDuration,
    config.glitchProbability,
    config.seed
  )

  const element = createFlipGridElement(outgoingCanvas, incomingCanvas, dimensions, tileDelays)
  document.body.appendChild(element)

  return {
    element,
    dimensions,
    tileDelays,
    play: () => createFlipAnimation(element, dimensions, tileDelays, config),
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    },
  }
}
```

**Step 5: Update executeCardFlipTransition to use cache**

Replace the function (lines 394-474) with cache-aware version:

```typescript
/**
 * Execute the complete card flip transition.
 * Uses pre-cached canvases when available, falls back to live capture.
 *
 * @param outgoing - The outgoing scene element
 * @param incoming - The incoming scene element
 * @param config - Transition configuration including targetScrollY
 * @param direction - 'forward' (default) or 'reverse' for scrolling back
 */
export async function executeCardFlipTransition(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  config: ExecuteCardFlipConfig,
  direction: 'forward' | 'reverse' = 'forward'
): Promise<void> {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) {
    // Instant transition, no flip
    gsap.set(outgoing, { autoAlpha: 0 })
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    outgoing.style.visibility = 'hidden'
    outgoing.style.zIndex = '0'
    incoming.style.zIndex = '20'
    window.scrollTo({ top: config.targetScrollY, behavior: 'instant' as ScrollBehavior })
    return
  }

  // 1. Lock scroll immediately
  lockScroll()

  try {
    console.log(`[CardFlip] Starting ${direction} transition...`)

    // 2. Try to get cached canvases
    let outgoingCanvas: HTMLCanvasElement
    let incomingCanvas: HTMLCanvasElement

    const cached = getCanvases()

    if (cached) {
      console.log('[CardFlip] Using cached canvases')
      // For forward: outgoing=about, incoming=services
      // For reverse: outgoing=services, incoming=about
      outgoingCanvas = direction === 'forward' ? cached.about : cached.services
      incomingCanvas = direction === 'forward' ? cached.services : cached.about
    } else {
      // Fallback: capture live (shouldn't happen if warmup worked)
      console.warn('[CardFlip] Cache miss - capturing live')

      outgoingCanvas = await captureScene(outgoing)

      // Temporarily show incoming to capture
      const originalVisibility = incoming.style.visibility
      gsap.set(incoming, { autoAlpha: 1 })
      incoming.style.visibility = 'visible'

      incomingCanvas = await captureScene(incoming)

      // Hide incoming again
      gsap.set(incoming, { autoAlpha: 0 })
      incoming.style.visibility = 'hidden'
    }

    // 3. Mount grid overlay with canvases
    const grid = mountCardFlipGrid(outgoingCanvas, incomingCanvas, config)
    console.log(`[CardFlip] Grid mounted: ${grid.dimensions.cols}x${grid.dimensions.rows} (${grid.tileDelays.filter(t => t.isGlitch).length} glitch tiles)`)

    // 4. Hide outgoing DOM (grid shows its canvas)
    gsap.set(outgoing, { autoAlpha: 0 })
    outgoing.style.visibility = 'hidden'

    // 5. Play flip animation
    console.log('[CardFlip] Starting flip animation...')
    await grid.play()
    console.log('[CardFlip] Flip animation complete')

    // 6. Cleanup grid
    grid.destroy()

    // 7. Show incoming, update z-index states
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    incoming.style.zIndex = '20'
    outgoing.style.zIndex = '0'

    console.log('[CardFlip] Transition complete')

  } finally {
    // 8. Always unlock scroll, even if error
    unlockScroll(config.targetScrollY)
  }
}
```

**Step 6: Build to verify no TypeScript errors**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 7: Commit**

```bash
git add src/lib/transitions/card-flip.ts
git commit -m "refactor: card-flip uses canvas cache and modern-screenshot"
```

---

## Task 5: Integrate cache warmup into PortalContainer

**Files:**
- Modify: `src/lib/components/PortalContainer.svelte`

**Step 1: Add cache imports**

After line 69 (after the existing transitions import), add:

```typescript
import { initCacheWarmup, setupResizeListener, destroyCache, isReady, warmCache } from '../transitions'
```

**Step 2: Add cache initialization in onMount**

Inside the `onMount` callback, after the line `ScrollTrigger.refresh()` (around line 369), add:

```typescript
    // ========================================================================
    // TRANSITION CACHE WARMUP
    // ========================================================================

    // Find the About and Services scenes for cache warmup
    const aboutScene = viewportEl!.querySelector('[data-scene="about"]') as HTMLElement
    const servicesScene = viewportEl!.querySelector('[data-scene="services"]') as HTMLElement

    if (aboutScene && servicesScene) {
      // Initialize idle warmup
      initCacheWarmup(aboutScene, servicesScene)

      // Set up resize listener for cache invalidation
      const cleanupResize = setupResizeListener()

      // Store for cleanup
      ;(ctx as any)._cacheCleanup = cleanupResize

      // Proximity fallback: warm cache when user gets close to transition
      // Find the card flip transition zone (scene 4 -> 5, which is About -> Services)
      const cardFlipIndex = Array.from(sceneElements).findIndex(
        (el) => (el as HTMLElement).dataset.scene === 'about'
      )

      if (cardFlipIndex !== -1 && cardFlipIndex < sceneCount - 1) {
        const transitionStart = sceneStartTimes[cardFlipIndex + 1] - transitionDuration / 2
        const proximityTriggerScroll = (transitionStart * scrollSpeed) - 500 // 500px before

        ScrollTrigger.create({
          trigger: containerEl,
          start: `top+=${Math.max(0, proximityTriggerScroll)} top`,
          onEnter: () => {
            if (!isReady()) {
              console.log('[PortalContainer] Proximity fallback - warming cache')
              warmCache(aboutScene, servicesScene)
            }
          },
          once: true, // Only need fallback once
        })

        console.log(`[PortalContainer] Cache proximity trigger at ${proximityTriggerScroll}px`)
      }
    } else {
      console.warn('[PortalContainer] Could not find about/services scenes for cache warmup')
    }
```

**Step 3: Add cache cleanup in onDestroy**

Update the `onDestroy` callback (lines 391-396) to:

```typescript
  onDestroy(() => {
    if (ctx && (ctx as any)._scrollLogger) {
      window.removeEventListener('scroll', (ctx as any)._scrollLogger)
    }
    if (ctx && (ctx as any)._cacheCleanup) {
      ;(ctx as any)._cacheCleanup()
    }
    destroyCache()
    ctx?.revert()
  })
```

**Step 4: Build to verify no errors**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/lib/components/PortalContainer.svelte
git commit -m "feat: integrate transition cache warmup into PortalContainer"
```

---

## Task 6: Manual testing

**Step 1: Start dev server**

Run:
```bash
npm run dev
```

**Step 2: Test cache warmup**

Open browser to http://localhost:3000 and check console for:
- `[TransitionCache] Scheduled idle warmup`
- `[TransitionCache] Warming cache for {width}x{height}...`
- `[TransitionCache] Cache ready for {width}x{height}`

**Step 3: Test transition**

Scroll to About → Services transition and verify:
- Console shows `[CardFlip] Using cached canvases`
- No visible lag before animation starts

**Step 4: Test resize invalidation**

Resize browser window and verify:
- `[TransitionCache] Cache invalidated`
- `[TransitionCache] Warming cache for {new-size}...`
- `[TransitionCache] Cache ready for {new-size}`

**Step 5: Test proximity fallback**

Hard refresh page, then immediately scroll quickly toward transition zone:
- Should see proximity trigger message if idle didn't complete

**Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify transition cache implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Swap html2canvas for modern-screenshot | package.json |
| 2 | Create cache module | src/lib/transitions/cache.ts |
| 3 | Export cache from index | src/lib/transitions/index.ts |
| 4 | Update card-flip to use cache | src/lib/transitions/card-flip.ts |
| 5 | Integrate warmup into PortalContainer | src/lib/components/PortalContainer.svelte |
| 6 | Manual testing | N/A |
