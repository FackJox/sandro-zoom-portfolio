/**
 * Dimension Animation Primitives
 *
 * Z-depth animations for 3D-like depth effects.
 * Creates the illusion of elements moving toward or away from the viewer.
 */

import type { Ease } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for dimension animation.
 */
export interface DimensionConfig {
  /** Target z position (affects scale and blur) */
  z?: number
  /** Move away from viewer (alternative to z) */
  recede?: boolean
  /** Move toward viewer (alternative to z) */
  approach?: boolean
  /** Amount of movement for recede/approach (default: 100) */
  amount?: number
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Apply blur effect based on depth (default: false) */
  blur?: boolean
  /** Maximum blur amount in pixels (default: 8) */
  maxBlur?: number
  /** Apply opacity fade based on depth (default: false) */
  fade?: boolean
}

/**
 * Configuration for recede animation.
 */
export interface RecedeConfig {
  /** How far to recede (0-1, default: 0.5) */
  amount?: number
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeIn') */
  ease?: Ease
  /** Apply blur effect (default: true) */
  blur?: boolean
  /** Apply opacity fade (default: true) */
  fade?: boolean
}

/**
 * Configuration for approach animation.
 */
export interface ApproachConfig {
  /** How close to approach (0-1, default: 0.3) */
  amount?: number
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Apply blur effect (default: false) */
  blur?: boolean
  /** Apply opacity fade (default: false) */
  fade?: boolean
}

/**
 * Configuration for depth transition.
 */
