/**
 * GSAP Passthrough
 *
 * Escape hatch for using raw GSAP configurations when primitives aren't sufficient.
 */

import type { Ease } from '../types'
import { resolveEase } from './easing'
import type { GSAPTweenConfig } from './primitives/fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Raw GSAP configuration with optional ease resolution.
 */
export interface RawGSAPConfig {
  /** Any GSAP properties */
  [key: string]: unknown
  /** Duration in seconds */
  duration?: number
  /** Easing - will be resolved to GSAP format */
  ease?: Ease | string
}

/**
 * GSAP keyframe configuration.
 */
export interface GSAPKeyframe {
  /** Any animatable properties */
  [key: string]: unknown
  /** Duration for this keyframe */
  duration?: number
  /** Easing for this keyframe */
  ease?: Ease | string
}

/**
 * GSAP timeline configuration.
 */
export interface GSAPTimelineConfig {
  /** Delay before timeline starts */
  delay?: number
  /** Whether timeline is paused initially */
  paused?: boolean
  /** Number of repeats (-1 for infinite) */
  repeat?: number
  /** Delay between repeats */
  repeatDelay?: number
  /** Whether to reverse on alternate iterations */
  yoyo?: boolean
  /** Default properties for all tweens */
  defaults?: GSAPTweenConfig
}

// ============================================================================
// Passthrough Functions
// ============================================================================

/**
 * Pass raw GSAP configuration through with optional ease resolution.
 *
 * Use this when animation primitives don't cover your use case.
 *
 * @param config - Raw GSAP configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Direct GSAP config with ease resolution
 * gsap.to(element, gsapRaw({
 *   x: 100,
 *   y: 50,
 *   rotation: 45,
 *   duration: 0.8,
 *   ease: 'easeOut' // Will be resolved to 'power2.out'
 * }))
 *
 * // Complex GSAP-specific features
 * gsap.to(element, gsapRaw({
 *   motionPath: {
 *     path: '#path',
 *     align: '#path',
 *     autoRotate: true
 *   },
 *   duration: 3
 * }))
 * ```
 */
export function gsapRaw(config: RawGSAPConfig): GSAPTweenConfig {
  const { ease, ...rest } = config

  return {
    ...rest,
    ...(ease && { ease: resolveEase(ease as Ease) }),
  }
}

/**
 * Create a GSAP keyframes animation.
 *
 * @param frames - Array of keyframe configurations
 * @returns GSAP tween configuration with keyframes
 *
 * @example
 * ```typescript
 * gsap.to(element, gsapKeyframes([
 *   { x: 0, duration: 0.5 },
 *   { x: 100, y: -50, duration: 0.3 },
 *   { x: 100, y: 0, duration: 0.2 },
 * ]))
 * ```
 */
export function gsapKeyframes(frames: GSAPKeyframe[]): GSAPTweenConfig {
  // Resolve easing in each keyframe
  const resolvedFrames = frames.map((frame) => {
    const { ease, ...rest } = frame
    return {
      ...rest,
      ...(ease && { ease: resolveEase(ease as Ease) }),
    }
  })

  return {
    keyframes: resolvedFrames,
  }
}

/**
 * Create configuration for a GSAP timeline.
 *
 * @param config - Timeline configuration
 * @returns GSAP timeline configuration object
 *
 * @example
 * ```typescript
 * const tl = gsap.timeline(gsapTimelineConfig({
 *   paused: true,
 *   repeat: -1,
 *   yoyo: true,
 *   defaults: { duration: 0.5, ease: 'easeOut' }
 * }))
 * ```
 */
export function gsapTimelineConfig(config: GSAPTimelineConfig = {}): gsap.TimelineVars {
  const { defaults, ...rest } = config

  const resolvedDefaults = defaults
    ? {
        ...defaults,
        ease: defaults.ease ? resolveEase(defaults.ease as Ease) : undefined,
      }
    : undefined

  return {
    ...rest,
    ...(resolvedDefaults && { defaults: resolvedDefaults }),
  }
}

// ============================================================================
// GSAP Plugin Wrappers
// ============================================================================

