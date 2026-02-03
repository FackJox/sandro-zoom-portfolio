/**
 * Scroll State Context
 *
 * Provides reactive scroll state to content components via Svelte context.
 * Components can opt-in to receive scroll state for scroll-driven animations.
 */

import { getContext, setContext } from 'svelte'
import type { ScrollState } from '../types'

// ============================================================================
// Constants
// ============================================================================

const SCROLL_STATE_KEY = Symbol('scroll-state')

// ============================================================================
// Context Functions
// ============================================================================

/**
 * Create and provide scroll state context.
 * Call this in a parent component to make scroll state available to children.
 *
 * @param getState - Function that returns the current scroll state
 */
export function createScrollStateContext(getState: () => ScrollState): void {
  setContext(SCROLL_STATE_KEY, getState)
}

/**
 * Get scroll state from context.
 * Returns undefined if no context is available.
 */
export function getScrollState(): (() => ScrollState) | undefined {
  return getContext<(() => ScrollState) | undefined>(SCROLL_STATE_KEY)
}

/**
 * Get scroll state from context, throwing if unavailable.
 * Use this when scroll state is required.
 */
export function getScrollStateRequired(): () => ScrollState {
  const state = getScrollState()
  if (!state) {
    throw new Error(
      'ScrollState context not found. Ensure component is within a ContentContainer or scroll context provider.'
    )
  }
  return state
}

// ============================================================================
// Progress Calculation Helpers
// ============================================================================

/**
 * Calculate progress within a content's lifespan.
 *
 * @param sectionProgress - Current section progress (0-1)
 * @param sectionDuration - Total section duration in seconds
 * @param contentAt - When content appears (seconds from section start)
 * @param contentUntil - When content disappears (seconds, optional)
 * @returns Progress within content lifespan (0-1), or -1 if not yet visible, or 2 if past
 */
export function calculateContentProgress(
  sectionProgress: number,
  sectionDuration: number,
  contentAt: number,
  contentUntil?: number
): number {
  // Convert section progress to current time in seconds
  const currentTime = sectionProgress * sectionDuration

  // Not yet visible
  if (currentTime < contentAt) {
    return -1
  }

  // Past visibility window
  if (contentUntil !== undefined && currentTime > contentUntil) {
    return 2
  }

  // Calculate progress within lifespan
  const lifespanDuration = contentUntil !== undefined ? contentUntil - contentAt : sectionDuration - contentAt

  if (lifespanDuration <= 0) {
    return 1
  }

  const timeInLifespan = currentTime - contentAt
  return Math.min(1, Math.max(0, timeInLifespan / lifespanDuration))
}

/**
 * Check if content should be visible based on timing.
 *
 * @param sectionProgress - Current section progress (0-1)
 * @param sectionDuration - Total section duration in seconds
 * @param contentAt - When content appears (seconds from section start)
 * @param contentUntil - When content disappears (seconds, optional)
 * @returns True if content should be visible
 */
export function isContentVisible(
  sectionProgress: number,
  sectionDuration: number,
  contentAt: number,
  contentUntil?: number
): boolean {
  const currentTime = sectionProgress * sectionDuration

  if (currentTime < contentAt) {
    return false
  }

  if (contentUntil !== undefined && currentTime > contentUntil) {
    return false
  }

  return true
}

/**
 * Create a ScrollState object from raw values.
 *
 * @param params - Raw scroll state parameters
 * @returns Complete ScrollState object
 */
export function createScrollState(params: {
  progress: number
  isVisible: boolean
  direction: 'up' | 'down' | null
  velocity: number
  sectionProgress: number
  globalProgress: number
}): ScrollState {
  return {
    progress: params.progress,
    isVisible: params.isVisible,
    direction: params.direction,
    velocity: params.velocity,
    sectionProgress: params.sectionProgress,
    globalProgress: params.globalProgress,
  }
}

/**
 * Create an initial/default scroll state.
 */
export function createInitialScrollState(): ScrollState {
  return {
    progress: 0,
    isVisible: false,
    direction: null,
    velocity: 0,
    sectionProgress: 0,
    globalProgress: 0,
  }
}

/**
 * Derive section progress from global progress and section boundaries.
 *
 * @param globalProgress - Global scroll progress (0-1)
 * @param sectionStart - Section start as fraction of total (0-1)
 * @param sectionEnd - Section end as fraction of total (0-1)
 * @returns Section progress (0-1)
 */
export function deriveSectionProgress(
  globalProgress: number,
  sectionStart: number,
  sectionEnd: number
): number {
  if (globalProgress <= sectionStart) {
    return 0
  }

  if (globalProgress >= sectionEnd) {
    return 1
  }

  const sectionDuration = sectionEnd - sectionStart
  if (sectionDuration <= 0) {
    return 0
  }

  return (globalProgress - sectionStart) / sectionDuration
}

/**
 * Derive scroll direction from previous and current progress.
 *
 * @param previousProgress - Previous scroll progress
 * @param currentProgress - Current scroll progress
 * @returns Scroll direction
 */
export function deriveScrollDirection(
  previousProgress: number,
  currentProgress: number
): 'up' | 'down' | null {
  const delta = currentProgress - previousProgress

  if (Math.abs(delta) < 0.0001) {
    return null
  }

  return delta > 0 ? 'down' : 'up'
}

/**
 * Calculate scroll velocity in normalized units per second.
 *
 * @param progressDelta - Change in progress
 * @param timeDelta - Time elapsed in milliseconds
 * @returns Velocity as progress per second
 */
export function calculateScrollVelocity(progressDelta: number, timeDelta: number): number {
  if (timeDelta <= 0) {
    return 0
  }

  // Convert to per-second rate
  return (progressDelta / timeDelta) * 1000
}
