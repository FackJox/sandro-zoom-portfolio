/**
 * Stagger Animation Primitives
 *
 * Sequenced animations for multiple elements.
 */

import type { Ease } from '../../types'
import { resolveEase, DEFAULT_EASE } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Direction for stagger sequence.
 */
export type StaggerDirection = 'forward' | 'reverse' | 'center' | 'edges' | 'random'

/**
 * Configuration for stagger animation.
 */
export interface StaggerConfig {
  /** Base animation configuration to apply to each element */
  animation: GSAPTweenConfig
  /** Delay between each element in seconds (default: 0.1) */
  delay?: number
  /** Overlap ratio - negative values create overlap (default: 0) */
  overlap?: number
  /** Direction of stagger sequence (default: 'forward') */
  direction?: StaggerDirection
  /** Grid configuration for 2D staggers [columns, rows] */
  grid?: [number, number]
  /** Starting position within stagger (0-1) for 'from' effect */
  from?: number | 'start' | 'end' | 'center' | 'edges' | 'random'
}

/**
 * Configuration for simple stagger effect (GSAP stagger property).
 */
export interface StaggerEffectConfig {
  /** Amount of stagger in seconds (default: 0.1) */
  each?: number
  /** Direction or position to stagger from */
  from?: number | 'start' | 'end' | 'center' | 'edges' | 'random'
  /** Grid for 2D staggers */
  grid?: [number, number] | 'auto'
  /** Easing for distribution (default: 'none') */
  ease?: Ease
  /** Total duration to distribute staggers across */
  amount?: number
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_STAGGER_DELAY = 0.1

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a stagger configuration for GSAP.
 *
 * @param config - Stagger configuration
 * @returns GSAP stagger configuration object
 *
 * @example
 * ```typescript
 * // Simple stagger
 * gsap.to(elements, {
 *   opacity: 1,
 *   stagger: stagger({ each: 0.1, from: 'start' })
 * })
 *
 * // Grid stagger from center
 * gsap.to(gridItems, {
 *   scale: 1,
 *   stagger: stagger({ each: 0.05, from: 'center', grid: [4, 4] })
 * })
 * ```
 */
export function stagger(config: StaggerEffectConfig = {}): gsap.StaggerVars {
  const { each = DEFAULT_STAGGER_DELAY, from = 'start', grid, ease = 'linear', amount } = config

  const staggerConfig: gsap.StaggerVars = {}

  if (amount !== undefined) {
    staggerConfig.amount = amount
  } else {
    staggerConfig.each = each
  }

  staggerConfig.from = from

  if (grid) {
    staggerConfig.grid = grid
  }

  if (ease !== 'linear') {
    staggerConfig.ease = resolveEase(ease)
  }

  return staggerConfig
}

/**
 * Create staggered fade in animation config.
 *
 * @param config - Stagger configuration
 * @returns GSAP tween configuration with stagger
 *
 * @example
 * ```typescript
 * gsap.to(items, staggerFadeIn({ delay: 0.15, direction: 'forward' }))
 * ```
 */
export function staggerFadeIn(config: StaggerConfig): GSAPTweenConfig {
  const { animation, delay = DEFAULT_STAGGER_DELAY, direction = 'forward' } = config

  return {
    ...animation,
    opacity: 1,
    stagger: stagger({
      each: delay,
      from: directionToFrom(direction),
    }),
  }
}

/**
 * Create staggered fade out animation config.
 *
 * @param config - Stagger configuration
 * @returns GSAP tween configuration with stagger
 */
export function staggerFadeOut(config: StaggerConfig): GSAPTweenConfig {
  const { animation, delay = DEFAULT_STAGGER_DELAY, direction = 'forward' } = config

  return {
    ...animation,
    opacity: 0,
    stagger: stagger({
      each: delay,
      from: directionToFrom(direction),
    }),
  }
}

/**
 * Create staggered slide in animation config.
 *
 * @param config - Stagger configuration with slide properties
 * @returns GSAP tween configuration with stagger
 *
 * @example
 * ```typescript
 * gsap.to(cards, staggerSlideIn({
 *   animation: { y: 50, opacity: 0 },
 *   delay: 0.1,
 *   direction: 'forward'
 * }))
 * ```
 */
export function staggerSlideIn(
  config: StaggerConfig & {
    slideDirection?: 'up' | 'down' | 'left' | 'right'
    distance?: number
  },
): GSAPTweenConfig {
  const {
    animation,
    delay = DEFAULT_STAGGER_DELAY,
    direction = 'forward',
    slideDirection = 'up',
    distance = 30,
  } = config

  const offset = getSlideOffset(slideDirection, distance)

  return {
    ...animation,
    x: 0,
    y: 0,
    opacity: 1,
    stagger: stagger({
      each: delay,
      from: directionToFrom(direction),
    }),
    startAt: {
      ...offset,
      opacity: 0,
    },
  }
}

/**
 * Create staggered scale animation config.
 *
 * @param config - Stagger configuration with scale properties
 * @returns GSAP tween configuration with stagger
 *
 * @example
 * ```typescript
 * gsap.to(dots, staggerScale({
 *   animation: { scale: 0 },
 *   delay: 0.05,
 *   direction: 'center',
 *   toScale: 1
 * }))
 * ```
 */
export function staggerScale(
  config: StaggerConfig & {
    fromScale?: number
    toScale?: number
  },
): GSAPTweenConfig {
  const {
    animation,
    delay = DEFAULT_STAGGER_DELAY,
    direction = 'forward',
    fromScale = 0,
    toScale = 1,
  } = config

  return {
    ...animation,
    scale: toScale,
    stagger: stagger({
      each: delay,
      from: directionToFrom(direction),
    }),
    startAt: {
      scale: fromScale,
    },
  }
}

// ============================================================================
// Wave Animation
// ============================================================================

/**
 * Create a wave animation effect.
 *
 * @param config - Wave configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * gsap.to(letters, wave({
 *   property: 'y',
 *   amplitude: 20,
 *   frequency: 0.5,
 *   duration: 2
 * }))
 * ```
 */
export function wave(config: {
  /** Property to animate (default: 'y') */
  property?: 'x' | 'y' | 'scale' | 'rotation'
  /** Wave amplitude in pixels/degrees (default: 20) */
  amplitude?: number
  /** Wave frequency - lower = slower wave (default: 0.3) */
  frequency?: number
  /** Animation duration in seconds (default: 1) */
  duration?: number
  /** Easing function (default: 'linear') */
  ease?: Ease
  /** Whether to repeat infinitely (default: false) */
  repeat?: boolean
}): GSAPTweenConfig {
  const {
    property = 'y',
    amplitude = 20,
    frequency = 0.3,
    duration = 1,
    ease = 'linear',
    repeat = false,
  } = config

  return {
    [property]: amplitude,
    duration,
    ease: resolveEase(ease),
    stagger: {
      each: frequency,
      yoyo: true,
      repeat: repeat ? -1 : 1,
    },
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert StaggerDirection to GSAP from value.
 */
function directionToFrom(
  direction: StaggerDirection,
): 'start' | 'end' | 'center' | 'edges' | 'random' {
  switch (direction) {
    case 'forward':
      return 'start'
    case 'reverse':
      return 'end'
    case 'center':
      return 'center'
    case 'edges':
      return 'edges'
    case 'random':
      return 'random'
  }
}

/**
 * Get slide offset based on direction.
 */
function getSlideOffset(
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number,
): { x?: number; y?: number } {
  switch (direction) {
    case 'up':
      return { y: distance }
    case 'down':
      return { y: -distance }
    case 'left':
      return { x: distance }
    case 'right':
      return { x: -distance }
  }
}

/**
 * Calculate stagger timing for a sequence.
 *
 * @param count - Number of elements
 * @param delay - Delay between elements
 * @param overlap - Overlap ratio (negative creates overlap)
 * @returns Total duration and individual timings
 */
export function calculateStaggerTiming(
  count: number,
  delay: number = DEFAULT_STAGGER_DELAY,
  overlap: number = 0,
): {
  total: number
  timings: number[]
} {
  const effectiveDelay = delay * (1 - overlap)
  const timings: number[] = []

  for (let i = 0; i < count; i++) {
    timings.push(i * effectiveDelay)
  }

  const total = (count - 1) * effectiveDelay

  return { total, timings }
}
