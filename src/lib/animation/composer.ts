/**
 * Animation Composer
 *
 * Utility for combining multiple animation primitives into a single configuration.
 */

import type { Ease } from '../types'
import { resolveEase } from './easing'
import type { GSAPTweenConfig } from './primitives/fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Combined animation configuration.
 */
export interface CombinedConfig {
  /** Array of animation configurations to combine */
  animations: GSAPTweenConfig[]
  /** Override duration for all animations */
  duration?: number
  /** Override ease for all animations */
  ease?: Ease
  /** How to merge conflicting properties (default: 'last') */
  mergeStrategy?: 'first' | 'last' | 'average'
}

/**
 * Sequence step configuration.
 */
export interface SequenceStep {
  /** Animation configuration */
  animation: GSAPTweenConfig
  /** Position in sequence (default: sequential) */
  position?: number | string
  /** Label for this step */
  label?: string
}

// ============================================================================
// Composer Functions
// ============================================================================

/**
 * Combine multiple animation primitives into a single configuration.
 *
 * Properties from later animations override earlier ones.
 *
 * @param config - Combined animation configuration
 * @returns Merged GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Combine fade and slide
 * const combo = combined({
 *   animations: [
 *     fadeIn({ duration: 0.6 }),
 *     slideIn({ direction: 'up', distance: 30 })
 *   ]
 * })
 *
 * gsap.to(element, combo)
 *
 * // With custom duration override
 * const quickCombo = combined({
 *   animations: [fadeIn(), slideIn()],
 *   duration: 0.3
 * })
 * ```
 */
export function combined(config: CombinedConfig): GSAPTweenConfig {
  const { animations, duration, ease, mergeStrategy = 'last' } = config

  if (animations.length === 0) {
    return {}
  }

  // Merge all animations
  const merged: GSAPTweenConfig = {}
  const startAtMerged: Record<string, unknown> = {}

  for (const anim of animations) {
    const { startAt, ...rest } = anim as GSAPTweenConfig & { startAt?: Record<string, unknown> }

    // Merge main properties
    for (const [key, value] of Object.entries(rest)) {
      if (key === 'keyframes') {
        // Keyframes can't be merged, use the latest
        merged.keyframes = value
      } else if (typeof value === 'number' && typeof merged[key] === 'number') {
        // Handle numeric values based on merge strategy
        switch (mergeStrategy) {
          case 'first':
            // Keep first value
            break
          case 'average':
            merged[key] = ((merged[key] as number) + value) / 2
            break
          case 'last':
          default:
            merged[key] = value
        }
      } else {
        merged[key] = value
      }
    }

    // Merge startAt properties
    if (startAt) {
      Object.assign(startAtMerged, startAt)
    }
  }

  // Apply overrides
  if (duration !== undefined) {
    merged.duration = duration
  }

  if (ease !== undefined) {
    merged.ease = resolveEase(ease)
  }

  // Add merged startAt if not empty
  if (Object.keys(startAtMerged).length > 0) {
    merged.startAt = startAtMerged
  }

  return merged
}

/**
 * Create a sequence of animations.
 *
 * @param steps - Array of sequence steps
 * @returns Function that applies sequence to a timeline
 *
 * @example
 * ```typescript
 * const enterSequence = sequence([
 *   { animation: fadeIn({ duration: 0.3 }), label: 'fade' },
 *   { animation: slideIn({ distance: 20 }), position: '<' }, // Same time as previous
 *   { animation: scaleIn({ from: 0.9 }), position: '+=0.1' }, // 0.1s after previous
 * ])
 *
 * // Apply to timeline
 * enterSequence(tl, element, 0)
 * ```
 */
export function sequence(
  steps: SequenceStep[],
): (timeline: gsap.core.Timeline, target: gsap.TweenTarget, startPosition?: gsap.Position) => void {
  return (timeline, target, startPosition = 0) => {
    let currentPosition: gsap.Position = startPosition

    for (const step of steps) {
      const { animation, position, label } = step

      // Determine position
      const pos = position !== undefined ? position : currentPosition

      // Add label if specified
      if (label) {
        timeline.addLabel(label, pos)
      }

      // Add animation
      timeline.to(target, animation, pos)

      // Update current position for sequential animations
      if (position === undefined && typeof currentPosition === 'number') {
        currentPosition = currentPosition + (animation.duration as number ?? 0.5)
      }
    }
  }
}

/**
 * Create a parallel animation (multiple targets at same time).
 *
 * @param config - Configuration with targets and animation
 * @returns Function that applies parallel animation to a timeline
 *
 * @example
 * ```typescript
 * const fadeAllIn = parallel({
 *   animation: fadeIn({ duration: 0.5 })
 * })
 *
 * // Apply to multiple targets
 * fadeAllIn(tl, [el1, el2, el3], 0)
 * ```
 */
export function parallel(config: {
  animation: GSAPTweenConfig
  stagger?: number
}): (timeline: gsap.core.Timeline, targets: gsap.TweenTarget[], position?: gsap.Position) => void {
  const { animation, stagger } = config

  return (timeline, targets, position = 0) => {
    const animConfig = stagger
      ? { ...animation, stagger }
      : animation

    timeline.to(targets, animConfig, position)
  }
}

