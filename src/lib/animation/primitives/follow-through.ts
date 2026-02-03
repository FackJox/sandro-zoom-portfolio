/**
 * Follow-Through Animation Primitives
 *
 * Physics-based settle and overshoot animations.
 */

import type { Ease } from '../../types'
import { resolveEase } from '../easing'
import type { GSAPTweenConfig } from './fade'

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for follow-through animation.
 */
export interface FollowThroughConfig {
  /** Amount of settle/overshoot (0-1, default: 0.3) */
  settle?: number
  /** Wobble intensity for secondary motion (0-1, default: 0) */
  wobble?: number
  /** Animation duration in seconds (default: 0.8) */
  duration?: number
  /** Easing function (default: 'back.out') */
  ease?: Ease
}

/**
 * Configuration for spring animation.
 */
export interface SpringConfig {
  /** Spring stiffness (default: 100) */
  stiffness?: number
  /** Damping ratio (default: 10) */
  damping?: number
  /** Mass of the object (default: 1) */
  mass?: number
  /** Initial velocity (default: 0) */
  velocity?: number
}

/**
 * Configuration for inertia animation.
 */
export interface InertiaConfig {
  /** Velocity decay rate (default: 0.95) */
  decay?: number
  /** Minimum velocity to stop (default: 0.001) */
  minVelocity?: number
  /** Maximum distance to travel (optional) */
  maxDistance?: number
  /** Snap to values (optional) */
  snap?: number | number[]
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_FOLLOW_THROUGH_DURATION = 0.8
const DEFAULT_SETTLE = 0.3
const DEFAULT_WOBBLE = 0

// ============================================================================
// Animation Primitives
// ============================================================================

/**
 * Create a follow-through animation with settle/overshoot.
 *
 * @param config - Follow-through configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Basic follow-through
 * gsap.to(element, {
 *   x: 100,
 *   ...followThrough()
 * })
 *
 * // With more overshoot
 * gsap.to(element, {
 *   scale: 1.5,
 *   ...followThrough({ settle: 0.5 })
 * })
 *
 * // With wobble
 * gsap.to(element, {
 *   rotation: 45,
 *   ...followThrough({ wobble: 0.3 })
 * })
 * ```
 */
export function followThrough(config: FollowThroughConfig = {}): GSAPTweenConfig {
  const {
    settle = DEFAULT_SETTLE,
    wobble = DEFAULT_WOBBLE,
    duration = DEFAULT_FOLLOW_THROUGH_DURATION,
    ease = 'back.out',
  } = config

  // Calculate back overshoot amount based on settle
  const overshoot = 1 + settle * 3

  // Build ease string with overshoot parameter
  let easeString = ease
  if (ease === 'back.out' || ease === 'back.inOut') {
    easeString = `${ease}(${overshoot})` as Ease
  }

  const tweenConfig: GSAPTweenConfig = {
    duration,
    ease: easeString.includes('(') ? easeString : resolveEase(ease),
  }

  // Add wobble via yoyo if specified
  if (wobble > 0) {
    tweenConfig.yoyoEase = `elastic.out(${1 + wobble}, ${0.3 + wobble * 0.2})`
    tweenConfig.repeat = 1
    tweenConfig.yoyo = true
    tweenConfig.repeatDelay = duration * 0.1
  }

  return tweenConfig
}

/**
 * Create an elastic settle animation.
 *
 * @param config - Elastic configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Bouncy settle
 * gsap.to(element, {
 *   y: 0,
 *   ...elasticSettle({ amplitude: 1.5 })
 * })
 * ```
 */
export function elasticSettle(
  config: {
    /** Amplitude of the elastic effect (default: 1) */
    amplitude?: number
    /** Period of oscillation (default: 0.3) */
    period?: number
    /** Animation duration in seconds (default: 1) */
    duration?: number
  } = {},
): GSAPTweenConfig {
  const { amplitude = 1, period = 0.3, duration = 1 } = config

  return {
    duration,
    ease: `elastic.out(${amplitude}, ${period})`,
  }
}

/**
 * Create a bounce settle animation.
 *
 * @param config - Bounce configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Bounce into place
 * gsap.to(element, {
 *   y: 0,
 *   ...bounceSettle()
 * })
 * ```
 */
export function bounceSettle(
  config: {
    /** Animation duration in seconds (default: 0.8) */
    duration?: number
    /** Number of bounces (affects easing, default: 3) */
    bounces?: number
  } = {},
): GSAPTweenConfig {
  const { duration = 0.8 } = config

  return {
    duration,
    ease: 'bounce.out',
  }
}

/**
 * Create a smooth overshoot animation.
 *
 * @param amount - Overshoot amount (default: 1.7)
 * @param duration - Animation duration in seconds (default: 0.6)
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Overshoot with settle
 * gsap.to(element, {
 *   x: 200,
 *   ...overshoot(2)
 * })
 * ```
 */
export function overshoot(amount: number = 1.7, duration: number = 0.6): GSAPTweenConfig {
  return {
    duration,
    ease: `back.out(${amount})`,
  }
}

/**
 * Create an anticipation animation (pull back before action).
 *
 * @param config - Anticipation configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Pull back before jump
 * const tl = gsap.timeline()
 * tl.to(element, anticipate({ amount: 0.2 }))
 * tl.to(element, { y: -100 })
 * ```
 */
export function anticipate(
  config: {
    /** Pull-back amount as fraction (default: 0.1) */
    amount?: number
    /** Animation duration in seconds (default: 0.2) */
    duration?: number
  } = {},
): GSAPTweenConfig {
  const { amount = 0.1, duration = 0.2 } = config

  return {
    duration,
    ease: `back.in(${1 + amount * 10})`,
  }
}

// ============================================================================
// Physics-Based Animations
// ============================================================================

/**
 * Create a spring physics animation.
 *
 * Note: This generates keyframes to simulate spring physics.
 * For true spring physics, use GSAP's InertiaPlugin.
 *
 * @param target - Target value
 * @param config - Spring configuration
 * @returns GSAP tween configuration with keyframes
 *
 * @example
 * ```typescript
 * gsap.to(element, {
 *   x: spring(100, { stiffness: 150, damping: 12 })
 * })
 * ```
 */
export function spring(
  target: number,
  config: SpringConfig = {},
): { keyframes: Array<{ value: number; duration: number }> } {
  const { stiffness = 100, damping = 10, mass = 1, velocity = 0 } = config

  // Calculate spring parameters
  const omega = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  // Generate keyframes for spring simulation
  const keyframes: Array<{ value: number; duration: number }> = []
  const steps = 20
  const totalDuration = 4 / (zeta * omega) // Approximate settling time

  let current = 0
  let v = velocity

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalDuration
    const dt = totalDuration / steps

    // Damped harmonic oscillator
    if (zeta < 1) {
      // Underdamped
      const omegaD = omega * Math.sqrt(1 - zeta * zeta)
      const envelope = Math.exp(-zeta * omega * t)
      current = target - envelope * (target * Math.cos(omegaD * t) + ((zeta * omega * target + v) / omegaD) * Math.sin(omegaD * t))
    } else if (zeta === 1) {
      // Critically damped
      current = target - (target + (v + omega * target) * t) * Math.exp(-omega * t)
    } else {
      // Overdamped
      const r1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1))
      const r2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1))
      const c2 = (v - r1 * (current - target)) / (r2 - r1)
      const c1 = (current - target) - c2
      current = target + c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t)
    }

    keyframes.push({
      value: current,
      duration: dt,
    })
  }

  return { keyframes }
}

