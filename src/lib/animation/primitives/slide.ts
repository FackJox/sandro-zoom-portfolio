/**
 * Slide Animation Primitives
 *
 * Position-based animations for sliding elements in/out and panning.
 */

import type { Ease } from '../../types'
import { resolveEase, DEFAULT_EASE } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Direction for slide animations.
 */
export type SlideDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Configuration for slideIn animation.
 */
export interface SlideInConfig {
  /** Direction to slide from (default: 'up') */
  direction?: SlideDirection
  /** Distance to slide in pixels or percentage string (default: 50) */
  distance?: number | string
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Whether to also fade in (default: true) */
  fade?: boolean
}

/**
 * Configuration for slideOut animation.
 */
export interface SlideOutConfig {
  /** Direction to slide to (default: 'up') */
  direction?: SlideDirection
  /** Distance to slide in pixels or percentage string (default: 50) */
  distance?: number | string
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeIn') */
  ease?: Ease
  /** Whether to also fade out (default: true) */
  fade?: boolean
}

/**
 * Configuration for pan animation.
 */
export interface PanConfig {
  /** Horizontal movement in pixels or percentage (default: 0) */
  x?: number | string
  /** Vertical movement in pixels or percentage (default: 0) */
  y?: number | string
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SLIDE_DURATION = 0.6
const DEFAULT_SLIDE_DISTANCE = 50
const DEFAULT_PAN_DURATION = 0.8

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert direction to x/y offset values.
 */
function directionToOffset(
  direction: SlideDirection,
  distance: number | string,
): { x?: number | string; y?: number | string } {
  // Handle percentage strings
  const negateDistance = (d: number | string): number | string => {
    if (typeof d === 'string') {
      if (d.startsWith('-')) return d.slice(1)
      return `-${d}`
    }
    return -d
  }

  switch (direction) {
    case 'up':
      return { y: distance }
    case 'down':
      return { y: negateDistance(distance) }
    case 'left':
      return { x: distance }
    case 'right':
      return { x: negateDistance(distance) }
  }
}

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Slide an element in from a direction.
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Slide up from below
 * gsap.to(element, slideIn())
 *
 * // Slide from the left
 * gsap.to(element, slideIn({ direction: 'left', distance: 100 }))
 *
 * // Slide without fade
 * gsap.to(element, slideIn({ fade: false }))
 *
 * // Slide with percentage distance
 * gsap.to(element, slideIn({ distance: '100%' }))
 * ```
 */
export function slideIn(config: SlideInConfig = {}): GSAPTweenConfig {
  const {
    direction = 'up',
    distance = DEFAULT_SLIDE_DISTANCE,
    duration = DEFAULT_SLIDE_DURATION,
    ease = DEFAULT_EASE,
    fade = true,
  } = config

  const offset = directionToOffset(direction, distance)

  return {
    x: 0,
    y: 0,
    ...(fade && { opacity: 1 }),
    duration,
    ease: resolveEase(ease),
    startAt: {
      ...offset,
      ...(fade && { opacity: 0 }),
    },
  }
}

/**
 * Slide an element out in a direction.
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Slide up and out
 * gsap.to(element, slideOut())
 *
 * // Slide to the right
 * gsap.to(element, slideOut({ direction: 'right', distance: 100 }))
 *
 * // Slide without fade
 * gsap.to(element, slideOut({ fade: false }))
 * ```
 */
export function slideOut(config: SlideOutConfig = {}): GSAPTweenConfig {
  const {
    direction = 'up',
    distance = DEFAULT_SLIDE_DISTANCE,
    duration = DEFAULT_SLIDE_DURATION,
    ease = 'easeIn',
    fade = true,
  } = config

  // Invert the offset for slideOut (opposite of slideIn)
  const offset = directionToOffset(direction, distance)
  const invertedOffset: Record<string, number | string> = {}

  if (offset.x !== undefined) {
    invertedOffset.x = typeof offset.x === 'string' ? (offset.x.startsWith('-') ? offset.x.slice(1) : `-${offset.x}`) : -offset.x
  }
  if (offset.y !== undefined) {
    invertedOffset.y = typeof offset.y === 'string' ? (offset.y.startsWith('-') ? offset.y.slice(1) : `-${offset.y}`) : -offset.y
  }

  return {
    ...invertedOffset,
    ...(fade && { opacity: 0 }),
    duration,
    ease: resolveEase(ease),
  }
}

/**
 * Pan an element to a new position.
 *
 * @param config - Configuration with x and/or y movement
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Pan horizontally
 * gsap.to(element, pan({ x: 100 }))
 *
 * // Pan diagonally
 * gsap.to(element, pan({ x: 50, y: -30 }))
 *
 * // Pan with percentage
 * gsap.to(element, pan({ x: '50%', y: '-25%' }))
 *
 * // Slow pan with custom easing
 * gsap.to(element, pan({ x: 200, duration: 2, ease: 'linear' }))
 * ```
 */
export function pan(config: PanConfig = {}): GSAPTweenConfig {
  const { x = 0, y = 0, duration = DEFAULT_PAN_DURATION, ease = 'easeInOut' } = config

  return {
    x,
    y,
    duration,
    ease: resolveEase(ease),
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Slide in from the bottom.
 *
 * @param config - Optional configuration (without direction)
 * @returns GSAP tween configuration
 */
export function slideUp(config: Omit<SlideInConfig, 'direction'> = {}): GSAPTweenConfig {
  return slideIn({ ...config, direction: 'up' })
}

/**
 * Slide in from the top.
 *
 * @param config - Optional configuration (without direction)
 * @returns GSAP tween configuration
 */
export function slideDown(config: Omit<SlideInConfig, 'direction'> = {}): GSAPTweenConfig {
  return slideIn({ ...config, direction: 'down' })
}

/**
 * Slide in from the right.
 *
 * @param config - Optional configuration (without direction)
 * @returns GSAP tween configuration
 */
export function slideLeft(config: Omit<SlideInConfig, 'direction'> = {}): GSAPTweenConfig {
  return slideIn({ ...config, direction: 'left' })
}

/**
 * Slide in from the left.
 *
 * @param config - Optional configuration (without direction)
 * @returns GSAP tween configuration
 */
export function slideRight(config: Omit<SlideInConfig, 'direction'> = {}): GSAPTweenConfig {
  return slideIn({ ...config, direction: 'right' })
}
