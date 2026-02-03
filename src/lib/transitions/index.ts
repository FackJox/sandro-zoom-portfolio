/**
 * Transitions
 *
 * Scene transition system with exclusive routing.
 */

export {
  getTransition,
  isCardFlipTransition,
  getDefaultPortalConfig,
  getDefaultCardFlipConfig,
  type TransitionType,
  type TransitionDefinition,
} from './router'

export {
  mountCardFlipGrid,
  calculateGrid,
  calculateScrubDelays,
  getTargetTileSize,
  prefersReducedMotion,
  type CardFlipTransitionConfig,
  type CardFlipGrid,
  type GridDimensions,
  type TileDelay,
} from './card-flip'

export {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from './scroll-lock'
