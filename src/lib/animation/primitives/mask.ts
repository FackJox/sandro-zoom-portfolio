/**
 * Mask Animation Primitives
 *
 * Shape-based masking animations with optional content animation.
 * Creates reveal/hide effects using CSS clip-path or SVG masks.
 */

import type { Ease } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Mask shape types.
 */
export type MaskShape = 'rect' | 'circle' | 'ellipse' | 'polygon' | 'inset' | 'path'

/**
 * Direction for reveal animations.
 */
export type RevealDirection = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'edges'

/**
 * Configuration for mask animation.
 */
export interface MaskConfig {
  /** Shape type for the mask */
  shape: MaskShape
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeInOut') */
  ease?: Ease
  /** Content animation during mask transition */
  content?: MaskContentConfig
  /** Custom path for 'path' shape type */
  path?: string
  /** Direction for rect/inset reveals (default: 'left') */
  direction?: RevealDirection
}

/**
 * Configuration for animating content within mask.
 */
export interface MaskContentConfig {
  /** Pan content during reveal */
  pan?: { x?: number | string; y?: number | string }
  /** Scale content [from, to] */
  scale?: [number, number]
  /** Rotate content [from, to] in degrees */
  rotate?: [number, number]
}

/**
 * Configuration for reveal animation.
 */
export interface RevealConfig {
  /** Direction to reveal from (default: 'left') */
  direction?: RevealDirection
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Reveal style: 'wipe' or 'grow' (default: 'wipe') */
  style?: 'wipe' | 'grow'
}

/**
 * Configuration for circle reveal.
 */
export interface CircleRevealConfig {
  /** Origin of the circle (default: 'center center') */
  origin?: string | { x: string; y: string }
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'easeOut') */
  ease?: Ease
  /** Start from inside out or outside in (default: 'in') */
  from?: 'in' | 'out'
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_DURATION = 0.8

// ============================================================================
// Clip-Path Values
// ============================================================================

/**
 * Clip-path value generators for different shapes.
 */
const clipPaths = {
  // Full visibility
  full: {
    rect: 'inset(0% 0% 0% 0%)',
    circle: 'circle(100% at 50% 50%)',
    ellipse: 'ellipse(100% 100% at 50% 50%)',
  },

  // Hidden states by direction
  hidden: {
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
    top: 'inset(0% 0% 100% 0%)',
    bottom: 'inset(100% 0% 0% 0%)',
    center: 'inset(50% 50% 50% 50%)',
    edges: 'inset(0% 0% 0% 0%)', // Special case
  },

  // Circle states
  circleHidden: 'circle(0% at 50% 50%)',
  circleFull: 'circle(150% at 50% 50%)', // 150% ensures corners are covered
}

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a mask animation configuration.
 *
 * @param config - Mask configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Reveal with rect mask from left
 * gsap.to(element, mask({
 *   shape: 'rect',
 *   direction: 'left'
 * }))
 *
 * // Circle reveal with content zoom
 * gsap.to(element, mask({
 *   shape: 'circle',
 *   content: {
 *     scale: [1.1, 1],
 *     pan: { y: -20 }
 *   }
 * }))
 * ```
 */
export function mask(config: MaskConfig): GSAPTweenConfig {
  const {
    shape,
    duration = DEFAULT_DURATION,
    ease = 'easeInOut',
    content,
    direction = 'left',
  } = config

  const result: GSAPTweenConfig = {
    duration,
    ease: resolveEase(ease),
  }

  // Set clip-path based on shape
  switch (shape) {
    case 'rect':
    case 'inset':
      result.clipPath = clipPaths.full.rect
      result.startAt = { clipPath: clipPaths.hidden[direction] }
      break
    case 'circle':
      result.clipPath = clipPaths.circleFull
      result.startAt = { clipPath: clipPaths.circleHidden }
      break
    case 'ellipse':
      result.clipPath = clipPaths.full.ellipse
      result.startAt = { clipPath: 'ellipse(0% 0% at 50% 50%)' }
      break
    default:
      // For polygon and path, user must provide specific values
      break
  }

  // Add content animation if specified
  if (content) {
    if (content.pan) {
      result.x = content.pan.x ?? 0
      result.y = content.pan.y ?? 0
      if (result.startAt) {
        ;(result.startAt as Record<string, unknown>).x = -(content.pan.x ?? 0)
        ;(result.startAt as Record<string, unknown>).y = -(content.pan.y ?? 0)
      }
    }

    if (content.scale) {
      const [from, to] = content.scale
      result.scale = to
      if (result.startAt) {
        ;(result.startAt as Record<string, unknown>).scale = from
      }
    }

    if (content.rotate) {
      const [from, to] = content.rotate
      result.rotation = to
      if (result.startAt) {
        ;(result.startAt as Record<string, unknown>).rotation = from
      }
    }
  }

  return result
}

/**
 * Reveal content with a wipe or grow animation.
 *
 * @param config - Reveal configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Wipe reveal from left
 * gsap.to(element, reveal({ direction: 'left' }))
 *
 * // Reveal from center (grow)
 * gsap.to(element, reveal({ direction: 'center', style: 'grow' }))
 *
 * // Reveal from right
 * gsap.to(element, reveal({ direction: 'right' }))
 * ```
 */
