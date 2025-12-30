/**
 * svelte-scrollytelling
 *
 * A general-purpose SvelteKit + GSAP scrollytelling boilerplate.
 *
 * @packageDocumentation
 */

// ============================================================================
// Core
// ============================================================================

export { registerGSAP, gsap, ScrollTrigger } from './core/gsap'

// Timeline
export {
  createTimelineState,
  timeToScroll,
  scrollToTime,
  calculateScrollDistance,
  createMasterTimeline,
  calculateSectionBoundaries,
  getSectionAtTime,
  type MasterTimelineConfig,
  type MasterTimeline,
} from './core/timeline.svelte'

// Scroll
export {
  createScrollState as createScrollStateStore,
  createScrollObserver,
  createScrollSmoother,
  calculateSectionScrollBoundaries,
  getCurrentSection,
  killAllScrollTriggers,
  refreshScrollTriggers,
  type ScrollDirection,
  type ScrollStateStore,
  type ScrollObserverConfig,
  type ScrollObserver,
  type ScrollSmootherOptions,
  type ScrollSmootherInstance,
  type SectionBoundary,
} from './core/scroll.svelte'

// Experience
export {
  detectExperience,
  detectCapabilities,
  detectGPU,
  detectMemory,
  detectConnection,
  detectReducedMotion,
  createExperienceState,
  createMediaQueryMatcher,
  matchMedia,
  mediaQueries,
  DEFAULT_EXPERIENCE_QUERIES,
  type GPUTier,
  type ExperienceState,
} from './core/experience.svelte'

// Frame
export {
  calculateFrameTransform,
  createFrameState,
  getTransformCSS,
  getFrameStyles,
  getViewport,
  getViewportAspect,
  isPortrait,
  isLandscape,
  mapToViewport,
  mapToReference,
  isPointVisible,
  type Viewport,
  type FrameTransform,
  type ScalingMode,
  type FrameState,
} from './core/frame.svelte'

// ============================================================================
// Components
// ============================================================================

export { default as ScrollContainer } from './components/ScrollContainer.svelte'
export { default as Stage } from './components/Stage.svelte'
export { default as Section } from './components/Section.svelte'
export type { ScrollContainerProps, StageProps, SectionProps } from './components'

// ============================================================================
// Layers
// ============================================================================

export { default as Layer } from './layers/Layer.svelte'
export { default as LayerGroup } from './layers/LayerGroup.svelte'
export { default as LayerStack } from './layers/LayerStack.svelte'
export {
  // Layer utilities
  isStandardLayerId,
  getDefaultZIndex,
  zToParallaxSpeed,
  resolveParallaxConfig,
  resolveLayerConfig,
  // Layer-specific types
  type StandardLayerId,
  type ResolvedLayerConfig,
  type LayerPositionStyles,
  type LayerSizeStyles,
} from './layers/types'

// ============================================================================
// Content
// ============================================================================

export { default as Content } from './content/Content.svelte'
export { default as ContentSlot } from './content/ContentSlot.svelte'
export { default as ContentContainer } from './content/ContentContainer.svelte'
export {
  // Context functions
  createScrollStateContext,
  getScrollState,
  getScrollStateRequired,
  // Progress helpers
  calculateContentProgress,
  isContentVisible,
  // State creation
  createScrollState,
  createInitialScrollState,
  // Derivation helpers
  deriveSectionProgress,
  deriveScrollDirection,
  calculateScrollVelocity,
} from './content/scroll-state'

// ============================================================================
// Animation Primitives
// ============================================================================

