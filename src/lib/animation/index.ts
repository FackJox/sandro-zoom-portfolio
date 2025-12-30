/**
 * Animation System
 *
 * Composable animation primitives based on motion.zajno.com,
 * plus easing utilities and GSAP escape hatches.
 *
 * @packageDocumentation
 */

// ============================================================================
// Easing
// ============================================================================

export {
  EASE,
  POWER,
  ELASTIC,
  BOUNCE,
  BACK,
  resolveEase,
  isValidEase,
  DEFAULT_EASE,
} from './easing'

// ============================================================================
// All Primitives (re-exported from primitives/index.ts)
// ============================================================================

// Opacity
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
} from './primitives/fade'

// Position
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
} from './primitives/slide'

// Scale/Zoom
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
} from './primitives/zoom'

// Parallax
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
} from './primitives/parallax'

// Dimension/Depth
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
} from './primitives/dimension'

// Morph/Draw
export {
  morph,
  drawPath,
  motionPath as morphMotionPath, // Renamed to avoid conflict with gsap-passthrough
  strokeDashDraw,
  strokeDashErase,
  morphToShape,
  SHAPES,
  type MorphConfig,
  type DrawPathConfig,
  type MotionPathConfig,
} from './primitives/morph'

// Mask
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
} from './primitives/mask'

// Stagger
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
} from './primitives/stagger'

// Follow-Through/Physics
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
} from './primitives/follow-through'

// Transform
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
} from './primitives/transform'

// ============================================================================
// Composer
// ============================================================================

export {
  combined,
  sequence,
  parallel,
  transform as composeTransform, // Renamed to avoid conflict with primitives/transform
  withOrigin,
  keyframes,
  loop,
  reverse,
  scaleDuration,
  type CombinedConfig,
  type SequenceStep,
} from './composer'

// ============================================================================
// GSAP Passthrough
// ============================================================================

export {
  gsapRaw,
  gsapKeyframes,
  gsapTimelineConfig,
  motionPath,
  scrollTrigger,
  splitTextConfig,
  type RawGSAPConfig,
  type GSAPKeyframe,
  type GSAPTimelineConfig,
} from './gsap-passthrough'
