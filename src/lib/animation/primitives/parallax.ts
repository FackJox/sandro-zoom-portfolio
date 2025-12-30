/**
 * Parallax Animation Primitives
 *
 * Scroll-linked and mouse-triggered parallax effects.
 * Provides depth illusion through differential motion speeds.
 */

import type { Ease, ParallaxConfig as ParallaxConfigType } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Extended parallax configuration.
 */
export interface ParallaxConfig {
  /** Speed multiplier (0.5 = half speed, 1.5 = 1.5x speed, default: 0.5) */
  speed?: number
  /** Movement axis (default: 'y') */
  axis?: 'x' | 'y' | 'both'
  /** What triggers the parallax (default: 'scroll') */
  trigger?: 'scroll' | 'mouse'
  /** Invert the direction (default: false) */
  invert?: boolean
  /** Easing function (default: 'linear') */
  ease?: Ease
  /** Scrub value for smooth scrolling (true, false, or number in seconds) */
  scrub?: boolean | number
}

/**
 * Configuration for scroll-linked parallax.
 */
export interface ScrollParallaxConfig extends ParallaxConfig {
  trigger?: 'scroll'
  /** Scroll distance that triggers full movement (default: '100%') */
  scrollDistance?: string
  /** ScrollTrigger markers for debugging (default: false) */
  markers?: boolean
}

/**
 * Configuration for mouse-triggered parallax.
 */
export interface MouseParallaxConfig extends ParallaxConfig {
  trigger?: 'mouse'
  /** Maximum movement in pixels (default: 30) */
  maxMovement?: number
  /** Smoothing duration in seconds (default: 0.3) */
  smoothing?: number
}

/**
 * Configuration for z-based parallax speed calculation.
 */
