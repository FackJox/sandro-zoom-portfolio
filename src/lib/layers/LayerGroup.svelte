<script lang="ts">
  /**
   * LayerGroup Component
   *
   * Wrapper div for grouped layers that move together.
   * Includes data-layer-group attribute for GSAP targeting.
   * Children layers maintain relative z-index within the group.
   */

  import { css } from '$styled/css'
  import type { LayerGroupConfig } from '../types'
  import { getDefaultZIndex, resolveParallaxConfig } from './types'
  import Layer from './Layer.svelte'

  interface Props {
    /** Layer group configuration */
    config: LayerGroupConfig
  }

  let { config }: Props = $props()

  // Compute group z-index (use explicit z or infer from ID)
  const groupZIndex = $derived(config.z ?? getDefaultZIndex(config.id))

  // Resolve parallax config for the group (applies to all children)
  const parallaxConfig = $derived(
    resolveParallaxConfig(config.parallax, groupZIndex)
  )

  // Build group position styles
  const groupPositionStyles = $derived(() => {
    const styles: Record<string, string> = {
      position: 'absolute',
      top: '0',
      left: '0',
      width: config.size?.width ?? '100%',
      height: config.size?.height ?? '100%',
      zIndex: String(groupZIndex),
    }

    // Apply initial opacity if set
    if (config.initialOpacity !== undefined) {
      styles.opacity = String(config.initialOpacity)
    }

    // Apply initial scale if set
    if (config.initialScale !== undefined && config.initialScale !== 1) {
      styles.transform = `scale(${config.initialScale})`
    }

    return styles
  })

  // Convert style object to CSS string
  const styleString = $derived(() => {
    const obj = groupPositionStyles()
    return Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${kebabKey}: ${value}`
      })
      .join('; ')
  })

  // Build data attributes for GSAP targeting
  const dataAttributes = $derived(() => {
    const attrs: Record<string, string> = {
      'data-layer-group': config.id,
    }

    // Add parallax data if configured
    if (parallaxConfig) {
      attrs['data-parallax-speed'] = String(parallaxConfig.speed)
      attrs['data-parallax-axis'] = parallaxConfig.axis ?? 'y'
      attrs['data-parallax-trigger'] = parallaxConfig.trigger ?? 'scroll'
    }

    return attrs
  })

  // Sort children by z-index for proper stacking
  const sortedChildren = $derived(
    [...(config.children ?? [])].sort((a, b) => {
      const aZ = a.z ?? getDefaultZIndex(a.id)
      const bZ = b.z ?? getDefaultZIndex(b.id)
      return aZ - bZ
    })
  )

  // Group container class
  const groupClass = css({
    position: 'absolute',
    overflow: 'hidden',
  })
</script>

<div
  class={groupClass}
  style={styleString()}
  {...dataAttributes()}
>
  {#each sortedChildren as layerConfig (layerConfig.id)}
    <Layer config={layerConfig} />
  {/each}
</div>
