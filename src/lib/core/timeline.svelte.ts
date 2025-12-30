/**
 * Timeline System
 *
 * Creates and manages the master timeline for scroll-driven animations.
 * The timeline is measured in seconds and scrubbed via scroll position.
 *
 * @module core/timeline
 */

import { gsap, ScrollTrigger } from './gsap'
import type { ScrollytellingConfig } from '../types'

/**
 * Check if we're in a browser environment.
 */
const isBrowser = typeof window !== 'undefined'

// ============================================================================
// Timeline State (Svelte 5 Runes)
// ============================================================================

/**
 * Current timeline state.
 */
interface TimelineState {
  /** Timeline progress (0-1) */
  progress: number
  /** Current time in seconds */
  currentTime: number
  /** Total duration in seconds */
  totalDuration: number
  /** Whether timeline is paused */
  isPaused: boolean
  /** Whether timeline is ready */
  isReady: boolean
}

/**
 * Creates a reactive timeline state store using Svelte 5 runes.
 * Must be called within a component context.
 */
export function createTimelineState(totalDuration: number): TimelineState {
  let progress = $state(0)
  let currentTime = $state(0)
  let isPaused = $state(false)
  let isReady = $state(false)

  return {
    get progress() {
      return progress
    },
    set progress(value: number) {
      progress = Math.max(0, Math.min(1, value))
      currentTime = progress * totalDuration
    },
    get currentTime() {
      return currentTime
    },
    set currentTime(value: number) {
      currentTime = Math.max(0, Math.min(totalDuration, value))
      progress = currentTime / totalDuration
    },
    get totalDuration() {
      return totalDuration
    },
    get isPaused() {
      return isPaused
    },
    set isPaused(value: boolean) {
      isPaused = value
    },
    get isReady() {
      return isReady
    },
    set isReady(value: boolean) {
      isReady = value
    },
  }
}

// ============================================================================
// Time/Scroll Conversion
// ============================================================================

/**
 * Convert seconds to scroll position (0-1).
 *
 * @param seconds - Time in seconds
 * @param totalDuration - Total experience duration in seconds
 * @returns Scroll position as fraction (0-1)
 *
 * @example
 * ```ts
 * // At 45 seconds in a 90 second experience
 * const position = timeToScroll(45, 90) // 0.5
 * ```
 */
export function timeToScroll(seconds: number, totalDuration: number): number {
  if (totalDuration <= 0) return 0
  return Math.max(0, Math.min(1, seconds / totalDuration))
}

/**
 * Convert scroll position (0-1) to seconds.
 *
 * @param position - Scroll position as fraction (0-1)
 * @param totalDuration - Total experience duration in seconds
 * @returns Time in seconds
 *
 * @example
 * ```ts
 * // At 50% scroll in a 90 second experience
 * const time = scrollToTime(0.5, 90) // 45
 * ```
 */
export function scrollToTime(position: number, totalDuration: number): number {
  return Math.max(0, Math.min(totalDuration, position * totalDuration))
}

/**
 * Calculate scroll distance in pixels from duration and speed.
 *
 * @param totalDuration - Total duration in seconds
 * @param scrollSpeed - Scroll speed in pixels per second
 * @returns Total scroll distance in pixels
 *
 * @example
 * ```ts
 * // 90 seconds at 65 px/s = 5850px scroll distance
 * const distance = calculateScrollDistance(90, 65) // 5850
 * ```
 */
export function calculateScrollDistance(totalDuration: number, scrollSpeed: number): number {
  return totalDuration * scrollSpeed
}

// ============================================================================
// Master Timeline
// ============================================================================

/**
 * Configuration for creating a master timeline.
 */
export interface MasterTimelineConfig {
  /** Total duration in seconds */
  totalDuration: number
  /** Scroll speed in px/s (default: 65) */
  scrollSpeed?: number
  /** Trigger element or selector (default: body) */
  trigger?: string | Element
  /** Scroller element (default: window) */
  scroller?: string | Element | Window
  /** Start position (default: 'top top') */
  start?: string
  /** End position (calculated from duration if not provided) */
  end?: string
  /** Enable scrubbing (default: true) */
  scrub?: boolean | number
  /** Pin during scroll (default: false) */
  pin?: boolean
  /** Callback when progress updates */
  onUpdate?: (progress: number, time: number) => void
  /** Callback when timeline is ready */
  onReady?: () => void
}

/**
 * Master timeline instance with control methods.
 */
export interface MasterTimeline {
  /** The GSAP timeline instance */
  timeline: gsap.core.Timeline
  /** The ScrollTrigger instance */
  scrollTrigger: ScrollTrigger | null
  /** Current progress (0-1) */
  progress: number
  /** Current time in seconds */
  currentTime: number
  /** Total duration in seconds */
  totalDuration: number
  /** Scroll distance in pixels */
  scrollDistance: number
  /** Pause the timeline */
  pause: () => void
  /** Resume the timeline */
  resume: () => void
  /** Seek to a specific time */
  seekTo: (time: number) => void
  /** Seek to a specific progress */
  seekToProgress: (progress: number) => void
  /** Add a child timeline at a position */
  add: (child: gsap.core.Timeline | gsap.core.Tween, position?: number | string) => void
  /** Add a label at a position */
  addLabel: (label: string, position?: number | string) => void
  /** Kill the timeline and cleanup */
  destroy: () => void
}

