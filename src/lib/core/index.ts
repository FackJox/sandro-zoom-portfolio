/**
 * Core Module
 *
 * Re-exports all core functionality for the scrollytelling framework.
 *
 * @module core
 */

// ============================================================================
// GSAP
// ============================================================================

export { registerGSAP, isGSAPRegistered, gsap, ScrollTrigger } from './gsap'

// ============================================================================
// Timeline
// ============================================================================

export {
  // State
  createTimelineState,
  // Time/Scroll conversion
  timeToScroll,
  scrollToTime,
  calculateScrollDistance,
  // Master timeline
  createMasterTimeline,
  // Section helpers
  calculateSectionBoundaries,
  getSectionAtTime,
  // Types
  type MasterTimelineConfig,
  type MasterTimeline,
} from './timeline.svelte'

// ============================================================================
// Scroll
// ============================================================================

export {
  // State
  createScrollState,
  // Observer
  createScrollObserver,
  // ScrollSmoother (stub)
  createScrollSmoother,
  // Section boundaries
  calculateSectionScrollBoundaries,
  getCurrentSection,
  // Cleanup
  killAllScrollTriggers,
  refreshScrollTriggers,
  // Types
  type ScrollDirection,
  type ScrollStateStore,
  type ScrollObserverConfig,
  type ScrollObserver,
  type ScrollSmootherOptions,
  type ScrollSmootherInstance,
  type SectionBoundary,
} from './scroll.svelte'

// ============================================================================
// Experience
// ============================================================================

export {
  // Detection
  detectExperience,
  detectCapabilities,
  detectGPU,
  detectMemory,
  detectConnection,
  detectReducedMotion,
  // State
  createExperienceState,
  // Media queries
  createMediaQueryMatcher,
  matchMedia,
  mediaQueries,
  DEFAULT_EXPERIENCE_QUERIES,
  // Types
  type GPUTier,
  type ExperienceState,
} from './experience.svelte'

// ============================================================================
// Frame
// ============================================================================

export {
  // Transform calculation
  calculateFrameTransform,
  // State
  createFrameState,
  // CSS utilities
  getTransformCSS,
  getFrameStyles,
  // Viewport utilities
  getViewport,
  getViewportAspect,
  isPortrait,
  isLandscape,
  // Coordinate mapping
  mapToViewport,
  mapToReference,
  isPointVisible,
  // Types
  type Viewport,
  type FrameTransform,
  type ScalingMode,
  type FrameState,
} from './frame.svelte'
