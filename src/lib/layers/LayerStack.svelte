<script lang="ts">
  /**
   * LayerStack Component
   *
   * Renders all layers from a section configuration.
   * Handles both flat layers and layer groups.
   * Sorts by z-index and applies absolute positioning within frame.
   * Assigns default z-index for standard layer IDs (bg, mg, fg).
   */

  import { css } from '$styled/css'
  import type { LayerConfig, LayerGroupConfig } from '../types'
  import { getDefaultZIndex } from './types'
  import Layer from './Layer.svelte'
  import LayerGroup from './LayerGroup.svelte'

  interface Props {
    /** Array of layer configurations */
    layers: LayerConfig[]
  }

  let { layers }: Props = $props()

  /**
   * Check if a layer config is a group.
   */
  function isLayerGroup(
    layer: LayerConfig
  ): layer is LayerGroupConfig {
    return layer.type === 'group' && Array.isArray(layer.children)
  }

  /**
   * Get effective z-index for sorting.
   */
  function getEffectiveZIndex(layer: LayerConfig): number {
    return layer.z ?? getDefaultZIndex(layer.id)
  }

  // Sort layers by z-index (lowest first for proper stacking)
  const sortedLayers = $derived(
    [...layers].sort((a, b) => {
      return getEffectiveZIndex(a) - getEffectiveZIndex(b)
    })
  )

  // Stack container styles
  const stackClass = css({
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    // Ensure children can be absolutely positioned
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'auto',
    },
  })
</script>

<div
  class={stackClass}
  data-layer-stack
>
  {#each sortedLayers as layerConfig (layerConfig.id)}
    {#if isLayerGroup(layerConfig)}
      <LayerGroup config={layerConfig} />
    {:else}
      <Layer config={layerConfig} />
    {/if}
  {/each}
</div>