export interface ZBasedParallaxConfig {
  /** Z-index of the layer */
  z: number
  /** Base z-index for 1x speed (default: 50) */
  baseZ?: number
  /** Speed range [slowest, fastest] (default: [0.3, 1.3]) */
  speedRange?: [number, number]
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SPEED = 0.5
const DEFAULT_AXIS = 'y'
const DEFAULT_SCROLL_DISTANCE = '100%'
const DEFAULT_MAX_MOUSE_MOVEMENT = 30
const DEFAULT_SMOOTHING = 0.3
const DEFAULT_BASE_Z = 50
const DEFAULT_SPEED_RANGE: [number, number] = [0.3, 1.3]

// ============================================================================
// Speed Calculation
// ============================================================================

/**
 * Calculate parallax speed based on z-index.
 *
 * Elements with lower z (background) move slower.
 * Elements with higher z (foreground) move faster.
 *
 * @param config - Z-based configuration
 * @returns Calculated speed multiplier
 *
 * @example
 * ```typescript
 * calculateZSpeed({ z: 0 })    // → 0.3 (background, slow)
 * calculateZSpeed({ z: 50 })   // → 0.8 (midground, medium)
 * calculateZSpeed({ z: 100 })  // → 1.3 (foreground, fast)
 * ```
 */
export function calculateZSpeed(config: ZBasedParallaxConfig): number {
  const { z, baseZ = DEFAULT_BASE_Z, speedRange = DEFAULT_SPEED_RANGE } = config

  const [slowest, fastest] = speedRange

  // Normalize z to 0-1 range (assuming z typically 0-100)
  const normalizedZ = Math.max(0, Math.min(1, z / 100))

  // Linear interpolation between slowest and fastest
  return slowest + (fastest - slowest) * normalizedZ
}

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a parallax animation configuration.
 *
 * This primitive returns a configuration object that can be used
 * with GSAP ScrollTrigger or custom mouse tracking.
 *
 * @param config - Parallax configuration
 * @returns GSAP tween configuration for scroll-based, or config object for mouse
 *
 * @example
 * ```typescript
 * // Basic scroll parallax
 * gsap.to(element, {
 *   ...parallax({ speed: 0.5 }),
 *   scrollTrigger: { ... }
 * })
 *
 * // Fast parallax on X axis
 * parallax({ speed: 1.5, axis: 'x' })
 *
 * // Z-based automatic speed
 * parallax({ speed: calculateZSpeed({ z: 25 }) })
 * ```
 */
export function parallax(config: ParallaxConfig = {}): GSAPTweenConfig {
  const {
    speed = DEFAULT_SPEED,
    axis = DEFAULT_AXIS,
    invert = false,
    ease = 'linear',
    scrub = true,
  } = config

  // Calculate movement multiplier
  const multiplier = invert ? -speed : speed

  // For scroll parallax, we use yPercent/xPercent for smooth performance
  const result: GSAPTweenConfig = {
    ease: resolveEase(ease),
  }

  // Add axis-specific properties
  if (axis === 'y' || axis === 'both') {
    result.yPercent = multiplier * 100
  }
  if (axis === 'x' || axis === 'both') {
    result.xPercent = multiplier * 100
  }

  // Scrub configuration for ScrollTrigger
  if (scrub !== undefined) {
    result._scrub = scrub
  }

  return result
}

/**
 * Create scroll-linked parallax configuration with ScrollTrigger options.
 *
 * @param config - Scroll parallax configuration
 * @returns Object with tween config and ScrollTrigger config
 *
 * @example
 * ```typescript
 * const { tween, scrollTrigger } = scrollParallax({
 *   speed: 0.5,
 *   scrollDistance: '200%'
 * })
 *
 * gsap.to(element, {
 *   ...tween,
 *   scrollTrigger: {
 *     ...scrollTrigger,
 *     trigger: container
 *   }
 * })
 * ```
 */
export function scrollParallax(config: ScrollParallaxConfig = {}): {
  tween: GSAPTweenConfig
  scrollTrigger: Record<string, unknown>
} {
  const {
    scrollDistance = DEFAULT_SCROLL_DISTANCE,
    markers = false,
    scrub = true,
    ...parallaxConfig
  } = config

  const tweenConfig = parallax({ ...parallaxConfig, scrub })

  return {
    tween: tweenConfig,
    scrollTrigger: {
      start: 'top bottom',
      end: `+=${scrollDistance}`,
      scrub: scrub === true ? 1 : scrub,
      markers,
    },
  }
}

/**
 * Create mouse-triggered parallax configuration.
 *
 * This returns a function that should be called with mouse position
 * to get the current transform values.
 *
 * @param config - Mouse parallax configuration
 * @returns Function that takes mouse position and returns transform values
 *
 * @example
 * ```typescript
 * const getTransform = mouseParallax({ speed: 0.5, maxMovement: 50 })
 *
 * // In mouse move handler:
 * const { x, y } = getTransform(mouseX, mouseY, viewportWidth, viewportHeight)
 * gsap.to(element, { x, y, duration: 0.3 })
 * ```
 */
export function mouseParallax(config: MouseParallaxConfig = {}): (
  mouseX: number,
  mouseY: number,
  viewportWidth: number,
  viewportHeight: number,
) => { x: number; y: number } {
  const {
    speed = DEFAULT_SPEED,
    axis = 'both',
    maxMovement = DEFAULT_MAX_MOUSE_MOVEMENT,
    invert = false,
  } = config

  const multiplier = invert ? -1 : 1

  return (mouseX: number, mouseY: number, viewportWidth: number, viewportHeight: number) => {
    // Normalize mouse position to -1 to 1 range
    const normalizedX = (mouseX / viewportWidth - 0.5) * 2
    const normalizedY = (mouseY / viewportHeight - 0.5) * 2

    const result = { x: 0, y: 0 }

    if (axis === 'x' || axis === 'both') {
      result.x = normalizedX * maxMovement * speed * multiplier
    }

    if (axis === 'y' || axis === 'both') {
      result.y = normalizedY * maxMovement * speed * multiplier
    }

    return result
  }
}

/**
 * Create configuration for mouse parallax animation with smoothing.
 *
 * @param config - Mouse parallax configuration
 * @returns GSAP tween configuration for smooth mouse following
 *
 * @example
 * ```typescript
 * // Store the calculator
 * const calc = mouseParallax({ speed: 0.3 })
 *
 * // In mouse move handler:
 * const pos = calc(e.clientX, e.clientY, window.innerWidth, window.innerHeight)
 * gsap.to(element, mouseParallaxTween({
 *   ...pos,
 *   smoothing: 0.5
 * }))
 * ```
 */
export function mouseParallaxTween(config: {
  x: number
  y: number
  smoothing?: number
  ease?: Ease
}): GSAPTweenConfig {
  const { x, y, smoothing = DEFAULT_SMOOTHING, ease = 'easeOut' } = config

  return {
    x,
    y,
    duration: smoothing,
    ease: resolveEase(ease),
    overwrite: 'auto',
  }
}

// ============================================================================
// Layer Helpers
// ============================================================================

/**
 * Create parallax configuration from layer z-index.
 *
 * Convenience function for common layer-based parallax setup.
 *
 * @param z - Layer z-index
 * @param config - Additional parallax configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Background layer (z=0) - slow parallax
 * layerParallax(0)
 *
 * // Midground layer (z=50) - medium parallax
 * layerParallax(50)
 *
 * // Foreground layer (z=100) - fast parallax
 * layerParallax(100)
 * ```
 */
export function layerParallax(z: number, config: Omit<ParallaxConfig, 'speed'> = {}): GSAPTweenConfig {
  const speed = calculateZSpeed({ z })
  return parallax({ speed, ...config })
}

/**
 * Create parallax configurations for a set of layers.
 *
 * @param layers - Array of layer z-indices
 * @param config - Shared parallax configuration
 * @returns Map of z-index to GSAP tween configuration
 *
 * @example
 * ```typescript
 * const configs = createLayerParallax([0, 25, 50, 75, 100])
 *
 * // Apply to elements
 * gsap.to(bgElement, configs[0])
 * gsap.to(fgElement, configs[100])
 * ```
 */
export function createLayerParallax(
  layers: number[],
  config: Omit<ParallaxConfig, 'speed'> = {},
): Record<number, GSAPTweenConfig> {
  const result: Record<number, GSAPTweenConfig> = {}

  for (const z of layers) {
    result[z] = layerParallax(z, config)
  }

  return result
}
