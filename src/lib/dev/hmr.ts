/**
 * HMR (Hot Module Replacement) Utilities
 *
 * Preserves scroll position and state during development hot reloads.
 *
 * @module dev/hmr
 */

import type { HMRConfig } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface HMRState {
  /** Scroll position as fraction (0-1) */
  scrollProgress: number
  /** Scroll position in pixels */
  scrollY: number
  /** Current section ID */
  currentSection: string | null
  /** Timestamp of state capture */
  timestamp: number
}

export interface HMROptions {
  /** Key for localStorage storage */
  storageKey?: string
  /** Maximum age of stored state in ms (default: 60000) */
  maxAge?: number
  /** Debounce time for saving state in ms (default: 100) */
  debounceMs?: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STORAGE_KEY = 'svelte-scrollytelling-hmr'
const DEFAULT_MAX_AGE = 60000 // 1 minute
const DEFAULT_DEBOUNCE_MS = 100

// ============================================================================
// Browser Check
// ============================================================================

const isBrowser = typeof window !== 'undefined'

// ============================================================================
// State Management
// ============================================================================

/**
 * Save HMR state to localStorage.
 *
 * @param state - State to save
 * @param options - Storage options
 */
export function saveHMRState(state: HMRState, options: HMROptions = {}): void {
  if (!isBrowser) return

  const { storageKey = DEFAULT_STORAGE_KEY } = options

  try {
    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch (e) {
    console.warn('[HMR] Failed to save state:', e)
  }
}

/**
 * Load HMR state from localStorage.
 *
 * @param options - Storage options
 * @returns Saved state or null if expired/missing
 */
export function loadHMRState(options: HMROptions = {}): HMRState | null {
  if (!isBrowser) return null

  const { storageKey = DEFAULT_STORAGE_KEY, maxAge = DEFAULT_MAX_AGE } = options

  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return null

    const state: HMRState = JSON.parse(stored)

    // Check if state is expired
    if (Date.now() - state.timestamp > maxAge) {
      clearHMRState(options)
      return null
    }

    return state
  } catch (e) {
    console.warn('[HMR] Failed to load state:', e)
    return null
  }
}

/**
 * Clear HMR state from localStorage.
 *
 * @param options - Storage options
 */
export function clearHMRState(options: HMROptions = {}): void {
  if (!isBrowser) return

  const { storageKey = DEFAULT_STORAGE_KEY } = options

  try {
    localStorage.removeItem(storageKey)
  } catch (e) {
    console.warn('[HMR] Failed to clear state:', e)
  }
}

// ============================================================================
// HMR Handlers
// ============================================================================

/**
 * Create HMR-preserving scroll handler.
 *
 * @param config - HMR configuration
 * @param options - Storage options
 * @returns Object with save and restore methods
 *
 * @example
 * ```ts
 * const hmr = createHMRHandler({
 *   preserveScroll: true,
 *   preserveSection: true,
 *   animationReset: 'soft'
 * })
 *
 * // On HMR update
 * hmr.save({
 *   scrollProgress: 0.5,
 *   scrollY: 2000,
 *   currentSection: 'hero'
 * })
 *
 * // After reload
 * const state = hmr.restore()
 * if (state) {
 *   window.scrollTo(0, state.scrollY)
 * }
 * ```
 */
export function createHMRHandler(config: HMRConfig, options: HMROptions = {}) {
  const { debounceMs = DEFAULT_DEBOUNCE_MS } = options

  let saveTimeout: ReturnType<typeof setTimeout> | null = null
  let lastState: Partial<HMRState> = {}

  return {
    /**
     * Save current state (debounced).
     */
    save(state: Partial<HMRState>): void {
      if (!config.preserveScroll && !config.preserveSection) return

      // Merge with last state
      lastState = { ...lastState, ...state }

      // Debounce saves
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }

      saveTimeout = setTimeout(() => {
        const fullState: HMRState = {
          scrollProgress: lastState.scrollProgress ?? 0,
          scrollY: lastState.scrollY ?? 0,
          currentSection: lastState.currentSection ?? null,
          timestamp: Date.now(),
        }

        saveHMRState(fullState, options)
      }, debounceMs)
    },

    /**
     * Restore saved state.
     */
    restore(): HMRState | null {
      if (!config.preserveScroll && !config.preserveSection) return null

      return loadHMRState(options)
    },

    /**
     * Apply restored state to scroll position.
     */
    apply(state: HMRState | null): void {
      if (!state || !isBrowser) return

      if (config.preserveScroll) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({
            top: state.scrollY,
            behavior: 'instant',
          })
        })
      }
    },

    /**
     * Get animation reset mode.
     */
    getAnimationReset(): 'soft' | 'hard' | 'none' {
      return config.animationReset
    },

    /**
     * Clear saved state.
     */
    clear(): void {
      clearHMRState(options)
      lastState = {}
    },
  }
}

// ============================================================================
// Vite HMR Integration
// ============================================================================

/**
 * Setup Vite HMR integration.
 *
 * @param config - HMR configuration
 * @param callbacks - Callbacks for HMR events
 *
 * @example
 * ```ts
 * // In your main component
 * setupViteHMR(config.hmr, {
 *   onBeforeUpdate: (state) => {
 *     // Save current state before update
 *   },
 *   onAfterUpdate: (state) => {
 *     // Restore state after update
 *   }
 * })
 * ```
 */
export function setupViteHMR(
  config: HMRConfig,
  callbacks: {
    onBeforeUpdate?: (state: HMRState | null) => void
    onAfterUpdate?: (state: HMRState | null) => void
  } = {}
): void {
  if (!isBrowser) return

  // Check if Vite HMR is available
  const hot = import.meta?.hot

  if (!hot) return

  const handler = createHMRHandler(config)

  // Listen for HMR events
  hot.on('vite:beforeUpdate', () => {
    // Save state before update
    const state = handler.restore()
    callbacks.onBeforeUpdate?.(state)
  })

  hot.on('vite:afterUpdate', () => {
    // Restore state after update
    const state = handler.restore()
    handler.apply(state)
    callbacks.onAfterUpdate?.(state)
  })
}

// ============================================================================
// Scroll Position Observer
// ============================================================================

/**
 * Create an observer that automatically saves scroll state for HMR.
 *
 * @param config - HMR configuration
 * @param options - Observer options
 * @returns Cleanup function
 *
 * @example
 * ```ts
 * const cleanup = observeScrollForHMR(config.hmr, {
 *   getProgress: () => scrollState.progress,
 *   getCurrentSection: () => currentSection?.id
 * })
 *
 * // Cleanup on unmount
 * onDestroy(cleanup)
 * ```
 */
export function observeScrollForHMR(
  config: HMRConfig,
  options: {
    getProgress?: () => number
    getCurrentSection?: () => string | null
  } = {}
): () => void {
  if (!isBrowser || (!config.preserveScroll && !config.preserveSection)) {
    return () => {}
  }

  const handler = createHMRHandler(config)

  let ticking = false

  function update() {
    handler.save({
      scrollProgress: options.getProgress?.() ?? 0,
      scrollY: window.scrollY,
      currentSection: options.getCurrentSection?.() ?? null,
    })
    ticking = false
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update)
      ticking = true
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })

  return () => {
    window.removeEventListener('scroll', onScroll)
  }
}
