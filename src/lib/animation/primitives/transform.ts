/**
 * Transform Animation Primitives
 *
 * Multi-property transform animations for scale, rotate, skew operations.
 * Provides fine-grained control over transform properties with from/to ranges.
 */

import type { Ease } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for transform animation.
 */
export interface TransformConfig {
  /** Scale range [from, to] or single target value */
  scale?: number | [number, number]
  /** ScaleX range [from, to] or single target value */
  scaleX?: number | [number, number]
  /** ScaleY range [from, to] or single target value */
  scaleY?: number | [number, number]
  /** Rotation range [from, to] in degrees or single target value */
  rotate?: number | [number, number]
  /** SkewX range [from, to] in degrees or single target value */
  skewX?: number | [number, number]
  /** SkewY range [from, to] in degrees or single target value */
  skewY?: number | [number, number]
  /** X translation */
  x?: number | string | [number | string, number | string]
  /** Y translation */
  y?: number | string | [number | string, number | string]
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
}

/**
 * Configuration for rotate animation.
 */
export interface RotateConfig {
  /** Rotation in degrees (default: 360) */
  degrees?: number
  /** Starting rotation (default: 0) */
  from?: number
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
  /** Direction: 'cw' (clockwise) or 'ccw' (counter-clockwise) */
  direction?: 'cw' | 'ccw'
}

/**
 * Configuration for skew animation.
 */
export interface SkewConfig {
  /** SkewX in degrees */
  x?: number | [number, number]
  /** SkewY in degrees */
  y?: number | [number, number]
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
}

/**
 * Configuration for flip animation.
 */