/**
 * Create a momentum-based deceleration.
 *
 * @param config - Inertia configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Drag and release with momentum
 * gsap.to(element, {
 *   x: '+=500',
 *   ...momentum({ decay: 0.92 })
 * })
 * ```
 */
export function momentum(config: InertiaConfig = {}): GSAPTweenConfig {
  const { decay = 0.95 } = config

  // Convert decay to duration (approximate)
  const duration = -Math.log(0.01) / -Math.log(decay) * 0.016

  return {
    duration: Math.min(duration, 3), // Cap at 3 seconds
    ease: 'expo.out',
  }
}

// ============================================================================
// Combined Animations
// ============================================================================

/**
 * Create a squash and stretch effect.
 *
 * @param config - Squash and stretch configuration
 * @returns GSAP tween configuration with keyframes
 *
 * @example
 * ```typescript
 * // Bouncing ball effect
 * gsap.to(ball, squashAndStretch({ intensity: 0.3 }))
 * ```
 */
export function squashAndStretch(
  config: {
    /** Intensity of the effect (0-1, default: 0.2) */
    intensity?: number
    /** Animation duration in seconds (default: 0.4) */
    duration?: number
    /** Axis of the effect (default: 'y') */
    axis?: 'x' | 'y'
  } = {},
): GSAPTweenConfig {
  const { intensity = 0.2, duration = 0.4, axis = 'y' } = config

  const squash = 1 - intensity
  const stretch = 1 + intensity

  const scaleX = axis === 'y' ? [stretch, squash, 1] : [squash, stretch, 1]
  const scaleY = axis === 'y' ? [squash, stretch, 1] : [stretch, squash, 1]

  return {
    keyframes: [
      { scaleX: scaleX[0], scaleY: scaleY[0], duration: duration * 0.3, ease: 'power2.in' },
      { scaleX: scaleX[1], scaleY: scaleY[1], duration: duration * 0.3, ease: 'power2.out' },
      { scaleX: scaleX[2], scaleY: scaleY[2], duration: duration * 0.4, ease: 'elastic.out(1, 0.5)' },
    ],
  }
}

/**
 * Create a shake effect.
 *
 * @param config - Shake configuration
 * @returns GSAP tween configuration
 *
 * @example
 * ```typescript
 * // Error shake
 * gsap.to(input, shake({ intensity: 10 }))
 * ```
 */
export function shake(
  config: {
    /** Shake intensity in pixels (default: 5) */
    intensity?: number
    /** Number of shakes (default: 4) */
    count?: number
    /** Animation duration in seconds (default: 0.4) */
    duration?: number
    /** Axis of shake (default: 'x') */
    axis?: 'x' | 'y' | 'both'
  } = {},
): GSAPTweenConfig {
  const { intensity = 5, count = 4, duration = 0.4, axis = 'x' } = config

  const keyframes: Array<Record<string, number | string>> = []
  const stepDuration = duration / (count * 2)

  for (let i = 0; i < count * 2; i++) {
    const direction = i % 2 === 0 ? 1 : -1
    const diminish = 1 - (i / (count * 2)) * 0.5

    const frame: Record<string, number | string> = {
      duration: stepDuration,
      ease: 'power1.inOut',
    }

    if (axis === 'x' || axis === 'both') {
      frame.x = intensity * direction * diminish
    }
    if (axis === 'y' || axis === 'both') {
      frame.y = intensity * direction * diminish
    }

    keyframes.push(frame)
  }

  // Return to origin
  keyframes.push({
    x: 0,
    y: 0,
    duration: stepDuration,
    ease: 'power2.out',
  })

  return { keyframes }
}
