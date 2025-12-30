/**
 * Morph Animation Primitives
 *
 * SVG path morphing animations for shape transitions.
 * Requires GSAP MorphSVGPlugin for full functionality.
 */

import type { Ease } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for morph animation.
 */
export interface MorphConfig {
  /** Target shape (SVG path data, element selector, or element reference) */
  to: string | Element
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /**
   * Type of morphing algorithm:
   * - 'linear': Points morph in order
   * - 'rotational': Points find shortest rotational path
   * - 'complex': For complex shapes with sub-paths
   */
  type?: 'linear' | 'rotational' | 'complex'
  /** Origin for scaling/rotation during morph (default: '50% 50%') */
  origin?: string
  /** Shapeindex for controlling morph direction (-1 to use default) */
  shapeIndex?: number
}

/**
 * Configuration for path drawing animation.
 */
export interface DrawPathConfig {
  /** Animation duration in seconds (default: 1) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Draw from end instead of start (default: false) */
  reverse?: boolean
  /** Starting position (0-1, default: 0) */
  from?: number
  /** Ending position (0-1, default: 1) */
  to?: number
}

/**
 * Configuration for path animation along a motion path.
 */
export interface MotionPathConfig {
  /** SVG path data or selector */
  path: string
  /** Align element rotation to path (default: true) */
  autoRotate?: boolean | number
  /** Rotation offset in degrees (default: 0) */
  alignOrigin?: [number, number]
  /** Start position on path (0-1, default: 0) */
  start?: number
  /** End position on path (0-1, default: 1) */
  end?: number
  /** Animation duration in seconds (default: 2) */
  duration?: number
  /** Easing function (default: 'linear') */
  ease?: Ease
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_MORPH_DURATION = 0.8
const DEFAULT_DRAW_DURATION = 1
const DEFAULT_MOTION_DURATION = 2

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Morph one SVG shape into another.
 *
 * Note: Requires GSAP MorphSVGPlugin for actual morphing.
 * This primitive returns the configuration that MorphSVGPlugin expects.
 *
 * @param config - Morph configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Morph to another path
 * gsap.to(pathElement, morph({ to: '#target-path' }))
 *
 * // Morph with custom duration
 * gsap.to(pathElement, morph({
 *   to: 'M10,10 L100,100',
 *   duration: 1.5,
 *   type: 'rotational'
 * }))
 * ```
 */
export function morph(config: MorphConfig): GSAPTweenConfig {
  const {
    to,
    duration = DEFAULT_MORPH_DURATION,
    ease = 'easeInOut',
    type = 'linear',
    origin = '50% 50%',
    shapeIndex,
  } = config

  const result: GSAPTweenConfig = {
    morphSVG: {
      shape: to,
      type,
      origin,
      ...(shapeIndex !== undefined && { shapeIndex }),
    },
    duration,
    ease: resolveEase(ease),
  }

  return result
}

/**
 * Animate drawing of an SVG path stroke.
 *
 * Note: Requires GSAP DrawSVGPlugin for actual drawing animation.
 * This primitive returns the configuration that DrawSVGPlugin expects.
 *
 * @param config - Draw path configuration
 * @returns GSAP tween configuration with fromTo values
 *
 * @example
 * ```typescript
 * // Draw path from start to end
 * gsap.to(pathElement, drawPath())
 *
 * // Draw in reverse
 * gsap.to(pathElement, drawPath({ reverse: true }))
 *
 * // Draw partial path
 * gsap.to(pathElement, drawPath({ from: 0.25, to: 0.75 }))
 * ```
 */
export function drawPath(config: DrawPathConfig = {}): GSAPTweenConfig {
  const {
    duration = DEFAULT_DRAW_DURATION,
    ease = 'easeOut',
    reverse = false,
    from = 0,
    to = 1,
  } = config

  // DrawSVGPlugin uses percentage-based values
  const startValue = reverse ? `${to * 100}%` : `${from * 100}%`
  const endValue = reverse ? `${from * 100}%` : `${to * 100}%`

  return {
    drawSVG: endValue,
    duration,
    ease: resolveEase(ease),
    startAt: {
      drawSVG: startValue,
    },
  }
}

/**
 * Animate an element along an SVG motion path.
 *
 * Note: Requires GSAP MotionPathPlugin for actual path animation.
 * This primitive returns the configuration that MotionPathPlugin expects.
 *
 * @param config - Motion path configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Animate along a path
 * gsap.to(element, motionPath({
 *   path: '#curve-path',
 *   autoRotate: true
 * }))
 *
 * // Partial path animation
 * gsap.to(element, motionPath({
 *   path: 'M0,0 C100,0 100,100 200,100',
 *   start: 0.2,
 *   end: 0.8
 * }))
 * ```
 */
export function motionPath(config: MotionPathConfig): GSAPTweenConfig {
  const {
    path,
    autoRotate = true,
    alignOrigin = [0.5, 0.5],
    start = 0,
    end = 1,
    duration = DEFAULT_MOTION_DURATION,
    ease = 'linear',
  } = config

  return {
    motionPath: {
      path,
      autoRotate,
      alignOrigin,
      start,
      end,
    },
    duration,
    ease: resolveEase(ease),
  }
}

// ============================================================================
// Path Animation Helpers
// ============================================================================

/**
 * Animate path stroke dash for writing effect.
 * Works without DrawSVGPlugin using native stroke-dasharray.
 *
 * @param pathLength - Total length of the path (use getTotalLength())
 * @param config - Draw configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * const length = pathElement.getTotalLength()
 * gsap.to(pathElement, strokeDashDraw(length))
 * ```
 */
export function strokeDashDraw(
  pathLength: number,
  config: Omit<DrawPathConfig, 'from' | 'to'> = {},
): GSAPTweenConfig {
  const { duration = DEFAULT_DRAW_DURATION, ease = 'easeOut', reverse = false } = config

  return {
    strokeDasharray: pathLength,
    strokeDashoffset: reverse ? pathLength : 0,
    duration,
    ease: resolveEase(ease),
    startAt: {
      strokeDasharray: pathLength,
      strokeDashoffset: reverse ? 0 : pathLength,
    },
  }
}

/**
 * Erase a drawn path (reverse of draw).
 *
 * @param pathLength - Total length of the path
 * @param config - Erase configuration
 * @returns GSAP tween configuration
 */
export function strokeDashErase(
  pathLength: number,
  config: Omit<DrawPathConfig, 'from' | 'to' | 'reverse'> = {},
): GSAPTweenConfig {
  return strokeDashDraw(pathLength, { ...config, reverse: true })
}

// ============================================================================
// Shape Presets
// ============================================================================

/**
 * Common shape path data for morphing.
 * These are normalized to a 100x100 viewbox.
 */
export const SHAPES = {
  /** Perfect circle */
  circle: 'M50,0 A50,50 0 1,1 50,100 A50,50 0 1,1 50,0 Z',
  /** Square */
  square: 'M0,0 L100,0 L100,100 L0,100 Z',
  /** Equilateral triangle */
  triangle: 'M50,0 L100,86.6 L0,86.6 Z',
  /** Five-pointed star */
  star: 'M50,0 L61,35 L98,35 L68,57 L79,91 L50,70 L21,91 L32,57 L2,35 L39,35 Z',
  /** Heart shape */
  heart: 'M50,88 C20,65 0,45 0,30 C0,10 20,0 35,0 C42,0 50,5 50,12 C50,5 58,0 65,0 C80,0 100,10 100,30 C100,45 80,65 50,88 Z',
  /** Hexagon */
  hexagon: 'M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z',
  /** Diamond/rhombus */
  diamond: 'M50,0 L100,50 L50,100 L0,50 Z',
  /** Cross/plus */
  cross: 'M35,0 L65,0 L65,35 L100,35 L100,65 L65,65 L65,100 L35,100 L35,65 L0,65 L0,35 L35,35 Z',
} as const

/**
 * Morph to a preset shape.
 *
 * @param shape - Shape name from SHAPES
 * @param config - Additional morph configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Morph circle to star
 * gsap.to(circlePath, morphToShape('star'))
 * ```
 */
export function morphToShape(
  shape: keyof typeof SHAPES,
  config: Omit<MorphConfig, 'to'> = {},
): GSAPTweenConfig {
  return morph({
    ...config,
    to: SHAPES[shape],
  })
}
