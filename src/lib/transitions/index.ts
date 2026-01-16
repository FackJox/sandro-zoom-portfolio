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
  executeCardFlipTransition,
  mountCardFlipGrid,
  calculateGrid,
  calculateScanDelays,
  getTargetTileSize,
  type CardFlipTransitionConfig,
  type ExecuteCardFlipConfig,
  type CardFlipGrid,
  type GridDimensions,
  type TileDelay,
} from './card-flip'

export {
  lockScroll,
  unlockScroll,
  isScrollLocked,
} from './scroll-lock'
