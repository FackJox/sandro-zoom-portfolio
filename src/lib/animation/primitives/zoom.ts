/**
 * Zoom Animation Primitives
 *
 * Scale-based animations for zoom effects and size transitions.
 */

import type { Ease } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for zoom animation.
 */
export interface ZoomConfig {
  /** Scale range [from, to] (default: [1, 1.2]) */
  scale?: [number, number]
  /** Pan during zoom (optional) */
  pan?: { x?: number | string; y?: number | string }
  /** Rotation during zoom in degrees (optional) */
  rotate?: number
  /** Animation duration in seconds (default: 1) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
}

/**
 * Configuration for scale animation.
 */
export interface ScaleConfig {
  /** Scale range [from, to] (default: [0, 1]) */
  scale?: [number, number]
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
  /** Whether to also animate opacity (default: false) */
  fade?: boolean
}

/**
 * Configuration for zoomIn animation.
 */
export interface ZoomInConfig {
  /** Starting scale (default: 0.8) */
  from?: number
  /** Ending scale (default: 1) */
  to?: number
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
  /** Whether to also fade in (default: true) */
  fade?: boolean
}

/**
 * Configuration for zoomOut animation.
 */
export interface ZoomOutConfig {
  /** Starting scale (default: 1) */
  from?: number
  /** Ending scale (default: 0.8) */
  to?: number
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Easing function (default: 'easeIn') */
  ease?: Ease
  /** Transform origin (default: 'center center') */
  transformOrigin?: string
  /** Whether to also fade out (default: true) */
  fade?: boolean
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_ZOOM_DURATION = 1
const DEFAULT_SCALE_DURATION = 0.6
const DEFAULT_TRANSFORM_ORIGIN = 'center center'

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a zoom animation with optional pan and rotation.
 *
 * This is the Ken Burns style zoom effect, useful for images
 * and cinematic transitions.
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Simple zoom in
 * gsap.to(element, zoom({ scale: [1, 1.3] }))
 *
 * // Zoom with pan (Ken Burns effect)
 * gsap.to(element, zoom({
 *   scale: [1, 1.2],
 *   pan: { x: 50, y: -30 },
 *   duration: 5
 * }))
 *
 * // Zoom with rotation
 * gsap.to(element, zoom({
 *   scale: [1, 1.5],
 *   rotate: 10,
 *   duration: 3
 * }))
 * ```
 */
export function zoom(config: ZoomConfig = {}): GSAPTweenConfig {
  const {
    scale = [1, 1.2],
    pan,
    rotate,
    duration = DEFAULT_ZOOM_DURATION,
    ease = 'easeInOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = config

  const [fromScale, toScale] = scale

  const result: GSAPTweenConfig = {
    scale: toScale,
    duration,
    ease: resolveEase(ease),
    transformOrigin,
    startAt: {
      scale: fromScale,
    },
  }

  // Add pan if specified
  if (pan) {
    result.x = pan.x ?? 0
    result.y = pan.y ?? 0
  }

  // Add rotation if specified
  if (rotate !== undefined) {
    result.rotation = rotate
  }

  return result
}

/**
 * Scale an element with optional fade.
 *
 * Unlike zoom(), this is a simpler scale transition without
 * the Ken Burns pan/rotate options.
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Scale up from 0
 * gsap.to(element, scale({ scale: [0, 1] }))
 *
 * // Scale down with fade
 * gsap.to(element, scale({ scale: [1, 0.5], fade: true }))
 *
 * // Scale from corner
 * gsap.to(element, scale({
 *   scale: [0, 1],
 *   transformOrigin: 'top left'
 * }))
 * ```
 */
export function scale(config: ScaleConfig = {}): GSAPTweenConfig {
  const {
    scale: scaleRange = [0, 1],
    duration = DEFAULT_SCALE_DURATION,
    ease = 'easeOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
    fade = false,
  } = config

  const [fromScale, toScale] = scaleRange

  return {
    scale: toScale,
    ...(fade && { opacity: toScale > fromScale ? 1 : 0 }),
    duration,
    ease: resolveEase(ease),
    transformOrigin,
    startAt: {
      scale: fromScale,
      ...(fade && { opacity: toScale > fromScale ? 0 : 1 }),
    },
  }
}

/**
 * Zoom in an element (appear effect).
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic zoom in
 * gsap.to(element, zoomIn())
 *
 * // Zoom from smaller size
 * gsap.to(element, zoomIn({ from: 0.5 }))
 *
 * // Zoom without fade
 * gsap.to(element, zoomIn({ fade: false }))
 * ```
 */
export function zoomIn(config: ZoomInConfig = {}): GSAPTweenConfig {
  const {
    from = 0.8,
    to = 1,
    duration = DEFAULT_SCALE_DURATION,
    ease = 'easeOut',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
    fade = true,
  } = config

  return {
    scale: to,
    ...(fade && { opacity: 1 }),
    duration,
    ease: resolveEase(ease),
    transformOrigin,
    startAt: {
      scale: from,
      ...(fade && { opacity: 0 }),
    },
  }
}

/**
 * Zoom out an element (disappear effect).
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic zoom out
 * gsap.to(element, zoomOut())
 *
 * // Zoom to specific size
 * gsap.to(element, zoomOut({ to: 0 }))
 *
 * // Zoom out without fade
 * gsap.to(element, zoomOut({ fade: false }))
 * ```
 */
export function zoomOut(config: ZoomOutConfig = {}): GSAPTweenConfig {
  const {
    from = 1,
    to = 0.8,
    duration = DEFAULT_SCALE_DURATION,
    ease = 'easeIn',
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
    fade = true,
  } = config

  return {
    scale: to,
    ...(fade && { opacity: 0 }),
    duration,
    ease: resolveEase(ease),
    transformOrigin,
    startAt: {
      scale: from,
      ...(fade && { opacity: 1 }),
    },
  }
}

// ============================================================================
// Ken Burns Presets
// ============================================================================

/**
 * Ken Burns effect: slow zoom with pan.
 * Ideal for images in cinematic scrollytelling.
 *
 * @param direction - Direction of pan ('left' | 'right' | 'up' | 'down')
 * @param config - Additional configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Pan left while zooming
 * gsap.to(image, kenBurns('left', { duration: 8 }))
 * ```
 */
export function kenBurns(
  direction: 'left' | 'right' | 'up' | 'down' = 'left',
  config: Omit<ZoomConfig, 'pan'> = {},
): GSAPTweenConfig {
  const panAmount = 50 // pixels

  const panMap: Record<string, { x?: number; y?: number }> = {
    left: { x: -panAmount },
    right: { x: panAmount },
    up: { y: -panAmount },
    down: { y: panAmount },
  }

  return zoom({
    scale: [1, 1.15],
    pan: panMap[direction],
    duration: 5,
    ease: 'linear',
    ...config,
  })
}

/**
 * Dramatic zoom: large scale change for emphasis.
 *
 * @param config - Configuration
 * @returns GSAP tween configuration
 */
export function dramaticZoom(config: Omit<ZoomConfig, 'scale'> = {}): GSAPTweenConfig {
  return zoom({
    scale: [1, 2],
    duration: 1.5,
    ease: 'cubic',
    ...config,
  })
}
