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