export function reveal(config: RevealConfig = {}): GSAPTweenConfig {
  const {
    direction = 'left',
    duration = DEFAULT_DURATION,
    ease = 'easeOut',
    style = 'wipe',
  } = config

  if (style === 'grow' || direction === 'center') {
    return {
      clipPath: clipPaths.full.rect,
      duration,
      ease: resolveEase(ease),
      startAt: {
        clipPath: clipPaths.hidden.center,
      },
    }
  }

  return {
    clipPath: clipPaths.full.rect,
    duration,
    ease: resolveEase(ease),
    startAt: {
      clipPath: clipPaths.hidden[direction],
    },
  }
}

/**
 * Hide content with a wipe animation.
 *
 * @param config - Configuration (similar to reveal)
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Hide with wipe to right
 * gsap.to(element, hide({ direction: 'right' }))
 * ```
 */
export function hide(config: RevealConfig = {}): GSAPTweenConfig {
  const { direction = 'left', duration = DEFAULT_DURATION, ease = 'easeIn' } = config

  // Invert direction for hide
  const hideDirection: RevealDirection =
    direction === 'left'
      ? 'right'
      : direction === 'right'
        ? 'left'
        : direction === 'top'
          ? 'bottom'
          : direction === 'bottom'
            ? 'top'
            : direction

  return {
    clipPath: clipPaths.hidden[hideDirection],
    duration,
    ease: resolveEase(ease),
  }
}

/**
 * Reveal content with a circular mask.
 *
 * @param config - Circle reveal configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Reveal from center
 * gsap.to(element, circleReveal())
 *
 * // Reveal from top-left corner
 * gsap.to(element, circleReveal({ origin: '0% 0%' }))
 *
 * // Reveal from specific point
 * gsap.to(element, circleReveal({ origin: { x: '75%', y: '25%' } }))
 * ```
 */
export function circleReveal(config: CircleRevealConfig = {}): GSAPTweenConfig {
  const { origin = 'center center', duration = DEFAULT_DURATION, ease = 'easeOut', from = 'in' } = config

  // Parse origin
  let originX = '50%'
  let originY = '50%'

  if (typeof origin === 'string') {
    const parts = origin.split(' ')
    originX = parts[0] || '50%'
    originY = parts[1] || '50%'
  } else {
    originX = origin.x
    originY = origin.y
  }

  const hiddenClip = `circle(0% at ${originX} ${originY})`
  const fullClip = `circle(150% at ${originX} ${originY})`

  if (from === 'out') {
    // Reveal from outside in
    return {
      clipPath: fullClip,
      duration,
      ease: resolveEase(ease),
      startAt: {
        clipPath: `circle(150% at ${originX} ${originY})`,
      },
    }
  }

  // Reveal from inside out (default)
  return {
    clipPath: fullClip,
    duration,
    ease: resolveEase(ease),
    startAt: {
      clipPath: hiddenClip,
    },
  }
}

/**
 * Hide content with a circular mask closing.
 *
 * @param config - Circle hide configuration
 * @returns GSAP tween configuration
 */
export function circleHide(config: Omit<CircleRevealConfig, 'from'> = {}): GSAPTweenConfig {
  const { origin = 'center center', duration = DEFAULT_DURATION, ease = 'easeIn' } = config

  let originX = '50%'
  let originY = '50%'

  if (typeof origin === 'string') {
    const parts = origin.split(' ')
    originX = parts[0] || '50%'
    originY = parts[1] || '50%'
  } else {
    originX = origin.x
    originY = origin.y
  }

  return {
    clipPath: `circle(0% at ${originX} ${originY})`,
    duration,
    ease: resolveEase(ease),
  }
}

// ============================================================================
// Preset Mask Animations
// ============================================================================

/**
 * Iris wipe - classic cinematic transition.
 *
 * @param duration - Animation duration
 * @param ease - Easing function
 * @returns GSAP tween configuration
 */
export function irisIn(duration = 1, ease: Ease = 'easeOut'): GSAPTweenConfig {
  return circleReveal({ duration, ease })
}

/**
 * Iris wipe out.
 *
 * @param duration - Animation duration
 * @param ease - Easing function
 * @returns GSAP tween configuration
 */
export function irisOut(duration = 1, ease: Ease = 'easeIn'): GSAPTweenConfig {
  return circleHide({ duration, ease })
}

/**
 * Barn door reveal - opens from center horizontally.
 *
 * @param duration - Animation duration
 * @param ease - Easing function
 * @returns GSAP tween configuration
 */
export function barnDoorOpen(duration = 0.8, ease: Ease = 'easeOut'): GSAPTweenConfig {
  return {
    clipPath: 'inset(0% 0% 0% 0%)',
    duration,
    ease: resolveEase(ease),
    startAt: {
      clipPath: 'inset(0% 50% 0% 50%)',
    },
  }
}

/**
 * Barn door close - closes to center horizontally.
 *
 * @param duration - Animation duration
 * @param ease - Easing function
 * @returns GSAP tween configuration
 */
export function barnDoorClose(duration = 0.8, ease: Ease = 'easeIn'): GSAPTweenConfig {
  return {
    clipPath: 'inset(0% 50% 0% 50%)',
    duration,
    ease: resolveEase(ease),
  }
}

/**
 * Venetian blinds reveal.
 *
 * @param stripes - Number of stripes (default: 10)
 * @param duration - Animation duration
 * @param ease - Easing function
 * @returns Configuration for venetian effect (requires multiple elements)
 */
export function venetianReveal(
  stripes = 10,
  duration = 0.8,
  ease: Ease = 'easeOut',
): { stripes: number; duration: number; ease: string; stagger: number } {
  return {
    stripes,
    duration,
    ease: resolveEase(ease),
    stagger: duration / stripes / 2,
  }
}
