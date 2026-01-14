/**
 * Transitions
 *
 * Scene transition system with exclusive routing and global state management.
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
  captureScene,
  mountCardFlipGrid,
  calculateGrid,
  getTargetTileSize,
  lockScroll,
  unlockScroll,
  type CardFlipTransitionConfig,
  type CardFlipGrid,
  type GridDimensions,
} from './card-flip'

export {
  initSceneState,
  resetSceneState,
  getSceneState,
  getActiveScene,
  isTransitioning,
  canTransitionForward,
  canTransitionBackward,
  startTransition,
  completeTransition,
  cancelTransition,
  setActiveScene,
} from './scene-state'
