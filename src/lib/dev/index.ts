/**
 * Developer Tools
 *
 * Debugging, validation, and HMR utilities for development.
 * These are tree-shaken in production builds when not imported.
 *
 * @packageDocumentation
 */

// ============================================================================
// Debugger Component
// ============================================================================

export { default as Debugger } from './Debugger.svelte'
export type { DebuggerPosition, DebuggerProps } from './Debugger.svelte'

// ============================================================================
// Validation
// ============================================================================

export {
  validateConfig,
  validateSection,
  formatValidationErrors,
  validateAndLog,
  type ValidationError,
  type ValidationResult,
} from './validation'

// ============================================================================
// HMR Utilities
// ============================================================================

export {
  saveHMRState,
  loadHMRState,
  clearHMRState,
  createHMRHandler,
  setupViteHMR,
  observeScrollForHMR,
  type HMRState,
  type HMROptions,
} from './hmr'