// ============================================================================
// Transform Utilities
// ============================================================================

/**
 * Create a transform animation with multiple properties.
 *
 * @param config - Transform configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * gsap.to(element, transform({
 *   x: 100,
 *   y: 50,
 *   scale: 1.2,
 *   rotation: 45,
 *   duration: 0.8
 * }))
 * ```
 */
export function transform(
  config: {
    x?: number | string
    y?: number | string
    scale?: number
    scaleX?: number
    scaleY?: number
    rotation?: number
    skewX?: number
    skewY?: number
    duration?: number
    ease?: Ease
  },
): GSAPTweenConfig {
  const { duration = 0.6, ease = 'easeInOut', ...transforms } = config

  return {
    ...transforms,
    duration,
    ease: resolveEase(ease),
  }
}

/**
 * Create a transform from origin animation.
 *
 * @param origin - Transform origin (e.g., '50% 50%', 'center center')
 * @param animation - Animation configuration
 * @returns GSAP tween configuration with transformOrigin
 *
 * @example
 * ```typescript
 * gsap.to(element, withOrigin('top left', {
 *   scale: 1.5,
 *   rotation: 45,
 *   duration: 0.6
 * }))
 * ```
 */
export function withOrigin(origin: string, animation: GSAPTweenConfig): GSAPTweenConfig {
  return {
    ...animation,
    transformOrigin: origin,
  }
}

// ============================================================================
// Keyframe Utilities
// ============================================================================

/**
 * Create a keyframe animation from an array of states.
 *
 * @param keyframes - Array of keyframe objects
 * @param config - Additional configuration
 * @returns GSAP tween configuration with keyframes
 *
 * @example
 * ```typescript
 * gsap.to(element, keyframes([
 *   { x: 0, y: 0, rotation: 0 },
 *   { x: 100, y: -50, rotation: 180 },
 *   { x: 200, y: 0, rotation: 360 }
 * ], { duration: 2, ease: 'power2.inOut' }))
 * ```
 */
export function keyframes(
  frames: Array<Record<string, unknown>>,
  config: { duration?: number; ease?: Ease } = {},
): GSAPTweenConfig {
  const { duration, ease = 'easeInOut' } = config

  // Calculate duration per frame if total duration specified
  const frameDuration = duration ? duration / frames.length : undefined

  const formattedFrames = frames.map((frame, index) => ({
    ...frame,
    ...(frameDuration && { duration: frameDuration }),
    ease: index === frames.length - 1 ? resolveEase(ease) : 'none',
  }))

  return {
    keyframes: formattedFrames,
  }
}

/**
 * Create a looping animation.
 *
 * @param animation - Animation to loop
 * @param config - Loop configuration
 * @returns GSAP tween configuration with repeat
 *
 * @example
 * ```typescript
 * // Infinite loop
 * gsap.to(element, loop(fadeIn(), { yoyo: true }))
 *
 * // Loop 3 times
 * gsap.to(element, loop(slideIn(), { count: 3 }))
 * ```
 */
export function loop(
  animation: GSAPTweenConfig,
  config: {
    /** Number of loops (-1 for infinite, default: -1) */
    count?: number
    /** Reverse on alternate iterations (default: false) */
    yoyo?: boolean
    /** Delay between loops (default: 0) */
    delay?: number
  } = {},
): GSAPTweenConfig {
  const { count = -1, yoyo = false, delay = 0 } = config

  return {
    ...animation,
    repeat: count,
    yoyo,
    repeatDelay: delay,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Reverse an animation configuration.
 *
 * @param animation - Animation to reverse
 * @returns Reversed animation configuration
 *
 * @example
 * ```typescript
 * const fadeInAnim = fadeIn()
 * const fadeOutAnim = reverse(fadeInAnim)
 * ```
 */
export function reverse(animation: GSAPTweenConfig): GSAPTweenConfig {
  const { startAt, ease, ...rest } = animation as GSAPTweenConfig & { startAt?: Record<string, unknown> }

  // Swap current values with startAt values
  const reversed: GSAPTweenConfig = {
    ...startAt,
    duration: rest.duration,
    ease: reverseEase(ease as string),
    startAt: { ...rest },
  }

  // Clean up non-animatable properties from startAt
  delete (reversed.startAt as Record<string, unknown>)?.duration
  delete (reversed.startAt as Record<string, unknown>)?.ease

  return reversed
}

/**
 * Get the reverse easing for an animation.
 */
function reverseEase(ease: string | undefined): string {
  if (!ease) return 'power2.in'

  if (ease.includes('.out')) {
    return ease.replace('.out', '.in')
  }
  if (ease.includes('.in') && !ease.includes('.inOut')) {
    return ease.replace('.in', '.out')
  }

  return ease
}

/**
 * Scale animation durations by a factor.
 *
 * @param animation - Animation to scale
 * @param factor - Scale factor (e.g., 2 = twice as slow)
 * @returns Animation with scaled duration
 */
export function scaleDuration(animation: GSAPTweenConfig, factor: number): GSAPTweenConfig {
  const duration = (animation.duration as number ?? 0.5) * factor

  return {
    ...animation,
    duration,
  }
}
