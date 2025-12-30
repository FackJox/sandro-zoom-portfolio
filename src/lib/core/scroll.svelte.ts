/**
 * Scroll System
 *
 * Manages scroll state and optional ScrollSmoother integration.
 * Provides reactive scroll state using Svelte 5 runes.
 *
 * @module core/scroll
 */

import { gsap, ScrollTrigger } from './gsap'

/**
 * Check if we're in a browser environment.
 */
const isBrowser = typeof window !== 'undefined'

// ============================================================================
// Scroll State Types
// ============================================================================

/**
 * Scroll direction type.
 */
export type ScrollDirection = 'up' | 'down' | null

/**
 * Reactive scroll state.
 */
export interface ScrollStateStore {
  /** Scroll progress (0-1) */
  progress: number
  /** Scroll velocity in pixels per second */
  velocity: number
  /** Scroll direction */
  direction: ScrollDirection
  /** Current scroll position in pixels */
  scrollY: number
  /** Total scrollable distance in pixels */
  scrollHeight: number
  /** Whether scrolling is active */
  isScrolling: boolean
}

// ============================================================================
// Scroll State Store (Svelte 5 Runes)
// ============================================================================

/**
 * Creates a reactive scroll state store using Svelte 5 runes.
 * Must be called within a component context.
 *
 * @returns Reactive scroll state object
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createScrollState } from 'svelte-scrollytelling'
 *
 *   const scroll = createScrollState()
 *
 *   $effect(() => {
 *     console.log('Progress:', scroll.progress)
 *   })
 * </script>
 * ```
 */
export function createScrollState(): ScrollStateStore {
  let progress = $state(0)
  let velocity = $state(0)
  let direction = $state<ScrollDirection>(null)
  let scrollY = $state(0)
  let scrollHeight = $state(0)
  let isScrolling = $state(false)

  return {
    get progress() {
      return progress
    },
    set progress(value: number) {
      progress = Math.max(0, Math.min(1, value))
    },
    get velocity() {
      return velocity
    },
    set velocity(value: number) {
      velocity = value
    },
    get direction() {
      return direction
    },
    set direction(value: ScrollDirection) {
      direction = value
    },
    get scrollY() {
      return scrollY
    },
    set scrollY(value: number) {
      scrollY = Math.max(0, value)
    },
    get scrollHeight() {
      return scrollHeight
    },
    set scrollHeight(value: number) {
      scrollHeight = Math.max(0, value)
    },
    get isScrolling() {
      return isScrolling
    },
    set isScrolling(value: boolean) {
      isScrolling = value
    },
  }
}

// ============================================================================
// Scroll Observer
// ============================================================================

/**
 * Configuration for scroll observer.
 */
export interface ScrollObserverConfig {
  /** Scroller element (default: window) */
  scroller?: Element | Window
  /** Total scroll distance in pixels */
  scrollDistance: number
  /** Callback when scroll updates */
  onUpdate?: (state: ScrollStateStore) => void
  /** Debounce time for isScrolling flag (ms) */
  scrollingDebounce?: number
}

/**
 * Scroll observer instance.
 */
export interface ScrollObserver {
  /** Current scroll state */
  state: ScrollStateStore
  /** Start observing scroll */
  start: () => void
  /** Stop observing scroll */
  stop: () => void
  /** Destroy and cleanup */
  destroy: () => void
}

/**
 * Creates a scroll observer that tracks scroll state.
 *
 * @param config - Observer configuration
 * @returns Scroll observer instance
 *
 * @example
 * ```ts
 * const observer = createScrollObserver({
 *   scrollDistance: 5850,
 *   onUpdate: (state) => {
 *     console.log(`Progress: ${state.progress}, Direction: ${state.direction}`)
 *   }
 * })
 *
 * observer.start()
 *
 * // Later...
 * observer.destroy()
 * ```
 */
