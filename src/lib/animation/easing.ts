/**
 * Easing System
 *
 * Named easing constants and resolver for animation primitives.
 * Provides a simplified API that maps to GSAP easing functions.
 */

import type { Ease } from '../types'

// ============================================================================
// Named Easing Constants
// ============================================================================

/**
 * Standard easing presets mapped to GSAP easing functions.
 *
 * @example
 * ```typescript
 * import { EASE } from 'svelte-scrollytelling/animation/easing'
 *
 * gsap.to(element, { opacity: 1, ease: EASE.easeOut })
 * ```
 */
export const EASE = {
  /** Constant speed, no acceleration */
  linear: 'none',

  /** Subtle acceleration and deceleration */
  ease: 'power1.inOut',

  /** Slow start, accelerates */
  easeIn: 'power2.in',

  /** Fast start, decelerates (most natural for UI) */
  easeOut: 'power2.out',

  /** Symmetric acceleration and deceleration */
  easeInOut: 'power2.inOut',

  /** Extended acceleration/deceleration, fast middle */
  cubic: 'power3.inOut',
} as const

/**
 * Power easing variations for fine-tuned control.
 */
export const POWER = {
  '1.in': 'power1.in',
  '1.out': 'power1.out',
  '1.inOut': 'power1.inOut',
  '2.in': 'power2.in',
  '2.out': 'power2.out',
  '2.inOut': 'power2.inOut',
  '3.in': 'power3.in',
  '3.out': 'power3.out',
  '3.inOut': 'power3.inOut',
  '4.in': 'power4.in',
  '4.out': 'power4.out',
  '4.inOut': 'power4.inOut',
} as const

/**
 * Elastic easing for bouncy, spring-like motion.
 */
export const ELASTIC = {
  in: 'elastic.in(1, 0.3)',
  out: 'elastic.out(1, 0.3)',
  inOut: 'elastic.inOut(1, 0.3)',
} as const

/**
 * Bounce easing for impact effects.
 */
export const BOUNCE = {
  in: 'bounce.in',
  out: 'bounce.out',
  inOut: 'bounce.inOut',
} as const

/**
 * Back easing for overshoot effects.
 */
export const BACK = {
  in: 'back.in(1.7)',
  out: 'back.out(1.7)',
  inOut: 'back.inOut(1.7)',
} as const

// ============================================================================
// Easing Resolver
// ============================================================================

/**
 * Resolve an Ease type to a GSAP-compatible easing string.
 *
 * Supports:
 * - Named presets: 'linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'cubic'
 * - GSAP power easings: 'power1.in', 'power2.out', etc.
 * - GSAP special easings: 'elastic.out', 'bounce.in', 'back.out', etc.
 * - Custom GSAP strings passed through unchanged
 *
 * @param ease - The easing value to resolve
 * @returns GSAP-compatible easing string
 *
 * @example
 * ```typescript
 * resolveEase('easeOut')     // → 'power2.out'
 * resolveEase('linear')      // → 'none'
 * resolveEase('power3.inOut') // → 'power3.inOut' (passthrough)
 * resolveEase('elastic.out')  // → 'elastic.out' (passthrough)
 * ```
 */
export function resolveEase(ease: Ease = 'easeOut'): string {
  // Check named presets first
  if (ease in EASE) {
    return EASE[ease as keyof typeof EASE]
  }

  // Passthrough for GSAP native strings
  return ease
}

/**
 * Check if a string is a valid GSAP easing.
 *
 * @param ease - String to validate
 * @returns True if the string appears to be a valid GSAP easing
 */
export function isValidEase(ease: string): boolean {
  // Named presets
  if (ease in EASE) return true

  // GSAP power easings
  if (/^power[1-4]\.(in|out|inOut)$/.test(ease)) return true

  // GSAP special easings
  if (/^(elastic|bounce|back|expo|circ|sine)\.(in|out|inOut)/.test(ease)) return true

  // Linear/none
  if (ease === 'none' || ease === 'linear') return true

  // CustomEase or other GSAP formats - we can't validate these,
  // so we allow them through
  return true
}

// ============================================================================
// Brand Motion Tokens (Alpine Noir)
// ============================================================================

/**
 * Alpine Noir brand motion tokens.
 * Machine/Documentary archetype - precise, camera-like motion.
 *
 * From: docs/Brand Physics Archtype.md
 */
export const BRAND = {
  /**
   * Lock-on easing - fast acquisition, smooth settle.
   * Like a gimbal finding and locking onto a subject.
   * Used for: elements entering frame, zoom-ins, content appearing.
   */
  lockOn: 'cubic-bezier(0.19, 1.0, 0.22, 1.0)',

  /**
   * Release easing - gentler departure, controlled fade.
   * Like a camera operator releasing a subject before the next shot.
   * Used for: elements exiting frame, zoom-outs, sections departing.
   */
  release: 'cubic-bezier(0.25, 0.0, 0.35, 1.0)',
} as const

/**
 * Brand duration tokens in seconds.
 * Tight tolerances - machines don't wander.
 */
export const DURATION = {
  /** Micro: 175ms - opacity changes, color shifts, small state changes */
  micro: 0.175,

  /** Standard: 315ms - most UI transitions, lens badge movement */
  standard: 0.315,

  /** Cinematic: 550ms - major transitions, portal zooms, full-frame reveals */
  cinematic: 0.55,
} as const

// ============================================================================
// Default Easing
// ============================================================================

/**
 * Default easing used when none is specified.
 * Uses easeOut (power2.out) as it's the most natural for UI animations.
 */
export const DEFAULT_EASE: Ease = 'easeOut'