/**
 * Create a MotionPath animation configuration.
 *
 * Requires GSAP MotionPathPlugin.
 *
 * @param config - MotionPath configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * gsap.to(element, motionPath({
 *   path: '#myPath',
 *   align: '#myPath',
 *   autoRotate: true,
 *   duration: 3
 * }))
 * ```
 */
export function motionPath(config: {
  /** Path selector or SVG path data */
  path: string | SVGPathElement
  /** Element to align path to */
  align?: string | Element
  /** Whether to auto-rotate along path */
  autoRotate?: boolean | number
  /** Start point on path (0-1) */
  start?: number
  /** End point on path (0-1) */
  end?: number
  /** Duration in seconds */
  duration?: number
  /** Easing function */
  ease?: Ease
}): GSAPTweenConfig {
  const {
    path,
    align,
    autoRotate = false,
    start = 0,
    end = 1,
    duration = 2,
    ease = 'linear',
  } = config

  return {
    motionPath: {
      path,
      align: align ?? path,
      autoRotate,
      start,
      end,
    },
    duration,
    ease: resolveEase(ease),
  }
}

/**
 * Create a ScrollTrigger configuration.
 *
 * @param config - ScrollTrigger configuration
 * @returns ScrollTrigger configuration object
 *
 * @example
 * ```typescript
 * gsap.to(element, {
 *   x: 100,
 *   scrollTrigger: scrollTrigger({
 *     trigger: '.section',
 *     start: 'top center',
 *     end: 'bottom center',
 *     scrub: true
 *   })
 * })
 * ```
 */
export function scrollTrigger(config: {
  /** Element that triggers the animation */
  trigger: string | Element
  /** Start position (default: 'top bottom') */
  start?: string | number
  /** End position (default: 'bottom top') */
  end?: string | number
  /** Scrub animation to scroll (default: false) */
  scrub?: boolean | number
  /** Pin the trigger element */
  pin?: boolean | string | Element
  /** Show markers for debugging */
  markers?: boolean
  /** Toggle actions: onEnter, onLeave, onEnterBack, onLeaveBack */
  toggleActions?: string
  /** Toggle class on trigger */
  toggleClass?: string | { targets: string; className: string }
  /** Callbacks */
  onEnter?: () => void
  onLeave?: () => void
  onEnterBack?: () => void
  onLeaveBack?: () => void
  onUpdate?: (self: unknown) => void
}): ScrollTrigger.Vars {
  return config as ScrollTrigger.Vars
}

/**
 * Create a SplitText animation configuration.
 *
 * Requires GSAP SplitText plugin.
 *
 * @param config - SplitText configuration
 * @returns Configuration for use with SplitText
 *
 * @example
 * ```typescript
 * const split = new SplitText(element, splitTextConfig({
 *   type: 'chars,words',
 *   charsClass: 'char'
 * }))
 *
 * gsap.from(split.chars, {
 *   opacity: 0,
 *   y: 50,
 *   stagger: 0.02
 * })
 * ```
 */
export function splitTextConfig(config: {
  /** What to split: 'chars', 'words', 'lines', or combinations */
  type?: string
  /** Class to add to character elements */
  charsClass?: string
  /** Class to add to word elements */
  wordsClass?: string
  /** Class to add to line elements */
  linesClass?: string
  /** Tag to use for wrapper elements */
  tag?: string
  /** Position of wrapper */
  position?: 'relative' | 'absolute'
}): SplitText.Vars {
  return config as SplitText.Vars
}

// ============================================================================
// Type Declarations (for GSAP plugins)
// ============================================================================

declare namespace ScrollTrigger {
  interface Vars {
    trigger?: string | Element
    start?: string | number
    end?: string | number
    scrub?: boolean | number
    pin?: boolean | string | Element
    markers?: boolean
    toggleActions?: string
    toggleClass?: string | { targets: string; className: string }
    onEnter?: () => void
    onLeave?: () => void
    onEnterBack?: () => void
    onLeaveBack?: () => void
    onUpdate?: (self: unknown) => void
    [key: string]: unknown
  }
}

declare namespace SplitText {
  interface Vars {
    type?: string
    charsClass?: string
    wordsClass?: string
    linesClass?: string
    tag?: string
    position?: 'relative' | 'absolute'
    [key: string]: unknown
  }
}
