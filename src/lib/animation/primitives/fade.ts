/**
 * Fade Animation Primitives
 *
 * Opacity-based animations for revealing, hiding, and transitioning elements.
 */

import type { Ease } from '../../types'
import { resolveEase, DEFAULT_EASE } from '../easing'

// ============================================================================
// Types
// ============================================================================

/**
 * GSAP tween configuration object.
 * This is the return type for all animation primitives.
 */
export interface GSAPTweenConfig {
  [key: string]: unknown
  duration?: number
  ease?: string
}

/**
 * Configuration for fadeIn animation.
 */
export interface FadeInConfig {
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Starting opacity (default: 0) */
  from?: number
}

/**
 * Configuration for fadeOut animation.
 */
export interface FadeOutConfig {
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeIn') */
  ease?: Ease
  /** Ending opacity (default: 0) */
  to?: number
}

/**
 * Configuration for crossfade animation.
 */
export interface CrossfadeConfig {
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_FADE_DURATION = 0.6
const DEFAULT_CROSSFADE_DURATION = 0.8

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Fade in an element from transparent to fully opaque.
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic fade in
 * gsap.to(element, fadeIn())
 *
 * // Custom duration and easing
 * gsap.to(element, fadeIn({ duration: 1, ease: 'cubic' }))
 *
 * // Fade from partially transparent
 * gsap.to(element, fadeIn({ from: 0.3 }))
 * ```
 */
export function fadeIn(config: FadeInConfig = {}): GSAPTweenConfig {
  const { duration = DEFAULT_FADE_DURATION, ease = DEFAULT_EASE, from = 0 } = config

  return {
    opacity: 1,
    duration,
    ease: resolveEase(ease),
    ...(from !== 0 && { startAt: { opacity: from } }),
  }
}

/**
 * Fade out an element from fully opaque to transparent.
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic fade out
 * gsap.to(element, fadeOut())
 *
 * // Custom duration and easing
 * gsap.to(element, fadeOut({ duration: 0.4, ease: 'easeIn' }))
 *
 * // Fade to partially transparent
 * gsap.to(element, fadeOut({ to: 0.2 }))
 * ```
 */
export function fadeOut(config: FadeOutConfig = {}): GSAPTweenConfig {
  const { duration = DEFAULT_FADE_DURATION, ease = 'easeIn', to = 0 } = config

  return {
    opacity: to,
    duration,
    ease: resolveEase(ease),
  }
}

/**
 * Create a crossfade configuration for transitioning between two elements.
 *
 * This returns configurations for both elements. Use with a timeline
 * to animate them simultaneously.
 *
 * @param config - Optional configuration
 * @returns Object with `fadeOut` and `fadeIn` tween configurations
 *
 * @example
 * ```typescript
 * const { fadeOut: out, fadeIn: _in } = crossfade({ duration: 0.8 })
 *
 * // Apply to timeline
 * tl.to(elementA, out, 0)
 * tl.to(elementB, _in, 0)
 *
 * // Or use the helper function
 * applyCrossfade(tl, elementA, elementB, crossfade())
 * ```
 */
export function crossfade(config: CrossfadeConfig = {}): {
  fadeOut: GSAPTweenConfig
  fadeIn: GSAPTweenConfig
} {
  const { duration = DEFAULT_CROSSFADE_DURATION, ease = 'easeInOut' } = config

  return {
    fadeOut: {
      opacity: 0,
      duration,
      ease: resolveEase(ease),
    },
    fadeIn: {
      opacity: 1,
      duration,
      ease: resolveEase(ease),
    },
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Apply a crossfade animation between two elements on a timeline.
 *
 * @param timeline - GSAP timeline instance
 * @param fromElement - Element to fade out
 * @param toElement - Element to fade in
 * @param config - Crossfade configuration
 * @param position - Timeline position (default: current position)
 *
 * @example
 * ```typescript
 * const tl = gsap.timeline()
 * applyCrossfade(tl, slideA, slideB, { duration: 0.6 })
 * ```
 */
export function applyCrossfade(
  timeline: gsap.core.Timeline,
  fromElement: gsap.TweenTarget,
  toElement: gsap.TweenTarget,
  config: CrossfadeConfig = {},
  position?: gsap.Position,
): gsap.core.Timeline {
  const { fadeOut: out, fadeIn: _in } = crossfade(config)

  const pos = position ?? timeline.time()

  timeline.to(fromElement, out, pos)
  timeline.to(toElement, _in, pos)

  return timeline
}

/**
 * Create a fade pulse animation (fade out then back in).
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration with keyframes
 *
 * @example
 * ```typescript
 * gsap.to(element, fadePulse({ duration: 1, minOpacity: 0.3 }))
 * ```
 */
export function fadePulse(
  config: {
    duration?: number
    ease?: Ease
    minOpacity?: number
  } = {},
): GSAPTweenConfig {
  const { duration = 1, ease = 'easeInOut', minOpacity = 0 } = config

  return {
    keyframes: [
      { opacity: minOpacity, duration: duration / 2, ease: resolveEase(ease) },
      { opacity: 1, duration: duration / 2, ease: resolveEase(ease) },
    ],
  }
}
