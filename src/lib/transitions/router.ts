/**
 * Transition Router
 *
 * Single source of truth for all scene transitions.
 * Ensures only ONE transition type executes per scene boundary.
 */

import type { PortalTransitionConfig } from '../animation/primitives/portal'
import type { CardFlipTransitionConfig } from './card-flip'

// ============================================================================
// Types
// ============================================================================

export type TransitionType = 'portal' | 'cardFlip' | 'none'

export interface TransitionDefinition {
  type: TransitionType
  config: PortalTransitionConfig | CardFlipTransitionConfig | Record<string, never>
}

export interface TransitionOverride {
  from: number
  to: number
  type: TransitionType
  config?: PortalTransitionConfig | CardFlipTransitionConfig
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_PORTAL_CONFIG: PortalTransitionConfig = {
  duration: 1.6,
  anchor: { x: '50%', y: '45%' },
  incomingScale: 2.0,
  outgoingScale: 0.3,
}

/**
 * Alpine Noir / Machine archetype config:
 * - Scan corruption pattern (row-by-row)
 * - 10% glitch tiles
 * - ease-lock-on (no bounce)
 * - 150px desktop / 100px mobile tiles
 */
const DEFAULT_CARD_FLIP_CONFIG: CardFlipTransitionConfig = {
  duration: 1.6,
  staggerDuration: 0.8,
  glitchProbability: 0.1,
  seed: 42,
}

// ============================================================================
// Transition Map
// ============================================================================

/**
 * Override specific transitions between scenes.
 * If a transition is not listed here, it defaults to 'portal'.
 */
const transitionOverrides: TransitionOverride[] = [
  // About (final beat) → Services uses card flip
  { from: 4, to: 5, type: 'cardFlip', config: DEFAULT_CARD_FLIP_CONFIG },
]

// ============================================================================
// Router Functions
// ============================================================================

/**
 * Get the transition definition for a scene boundary.
 *
 * @param from - Index of the outgoing scene
 * @param to - Index of the incoming scene
 * @returns The transition definition with type and config
 */
export function getTransition(from: number, to: number): TransitionDefinition {
  const override = transitionOverrides.find(
    (o) => o.from === from && o.to === to
  )

  if (override) {
    return {
      type: override.type,
      config: override.config ?? (override.type === 'cardFlip' ? DEFAULT_CARD_FLIP_CONFIG : DEFAULT_PORTAL_CONFIG),
    }
  }

  // Default to portal transition
  return {
    type: 'portal',
    config: DEFAULT_PORTAL_CONFIG,
  }
}

/**
 * Check if a specific transition is a card flip transition.
 */
export function isCardFlipTransition(from: number, to: number): boolean {
  return getTransition(from, to).type === 'cardFlip'
}

/**
 * Get the default portal config (for use in PortalContainer).
 */
export function getDefaultPortalConfig(): PortalTransitionConfig {
  return { ...DEFAULT_PORTAL_CONFIG }
}

/**
 * Get the default card flip config.
 */
export function getDefaultCardFlipConfig(): CardFlipTransitionConfig {
  return { ...DEFAULT_CARD_FLIP_CONFIG }
}