/**
 * Creates a master timeline that is scrubbed by scroll position.
 *
 * The timeline represents the entire scrollytelling experience and child
 * timelines (sections) are added to it at calculated positions.
 *
 * @param config - Timeline configuration
 * @returns Master timeline instance with control methods
 *
 * @example
 * ```ts
 * const master = createMasterTimeline({
 *   totalDuration: 90,
 *   scrollSpeed: 65,
 *   onUpdate: (progress, time) => {
 *     console.log(`Progress: ${progress}, Time: ${time}s`)
 *   }
 * })
 *
 * // Add section timelines
 * master.add(heroTimeline, 0)
 * master.add(featuresTimeline, 12) // starts at 12 seconds
 *
 * // Cleanup when done
 * master.destroy()
 * ```
 */
export function createMasterTimeline(config: MasterTimelineConfig): MasterTimeline {
  const {
    totalDuration,
    scrollSpeed = 65,
    trigger = 'body',
    scroller,
    start = 'top top',
    scrub = true,
    pin = false,
    onUpdate,
    onReady,
  } = config

  const scrollDistance = calculateScrollDistance(totalDuration, scrollSpeed)
  const end = config.end ?? `+=${scrollDistance}`

  // Create the main timeline (paused, controlled by ScrollTrigger)
  const timeline = gsap.timeline({
    paused: true,
  })

  // Set timeline duration explicitly
  // We use a dummy tween to set the timeline's total duration
  timeline.to({}, { duration: totalDuration })

  let scrollTrigger: ScrollTrigger | null = null
  let currentProgress = 0
  let currentTime = 0

  // Only create ScrollTrigger in browser
  if (isBrowser) {
    const scrollTriggerConfig: ScrollTrigger.Vars = {
      trigger,
      start,
      end,
      scrub,
      pin,
      onUpdate: (self) => {
        currentProgress = self.progress
        currentTime = scrollToTime(currentProgress, totalDuration)
        timeline.progress(currentProgress)
        onUpdate?.(currentProgress, currentTime)
      },
      onRefresh: () => {
        onReady?.()
      },
    }

    // Only add scroller if explicitly provided (not for default window scrolling)
    if (scroller) {
      scrollTriggerConfig.scroller = scroller
    }

    scrollTrigger = ScrollTrigger.create(scrollTriggerConfig)
  }

  return {
    timeline,
    scrollTrigger,

    get progress() {
      return currentProgress
    },

    get currentTime() {
      return currentTime
    },

    get totalDuration() {
      return totalDuration
    },

    get scrollDistance() {
      return scrollDistance
    },

    pause() {
      scrollTrigger?.disable()
    },

    resume() {
      scrollTrigger?.enable()
    },

    seekTo(time: number) {
      const progress = timeToScroll(time, totalDuration)
      this.seekToProgress(progress)
    },

    seekToProgress(progress: number) {
      if (!isBrowser) return

      const clampedProgress = Math.max(0, Math.min(1, progress))
      const scrollPosition = clampedProgress * scrollDistance

      // Update timeline directly
      timeline.progress(clampedProgress)
      currentProgress = clampedProgress
      currentTime = scrollToTime(clampedProgress, totalDuration)

      // Scroll to the position
      if (scrollTrigger) {
        const scrollerEl = scrollTrigger.scroller as Element | Window
        if (scrollerEl === window) {
          window.scrollTo({ top: scrollPosition, behavior: 'instant' })
        } else if (scrollerEl instanceof Element) {
          scrollerEl.scrollTop = scrollPosition
        }
      }

      onUpdate?.(currentProgress, currentTime)
    },

    add(child: gsap.core.Timeline | gsap.core.Tween, position?: number | string) {
      // Convert seconds to timeline position
      const pos = typeof position === 'number' ? timeToScroll(position, totalDuration) * totalDuration : position
      timeline.add(child, pos)
    },

    addLabel(label: string, position?: number | string) {
      const pos = typeof position === 'number' ? timeToScroll(position, totalDuration) * totalDuration : position
      timeline.addLabel(label, pos)
    },

    destroy() {
      scrollTrigger?.kill()
      timeline.kill()
    },
  }
}

// ============================================================================
// Section Timeline Helpers
// ============================================================================

/**
 * Calculate section boundaries from animation configs.
 *
 * @param sections - Array of section configs with animations
 * @returns Array of section boundaries with start/end times
 */
export function calculateSectionBoundaries(
  sections: Array<{
    id: string
    animations: Array<{ at: number | string; duration?: number }>
  }>
): Array<{ id: string; start: number; end: number; duration: number }> {
  const boundaries: Array<{ id: string; start: number; end: number; duration: number }> = []
  let currentStart = 0

  for (const section of sections) {
    // Find the maximum end time from all animations
    let maxEnd = 0

    for (const anim of section.animations) {
      // Handle numeric 'at' values (skip relative strings for now)
      if (typeof anim.at === 'number') {
        const animEnd = anim.at + (anim.duration ?? 0)
        maxEnd = Math.max(maxEnd, animEnd)
      }
    }

    const duration = maxEnd || 1 // Default to 1 second if no animations
    boundaries.push({
      id: section.id,
      start: currentStart,
      end: currentStart + duration,
      duration,
    })

    currentStart += duration
  }

  return boundaries
}

/**
 * Get section at a given time.
 *
 * @param time - Time in seconds
 * @param boundaries - Section boundaries
 * @returns Section info or null if not found
 */
export function getSectionAtTime(
  time: number,
  boundaries: Array<{ id: string; start: number; end: number; duration: number }>
): { id: string; start: number; end: number; duration: number; progress: number } | null {
  for (const section of boundaries) {
    if (time >= section.start && time < section.end) {
      const progress = (time - section.start) / section.duration
      return { ...section, progress }
    }
  }

  // Check if at the very end
  if (boundaries.length > 0) {
    const last = boundaries[boundaries.length - 1]
    if (time >= last.end) {
      return { ...last, progress: 1 }
    }
  }

  return null
}