export interface DepthTransitionConfig {
  /** Starting depth (0 = background, 1 = foreground) */
  from: number
  /** Ending depth (0 = background, 1 = foreground) */
  to: number
  /** Animation duration in seconds (default: 1) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Apply blur based on depth (default: true) */
  blur?: boolean
  /** Maximum blur amount (default: 8) */
  maxBlur?: number
  /** Apply opacity based on depth (default: false) */
  fade?: boolean
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_DURATION = 0.8
const DEFAULT_AMOUNT = 0.5
const DEFAULT_MAX_BLUR = 8

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert depth (0-1) to scale value.
 * Depth 0 = far (small), Depth 1 = close (full size)
 */
function depthToScale(depth: number, range: [number, number] = [0.7, 1]): number {
  const [min, max] = range
  return min + (max - min) * depth
}

/**
 * Convert depth (0-1) to blur value.
 * Depth 0 = blurry, Depth 0.5 = focused, Depth 1 = slightly blurry
 */
function depthToBlur(depth: number, maxBlur: number = DEFAULT_MAX_BLUR): number {
  // Focus point at depth 0.6-0.8, blur increases away from it
  const focusPoint = 0.7
  const distance = Math.abs(depth - focusPoint)
  return distance * maxBlur * 2
}

/**
 * Convert depth (0-1) to opacity.
 * Very far or very close elements are more transparent.
 */
function depthToOpacity(depth: number, range: [number, number] = [0.3, 1]): number {
  const [min, max] = range
  // Peak opacity at depth 0.7
  const focusPoint = 0.7
  const distance = Math.abs(depth - focusPoint)
  const normalized = 1 - distance * 1.5
  return min + (max - min) * Math.max(0, Math.min(1, normalized))
}

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a dimension/depth animation.
 *
 * Simulates 3D depth by combining scale, blur, and opacity effects.
 *
 * @param config - Dimension configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Move to specific depth
 * gsap.to(element, dimension({ z: 50 }))
 *
 * // Recede into background
 * gsap.to(element, dimension({ recede: true }))
 *
 * // Approach viewer
 * gsap.to(element, dimension({ approach: true }))
 *
 * // With blur effect
 * gsap.to(element, dimension({ recede: true, blur: true }))
 * ```
 */
export function dimension(config: DimensionConfig = {}): GSAPTweenConfig {
  const {
    z,
    recede = false,
    approach = false,
    amount = DEFAULT_AMOUNT,
    duration = DEFAULT_DURATION,
    ease = 'easeOut',
    blur = false,
    maxBlur = DEFAULT_MAX_BLUR,
    fade = false,
  } = config

  // Calculate target depth (0-1 range)
  let targetDepth: number

  if (z !== undefined) {
    // Normalize z to 0-1 (assuming z is 0-100)
    targetDepth = z / 100
  } else if (recede) {
    targetDepth = 0.5 - amount * 0.5
  } else if (approach) {
    targetDepth = 0.5 + amount * 0.5
  } else {
    targetDepth = 0.5 // Neutral depth
  }

  const result: GSAPTweenConfig = {
    scale: depthToScale(targetDepth),
    duration,
    ease: resolveEase(ease),
  }

  if (blur) {
    result.filter = `blur(${depthToBlur(targetDepth, maxBlur)}px)`
  }

  if (fade) {
    result.opacity = depthToOpacity(targetDepth)
  }

  return result
}

/**
 * Recede an element into the background.
 *
 * The element appears to move away from the viewer,
 * becoming smaller and optionally blurrier/more transparent.
 *
 * @param config - Recede configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic recede
 * gsap.to(element, recede())
 *
 * // Deep recede with all effects
 * gsap.to(element, recede({
 *   amount: 0.8,
 *   blur: true,
 *   fade: true
 * }))
 * ```
 */
export function recede(config: RecedeConfig = {}): GSAPTweenConfig {
  const {
    amount = DEFAULT_AMOUNT,
    duration = DEFAULT_DURATION,
    ease = 'easeIn',
    blur = true,
    fade = true,
  } = config

  const targetDepth = 0.5 - amount * 0.5

  const result: GSAPTweenConfig = {
    scale: depthToScale(targetDepth),
    duration,
    ease: resolveEase(ease),
  }

  if (blur) {
    result.filter = `blur(${depthToBlur(targetDepth)}px)`
  }

  if (fade) {
    result.opacity = depthToOpacity(targetDepth)
  }

  return result
}

/**
 * Approach an element toward the viewer.
 *
 * The element appears to move closer,
 * becoming larger and more prominent.
 *
 * @param config - Approach configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic approach
 * gsap.to(element, approach())
 *
 * // Dramatic approach
 * gsap.to(element, approach({
 *   amount: 0.8,
 *   duration: 1.2
 * }))
 * ```
 */
export function approach(config: ApproachConfig = {}): GSAPTweenConfig {
  const {
    amount = 0.3,
    duration = DEFAULT_DURATION,
    ease = 'easeOut',
    blur = false,
    fade = false,
  } = config

  const targetDepth = 0.5 + amount * 0.5

  const result: GSAPTweenConfig = {
    scale: depthToScale(targetDepth),
    duration,
    ease: resolveEase(ease),
  }

  if (blur) {
    result.filter = `blur(${depthToBlur(targetDepth)}px)`
  }

  if (fade) {
    result.opacity = depthToOpacity(targetDepth)
  }

  return result
}

/**
 * Transition between two depth levels.
 *
 * Useful for dramatic depth shifts in storytelling.
 *
 * @param config - Depth transition configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // From background to foreground
 * gsap.to(element, depthTransition({
 *   from: 0.2,
 *   to: 0.9,
 *   blur: true
 * }))
 *
 * // From close to far
 * gsap.to(element, depthTransition({
 *   from: 1,
 *   to: 0,
 *   fade: true
 * }))
 * ```
 */
export function depthTransition(config: DepthTransitionConfig): GSAPTweenConfig {
  const {
    from,
    to,
    duration = 1,
    ease = 'easeInOut',
    blur = true,
    maxBlur = DEFAULT_MAX_BLUR,
    fade = false,
  } = config

  const result: GSAPTweenConfig = {
    scale: depthToScale(to),
    duration,
    ease: resolveEase(ease),
    startAt: {
      scale: depthToScale(from),
    },
  }

  if (blur) {
    result.filter = `blur(${depthToBlur(to, maxBlur)}px)`
    ;(result.startAt as Record<string, unknown>).filter = `blur(${depthToBlur(from, maxBlur)}px)`
  }

  if (fade) {
    result.opacity = depthToOpacity(to)
    ;(result.startAt as Record<string, unknown>).opacity = depthToOpacity(from)
  }

  return result
}

// ============================================================================
// Preset Depth Levels
// ============================================================================

/**
 * Preset depth levels for common use cases.
 */
export const DEPTH = {
  /** Far background (very small, very blurry) */
  FAR_BACKGROUND: 0,
  /** Background layer */
  BACKGROUND: 0.2,
  /** Mid-background */
  MID_BACK: 0.4,
  /** Focus plane (clearest, full size) */
  FOCUS: 0.7,
  /** Mid-foreground */
  MID_FRONT: 0.85,
  /** Foreground layer */
  FOREGROUND: 0.95,
  /** Very close (slightly larger than focus) */
  CLOSE_UP: 1,
} as const

/**
 * Move element to a preset depth level.
 *
 * @param level - Preset depth level
 * @param config - Additional configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Move to background
 * gsap.to(element, toDepth('BACKGROUND', { blur: true }))
 *
 * // Move to focus plane
 * gsap.to(element, toDepth('FOCUS'))
 * ```
 */
export function toDepth(
  level: keyof typeof DEPTH,
  config: Omit<DimensionConfig, 'z' | 'recede' | 'approach'> = {},
): GSAPTweenConfig {
  return dimension({
    ...config,
    z: DEPTH[level] * 100,
  })
}
