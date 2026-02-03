/**
 * Content System
 *
 * Exports for managing content components within sections.
 */

// ============================================================================
// Components
// ============================================================================

export { default as Content } from './Content.svelte'
export { default as ContentSlot } from './ContentSlot.svelte'
export { default as ContentContainer } from './ContentContainer.svelte'

// ============================================================================
// Scroll State
// ============================================================================

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
} from './scroll-state'