export {
  // Easing
  EASE,
  POWER,
  ELASTIC,
  BOUNCE,
  BACK,
  resolveEase,
  isValidEase,
  DEFAULT_EASE,
  // Fade
  fadeIn,
  fadeOut,
  crossfade,
  applyCrossfade,
  fadePulse,
  // Slide
  slideIn,
  slideOut,
  pan,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  // Zoom/Scale
  zoom,
  scale,
  zoomIn,
  zoomOut,
  kenBurns,
  dramaticZoom,
  // Parallax
  parallax,
  scrollParallax,
  mouseParallax,
  mouseParallaxTween,
  layerParallax,
  createLayerParallax,
  calculateZSpeed,
  // Dimension/Depth
  dimension,
  recede,
  approach,
  depthTransition,
  toDepth,
  DEPTH,
  // Morph/Draw
  morph,
  drawPath,
  morphMotionPath,
  strokeDashDraw,
  strokeDashErase,
  morphToShape,
  SHAPES,
  // Mask
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
  // Stagger
  stagger,
  staggerFadeIn,
  staggerFadeOut,
  staggerSlideIn,
  staggerScale,
  wave,
  calculateStaggerTiming,
  // Follow-through/Physics
  followThrough,
  elasticSettle,
  bounceSettle,
  overshoot,
  anticipate,
  spring,
  momentum,
  squashAndStretch,
  shake,
  // Transform
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
  // Composer
  combined,
  sequence,
  parallel,
  composeTransform,
  withOrigin,
  keyframes,
  loop,
  reverse,
  scaleDuration,
  // GSAP Passthrough
  gsapRaw,
  gsapKeyframes,
  gsapTimelineConfig,
  motionPath,
  scrollTrigger,
  splitTextConfig,
} from './animation'

// ============================================================================
// Responsive
// ============================================================================

export {
  // Position resolution
  resolvePosition,
  getPositionStyles,
  getPositionStyleString,
  resolvedToPercentages,
  createPositionFromPercentages,
  interpolatePositions,
  positionsEqual,
  getAnchorTransform,
  // Presets
  presets,
  getPresetCoordinates,
  getPresetsByCategory,
  isValidPreset,
  getNearestPreset,
  calculateGoldenPositions,
  calculateThirdPositions,
  calculateFifthPositions,
  GOLDEN_RATIO,
  GOLDEN_MINOR,
  GOLDEN_MAJOR,
  THIRD,
  TWO_THIRDS,
  FIFTH,
  // Fluid sizing
  generateFluidScale,
  calculateScaleStep,
  generateTypeScale,
  generateSpaceScale,
  generateTypeCSSVariables,
  generateSpaceCSSVariables,
  generateFluidCSS,
  generateFluidCSSParts,
  getFluidValue,
  createCustomFluid,
  parseClampValue,
  getValueAtViewport,
  DEFAULT_TYPE_STEPS,
  DEFAULT_SPACE_STEPS,
  // Safe zones
  DEFAULT_SAFE_ZONES,
  detectDeviceType,
  experienceToDeviceType,
  getSafeZones,
  getParsedSafeZones,
  calculateSafeBounds,
  applySafeZones,
  removeSafeZones,
  isPointInSafeArea,
  clampToSafeArea,
  generateSafeZoneCSS,
  generateAllSafeZoneCSS,
  getSafeZoneStyles,
  // Regions
  parseToPercentage,
  parseSafeZones,
  getGridCellCoordinates,
  getGridCellCenter,
  getRegionCoordinates,
  getRegionCenter,
  isPointInRegion,
  getAllGridCells,
  GRID_CELL_TO_NAME,
  NAME_TO_GRID_CELL,
} from './responsive'

// ============================================================================
// Dev Tools
// ============================================================================

export { default as Debugger } from './dev/Debugger.svelte'
export type { DebuggerPosition, DebuggerProps } from './dev/Debugger.svelte'
export {
  validateConfig,
  validateSection,
  formatValidationErrors,
  validateAndLog,
  saveHMRState,
  loadHMRState,
  clearHMRState,
  createHMRHandler,
  setupViteHMR,
  observeScrollForHMR,
  type ValidationError,
  type ValidationResult,
  type HMRState,
  type HMROptions,
} from './dev'

// ============================================================================
// Types
// ============================================================================

export type {
  // Config
  ScrollytellingConfig,
  ExperiencesConfig,
  ExperienceConfig,
  FrameConfig,
  FluidConfig,
  FluidScaleConfig,
  SafeZonesConfig,
  SafeZoneInsets,
  CapabilitiesConfig,
  HMRConfig,
  // Section
  SectionConfig,
  // Layer
  LayerConfig,
  LayerGroupConfig,
  LayerPosition,
  LayerSize,
  // Content
  ContentConfig,
  // Position
  Position,
  Region,
  PositionPreset,
  // Animation
  AnimationConfig,
  AnimationAction,
  Ease,
  ParallaxConfig,
  // Scroll State
  ScrollState,
  // Capability
  Capabilities,
  ExperienceType,
} from './types'

export { LAYER_Z } from './types'
