/**
 * Layer System
 *
 * Components and utilities for the 3-tier layer system (BG/MG/FG).
 *
 * @example
 * ```svelte
 * <script>
 *   import { LayerStack, Layer, LayerGroup } from 'svelte-scrollytelling/layers'
 * </script>
 *
 * <LayerStack layers={sectionConfig.layers} />
 * ```
 */

// Components
export { default as Layer } from './Layer.svelte'
export { default as LayerGroup } from './LayerGroup.svelte'
export { default as LayerStack } from './LayerStack.svelte'

// Types and utilities
export {
  // Re-exported from main types
  type LayerConfig,
  type LayerGroupConfig,
  type LayerPosition,
  type LayerSize,
  type ParallaxConfig,
  LAYER_Z,
  // Layer-specific types
  type StandardLayerId,
  type ResolvedLayerConfig,
  type LayerPositionStyles,
  type LayerSizeStyles,
  // Utilities
  isStandardLayerId,
  getDefaultZIndex,
  zToParallaxSpeed,
  resolveParallaxConfig,
  resolveLayerConfig,
} from './types'