export interface FlipConfig {
  /** Flip axis (default: 'x') */
  axis?: 'x' | 'y'
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
  /** Scale during flip (default: 1) */
  scale?: number
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_DURATION = 0.6
const DEFAULT_TRANSFORM_ORIGIN = 'center center'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a value that could be a single number or a [from, to] range.
 */
function parseRange<T>(value: T | [T, T]): { from?: T; to: T } {
  if (Array.isArray(value)) {
    return { from: value[0], to: value[1] }
  }
  return { to: value }
}

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a multi-property transform animation.
 *
 * Each property can be a single target value or a [from, to] range.
 *
 * @param config - Transform configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Scale and rotate together
 * gsap.to(element, transform({
 *   scale: [0.5, 1],
 *   rotate: [0, 180],
 *   duration: 0.8
 * }))
 *
 * // Skew with custom origin
 * gsap.to(element, transform({
 *   skewX: [0, 15],
 *   transformOrigin: 'left center'
 * }))
 *
 * // Complex transformation
 * gsap.to(element, transform({
 *   scale: [0, 1],
 *   rotate: [-90, 0],
 *   x: ['-100%', '0%'],
 *   y: [50, 0]
 * }))
 * ```
 */
export function transform(config: TransformConfig): GSAPTweenConfig {
  const {
    scale,
    scaleX,
    scaleY,
    rotate,
    skewX,
    skewY,
    x,
    y,
    duration = DEFAULT_DURATION,
    ease = 'easeInOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = config

  const result: GSAPTweenConfig = {
    duration,
    ease: resolveEase(ease),
    transformOrigin,
  }

  const startAt: Record<string, unknown> = {}

  // Handle scale
  if (scale !== undefined) {
    const { from, to } = parseRange(scale)
    result.scale = to
    if (from !== undefined) startAt.scale = from
  }

  // Handle scaleX
  if (scaleX !== undefined) {
    const { from, to } = parseRange(scaleX)
    result.scaleX = to
    if (from !== undefined) startAt.scaleX = from
  }

  // Handle scaleY
  if (scaleY !== undefined) {
    const { from, to } = parseRange(scaleY)
    result.scaleY = to
    if (from !== undefined) startAt.scaleY = from
  }

  // Handle rotate
  if (rotate !== undefined) {
    const { from, to } = parseRange(rotate)
    result.rotation = to
    if (from !== undefined) startAt.rotation = from
  }

  // Handle skewX
  if (skewX !== undefined) {
    const { from, to } = parseRange(skewX)
    result.skewX = to
    if (from !== undefined) startAt.skewX = from
  }

  // Handle skewY
  if (skewY !== undefined) {
    const { from, to } = parseRange(skewY)
    result.skewY = to
    if (from !== undefined) startAt.skewY = from
  }

  // Handle x translation
  if (x !== undefined) {
    const { from, to } = parseRange(x)
    result.x = to
    if (from !== undefined) startAt.x = from
  }

  // Handle y translation
  if (y !== undefined) {
    const { from, to } = parseRange(y)
    result.y = to
    if (from !== undefined) startAt.y = from
  }

  // Only add startAt if we have values
  if (Object.keys(startAt).length > 0) {
    result.startAt = startAt
  }

  return result
}

/**
 * Create a rotation animation.
 *
 * @param config - Rotate configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Full rotation clockwise
 * gsap.to(element, rotate({ degrees: 360 }))
 *
 * // Half rotation counter-clockwise
 * gsap.to(element, rotate({ degrees: 180, direction: 'ccw' }))
 *
 * // Rotation from specific angle
 * gsap.to(element, rotate({ from: 45, degrees: 90 }))
 * ```
 */
export function rotate(config: RotateConfig = {}): GSAPTweenConfig {
  const {
    degrees = 360,
    from = 0,
    duration = DEFAULT_DURATION,
    ease = 'easeInOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
    direction = 'cw',
  } = config

  const to = direction === 'cw' ? from + degrees : from - degrees

  return {
    rotation: to,
    duration,
    ease: resolveEase(ease),
    transformOrigin,
    startAt: {
      rotation: from,
    },
  }
}

/**
 * Create a skew animation.
 *
 * @param config - Skew configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Skew on X axis
 * gsap.to(element, skew({ x: 15 }))
 *
 * // Skew on both axes
 * gsap.to(element, skew({ x: [0, 10], y: [0, -5] }))
 * ```
 */
export function skew(config: SkewConfig = {}): GSAPTweenConfig {
  const {
    x,
    y,
    duration = DEFAULT_DURATION,
    ease = 'easeInOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = config

  const result: GSAPTweenConfig = {
    duration,
    ease: resolveEase(ease),
    transformOrigin,
  }

  const startAt: Record<string, unknown> = {}

  if (x !== undefined) {
    const { from, to } = parseRange(x)
    result.skewX = to
    if (from !== undefined) startAt.skewX = from
  }

  if (y !== undefined) {
    const { from, to } = parseRange(y)
    result.skewY = to
    if (from !== undefined) startAt.skewY = from
  }

  if (Object.keys(startAt).length > 0) {
    result.startAt = startAt
  }

  return result
}

/**
 * Create a 3D flip animation.
 *
 * @param config - Flip configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Horizontal flip (around Y axis)
 * gsap.to(element, flip({ axis: 'y' }))
 *
 * // Vertical flip (around X axis)
 * gsap.to(element, flip({ axis: 'x' }))
 * ```
 */
export function flip(config: FlipConfig = {}): GSAPTweenConfig {
  const {
    axis = 'y',
    duration = DEFAULT_DURATION,
    ease = 'easeInOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
    scale = 1,
  } = config

  const rotationProp = axis === 'x' ? 'rotationX' : 'rotationY'

  return {
    [rotationProp]: 180,
    scale,
    duration,
    ease: resolveEase(ease),
    transformOrigin,
    startAt: {
      [rotationProp]: 0,
    },
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Scale up from 0 to 1.
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 */
export function scaleIn(
  config: {
    from?: number
    to?: number
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const { from = 0, to = 1, ...rest } = config
  return transform({ scale: [from, to], ...rest })
}

/**
 * Scale down from 1 to 0.
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 */
export function scaleOut(
  config: {
    from?: number
    to?: number
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const { from = 1, to = 0, ease = 'easeIn', ...rest } = config
  return transform({ scale: [from, to], ease, ...rest })
}

/**
 * Rotate in (from rotated to straight).
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 */
export function rotateIn(
  config: {
    from?: number
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const { from = -90, ...rest } = config
  return transform({ rotate: [from, 0], ...rest })
}

/**
 * Rotate out (from straight to rotated).
 *
 * @param config - Optional configuration
 * @returns GSAP tween configuration
 */
export function rotateOut(
  config: {
    to?: number
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const { to = 90, ease = 'easeIn', ...rest } = config
  return transform({ rotate: [0, to], ease, ...rest })
}

/**
 * Spin animation (continuous rotation).
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 */
export function spin(
  config: {
    rotations?: number
    direction?: 'cw' | 'ccw'
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const {
    rotations = 1,
    direction = 'cw',
    duration = 1,
    ease = 'linear',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = config

  const degrees = direction === 'cw' ? rotations * 360 : -rotations * 360

  return {
    rotation: `+=${degrees}`,
    duration,
    ease: resolveEase(ease),
    transformOrigin,
  }
}

/**
 * Wobble animation (oscillating rotation).
 *
 * @param config - Configuration
 * @returns GSAP tween configuration with keyframes
 */
export function wobble(
  config: {
    angle?: number
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const {
    angle = 15,
    duration = 0.5,
    ease = 'easeInOut',
    transformOrigin = 'center bottom',
  } = config

  return {
    keyframes: [
      { rotation: angle, duration: duration / 4, ease: resolveEase(ease) },
      { rotation: -angle * 0.8, duration: duration / 4, ease: resolveEase(ease) },
      { rotation: angle * 0.5, duration: duration / 4, ease: resolveEase(ease) },
      { rotation: 0, duration: duration / 4, ease: resolveEase(ease) },
    ],
    transformOrigin,
  }
}

/**
 * Pulse scale animation.
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 */
export function pulse(
  config: {
    scale?: number
    duration?: number
    ease?: Ease
    transformOrigin?: string
  } = {},
): GSAPTweenConfig {
  const {
    scale = 1.1,
    duration = 0.3,
    ease = 'easeInOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = config

  return {
    scale,
    duration: duration / 2,
    ease: resolveEase(ease),
    transformOrigin,
    yoyo: true,
    repeat: 1,
  }
}