export function createScrollObserver(config: ScrollObserverConfig): ScrollObserver {
  const { scroller = isBrowser ? window : undefined, scrollDistance, onUpdate, scrollingDebounce = 150 } = config

  const state = createScrollState()
  state.scrollHeight = scrollDistance

  let lastScrollY = 0
  let lastTime = 0
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null
  let rafId: number | null = null
  let isRunning = false

  /**
   * Handle scroll updates.
   */
  function handleScroll(): void {
    if (!isBrowser || !isRunning) return

    const now = performance.now()
    const deltaTime = now - lastTime

    // Get current scroll position
    let currentScrollY: number
    if (scroller === window) {
      currentScrollY = window.scrollY
    } else if (scroller instanceof Element) {
      currentScrollY = scroller.scrollTop
    } else {
      return
    }

    // Calculate velocity (px/s)
    if (deltaTime > 0) {
      const deltaScroll = currentScrollY - lastScrollY
      state.velocity = (deltaScroll / deltaTime) * 1000
      state.direction = deltaScroll > 0 ? 'down' : deltaScroll < 0 ? 'up' : state.direction
    }

    // Update progress
    state.scrollY = currentScrollY
    state.progress = scrollDistance > 0 ? currentScrollY / scrollDistance : 0

    // Set scrolling flag
    state.isScrolling = true
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    scrollTimeout = setTimeout(() => {
      state.isScrolling = false
      state.velocity = 0
    }, scrollingDebounce)

    // Store for next frame
    lastScrollY = currentScrollY
    lastTime = now

    // Notify callback
    onUpdate?.(state)
  }

  /**
   * RAF loop for smooth velocity tracking.
   */
  function tick(): void {
    if (!isRunning) return
    handleScroll()
    rafId = requestAnimationFrame(tick)
  }

  return {
    state,

    start() {
      if (!isBrowser || isRunning) return
      isRunning = true
      lastTime = performance.now()

      // Initial scroll position
      if (scroller === window) {
        lastScrollY = window.scrollY
      } else if (scroller instanceof Element) {
        lastScrollY = scroller.scrollTop
      }

      rafId = requestAnimationFrame(tick)
    },

    stop() {
      isRunning = false
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },

    destroy() {
      this.stop()
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
        scrollTimeout = null
      }
    },
  }
}

// ============================================================================
// ScrollSmoother Integration (Stub)
// ============================================================================

/**
 * ScrollSmoother configuration options.
 *
 * Note: ScrollSmoother requires GSAP Club membership.
 * This is a stub that can be enabled when the license is available.
 */
export interface ScrollSmootherOptions {
  /** Wrapper element selector */
  wrapper?: string
  /** Content element selector */
  content?: string
  /** Smooth scrolling amount (default: 1) */
  smooth?: number
  /** Enable smooth touch scrolling */
  smoothTouch?: number | boolean
  /** Normalize scroll behavior */
  normalizeScroll?: boolean
  /** Ignore elements from smooth scrolling */
  ignoreMobileResize?: boolean
  /** Effect multiplier for parallax */
  effects?: boolean | string
  /** Callback when ScrollSmoother is ready */
  onReady?: (smoother: ScrollSmootherInstance) => void
}

/**
 * ScrollSmoother instance interface.
 *
 * This is a stub interface - actual ScrollSmoother methods
 * will be available when the GSAP Club plugin is enabled.
 */
export interface ScrollSmootherInstance {
  /** Kill and cleanup ScrollSmoother */
  kill: () => void
  /** Pause smooth scrolling */
  paused: (value?: boolean) => boolean
  /** Get/set scroll position */
  scrollTo: (target: string | Element | number, smooth?: boolean, position?: string) => void
  /** Get current scroll position */
  scrollTop: () => number
  /** Refresh ScrollSmoother */
  refresh: () => void
  /** Get wrapper element */
  wrapper: () => Element
  /** Get content element */
  content: () => Element
}

/**
 * Creates a ScrollSmoother instance.
 *
 * Note: This is currently a stub. ScrollSmoother is a GSAP Club
 * premium plugin. The implementation will use native scroll
 * until the plugin is available.
 *
 * @param options - ScrollSmoother options
 * @returns ScrollSmoother instance or null if unavailable
 *
 * @example
 * ```ts
 * const smoother = createScrollSmoother({
 *   wrapper: '#smooth-wrapper',
 *   content: '#smooth-content',
 *   smooth: 1.5,
 *   effects: true
 * })
 *
 * // Scroll to section
 * smoother?.scrollTo('#section-2', true)
 *
 * // Cleanup
 * smoother?.kill()
 * ```
 */
