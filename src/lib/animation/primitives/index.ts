/**
 * Animation Primitives
 *
 * Re-exports all animation primitives for convenient importing.
 *
 * @packageDocumentation
 */

// ============================================================================
// Opacity Primitives
// ============================================================================

export {
  fadeIn,
  fadeOut,
  crossfade,
  applyCrossfade,
  fadePulse,
  type FadeInConfig,
  type FadeOutConfig,
  type CrossfadeConfig,
  type GSAPTweenConfig,
} from './fade'

// ============================================================================
// Position Primitives
// ============================================================================

export {
  slideIn,
  slideOut,
  pan,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  type SlideDirection,
  type SlideInConfig,
  type SlideOutConfig,
  type PanConfig,
} from './slide'

// ============================================================================
// Scale Primitives
// ============================================================================

export {
  zoom,
  scale,
  zoomIn,
  zoomOut,
  kenBurns,
  dramaticZoom,
  type ZoomConfig,
  type ScaleConfig,
  type ZoomInConfig,
  type ZoomOutConfig,
} from './zoom'

// ============================================================================
// Parallax Primitives
// ============================================================================

export {
  parallax,
  scrollParallax,
  mouseParallax,
  mouseParallaxTween,
  layerParallax,
  createLayerParallax,
  calculateZSpeed,
  type ParallaxConfig,
  type ScrollParallaxConfig,
  type MouseParallaxConfig,
  type ZBasedParallaxConfig,
} from './parallax'

// ============================================================================
// Dimension Primitives
// ============================================================================

export {
  dimension,
  recede,
  approach,
  depthTransition,
  toDepth,
  DEPTH,
  type DimensionConfig,
  type RecedeConfig,
  type ApproachConfig,
  type DepthTransitionConfig,
} from './dimension'

// ============================================================================
// Morph Primitives
// ============================================================================

export {
  morph,
  drawPath,
  motionPath,
  strokeDashDraw,
  strokeDashErase,
  morphToShape,
  SHAPES,
  type MorphConfig,
  type DrawPathConfig,
  type MotionPathConfig,
} from './morph'

// ============================================================================
// Mask Primitives
// ============================================================================

export {
  mask,
  reveal,
  hide,
  circleReveal,
  circleHide,
  irisIn,
  irisOut,
  barnDoorOpen,
  barnDoorClose,
  venetianReveal,
  type MaskShape,
  type RevealDirection,
  type MaskConfig,
  type MaskContentConfig,
  type RevealConfig,
  type CircleRevealConfig,
} from './mask'

// ============================================================================
// Stagger Primitives
// ============================================================================

export {
  stagger,
  staggerFadeIn,
  staggerFadeOut,
  staggerSlideIn,
  staggerScale,
  wave,
  calculateStaggerTiming,
  type StaggerDirection,
  type StaggerConfig,
  type StaggerEffectConfig,
} from './stagger'

// ============================================================================
// Follow-Through Primitives
// ============================================================================

export {
  followThrough,
  elasticSettle,
  bounceSettle,
  overshoot,
  anticipate,
  spring,
  momentum,
  squashAndStretch,
  shake,
  type FollowThroughConfig,
  type SpringConfig,
  type InertiaConfig,
} from './follow-through'

// ============================================================================
// Transform Primitives
// ============================================================================

export {
  transform,
  rotate,
  skew,
  flip,
  scaleIn,
  scaleOut,
  rotateIn,
  rotateOut,
  spin,
  wobble,
  pulse,
  type TransformConfig,
  type RotateConfig,
  type SkewConfig,
  type FlipConfig,
} from './transform'

// ============================================================================
// Portal Transition Primitives
// ============================================================================

export {
  createPortalTransition,
  setupOutgoingScene,
  setupIncomingScene,
  type PortalTransitionConfig,
  type PortalTimeline,
} from './portal'