export function createScrollSmoother(options: ScrollSmootherOptions = {}): ScrollSmootherInstance | null {
  if (!isBrowser) return null

  // Check if ScrollSmoother is available
  // @ts-expect-error - ScrollSmoother may not be registered
  const ScrollSmoother = gsap.plugins?.ScrollSmoother

  if (!ScrollSmoother) {
    // ScrollSmoother not available - return stub with native scroll fallback
    const wrapper = options.wrapper ? document.querySelector(options.wrapper) : document.body
    const content = options.content ? document.querySelector(options.content) : document.body

    const stubInstance: ScrollSmootherInstance = {
      kill() {
        // No-op for native scroll
      },
      paused(value?: boolean): boolean {
        // Can't actually pause native scroll
        return false
      },
      scrollTo(target: string | Element | number, smooth = false): void {
        let targetY: number

        if (typeof target === 'number') {
          targetY = target
        } else {
          const element = typeof target === 'string' ? document.querySelector(target) : target
          if (!element) return
          targetY = element.getBoundingClientRect().top + window.scrollY
        }

        window.scrollTo({
          top: targetY,
          behavior: smooth ? 'smooth' : 'instant',
        })
      },
      scrollTop(): number {
        return window.scrollY
      },
      refresh(): void {
        ScrollTrigger.refresh()
      },
      wrapper(): Element {
        return wrapper ?? document.body
      },
      content(): Element {
        return content ?? document.body
      },
    }

    options.onReady?.(stubInstance)
    return stubInstance
  }

  // ScrollSmoother is available - create real instance
  // Uncomment when GSAP Club license is available:
  /*
  const smoother = ScrollSmoother.create({
    wrapper: options.wrapper,
    content: options.content,
    smooth: options.smooth ?? 1,
    smoothTouch: options.smoothTouch,
    normalizeScroll: options.normalizeScroll,
    ignoreMobileResize: options.ignoreMobileResize,
    effects: options.effects,
  })

  const instance: ScrollSmootherInstance = {
    kill: () => smoother.kill(),
    paused: (value?: boolean) => smoother.paused(value),
    scrollTo: (target, smooth, position) => smoother.scrollTo(target, smooth, position),
    scrollTop: () => smoother.scrollTop(),
    refresh: () => smoother.refresh(),
    wrapper: () => smoother.wrapper(),
    content: () => smoother.content(),
  }

  options.onReady?.(instance)
  return instance
  */

  // Fallback to stub for now
  return createScrollSmoother({ ...options, onReady: undefined })
}

// ============================================================================
// Section Boundary Calculations
// ============================================================================

/**
 * Section boundary information.
 */
export interface SectionBoundary {
  /** Section ID */
  id: string
  /** Start scroll position (0-1) */
  start: number
  /** End scroll position (0-1) */
  end: number
  /** Duration as fraction of total */
  duration: number
}

/**
 * Calculate section boundaries from durations.
 *
 * @param sections - Array of section IDs and durations
 * @param totalDuration - Total experience duration in seconds
 * @returns Array of section boundaries
 *
 * @example
 * ```ts
 * const boundaries = calculateSectionBoundaries([
 *   { id: 'hero', duration: 15 },
 *   { id: 'features', duration: 25 },
 *   { id: 'outro', duration: 10 }
 * ], 50)
 *
 * // boundaries[0] = { id: 'hero', start: 0, end: 0.3, duration: 0.3 }
 * // boundaries[1] = { id: 'features', start: 0.3, end: 0.8, duration: 0.5 }
 * // boundaries[2] = { id: 'outro', start: 0.8, end: 1, duration: 0.2 }
 * ```
 */
export function calculateSectionScrollBoundaries(
  sections: Array<{ id: string; duration: number }>,
  totalDuration: number
): SectionBoundary[] {
  if (totalDuration <= 0) return []

  const boundaries: SectionBoundary[] = []
  let currentStart = 0

  for (const section of sections) {
    const durationFraction = section.duration / totalDuration
    boundaries.push({
      id: section.id,
      start: currentStart,
      end: currentStart + durationFraction,
      duration: durationFraction,
    })
    currentStart += durationFraction
  }

  // Ensure last section ends at exactly 1
  if (boundaries.length > 0) {
    boundaries[boundaries.length - 1].end = 1
  }

  return boundaries
}

/**
 * Get current section from scroll progress.
 *
 * @param progress - Current scroll progress (0-1)
 * @param boundaries - Section boundaries
 * @returns Current section info or null
 */
export function getCurrentSection(
  progress: number,
  boundaries: SectionBoundary[]
): (SectionBoundary & { progress: number }) | null {
  for (const boundary of boundaries) {
    if (progress >= boundary.start && progress < boundary.end) {
      const sectionProgress = (progress - boundary.start) / boundary.duration
      return { ...boundary, progress: sectionProgress }
    }
  }

  // Check if at the very end
  if (boundaries.length > 0 && progress >= 1) {
    const last = boundaries[boundaries.length - 1]
    return { ...last, progress: 1 }
  }

  return null
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Kill all ScrollTriggers.
 * Useful for cleanup on route changes or unmount.
 */
export function killAllScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
}

/**
 * Refresh all ScrollTriggers.
 * Call after DOM changes that affect scroll distances.
 */
export function refreshScrollTriggers(): void {
  ScrollTrigger.refresh()
}
