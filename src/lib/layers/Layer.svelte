<script lang="ts">
  /**
   * Layer Component
   *
   * Renders a single layer (image, video, or slot for canvas/custom content).
   * Applies z-index, position, size from config.
   * Includes data-layer attribute for GSAP targeting.
   */

  import { css } from '$styled/css'
  import type { LayerConfig } from '../types'
  import {
    getDefaultZIndex,
    resolveParallaxConfig,
    type LayerPositionStyles,
    type LayerSizeStyles,
  } from './types'
  import type { Snippet } from 'svelte'

  interface Props {
    /** Layer configuration */
    config: LayerConfig
    /** Custom content slot for canvas/custom layers */
    children?: Snippet
  }

  let { config, children }: Props = $props()

  // Compute z-index (use explicit z or infer from ID)
  const zIndex = $derived(config.z ?? getDefaultZIndex(config.id))

  // Resolve parallax config from shorthand or full config
  const parallaxConfig = $derived(
    resolveParallaxConfig(config.parallax, zIndex)
  )

  // Compute position styles
  const positionStyles = $derived((): LayerPositionStyles => {
    const styles: LayerPositionStyles = {
      position: 'absolute',
    }

    if (!config.position) {
      styles.top = '0'
      styles.left = '0'
      return styles
    }

    const pos = config.position

    // Vertical positioning
    if (pos.bottom) {
      styles.bottom = pos.y ?? '0'
    } else {
      styles.top = pos.y ?? '0'
    }

    // Horizontal positioning based on anchor
    switch (pos.anchor) {
      case 'center':
        styles.left = pos.x ?? '50%'
        styles.transform = 'translateX(-50%)'
        break
      case 'right':
        styles.right = pos.x ?? '0'
        break
      case 'left':
      default:
        styles.left = pos.x ?? '0'
        break
    }

    return styles
  })

  // Compute size styles
  const sizeStyles = $derived((): LayerSizeStyles => {
    return {
      width: config.size?.width ?? '100%',
      height: config.size?.height ?? '100%',
      objectFit: 'cover',
    }
  })

  // Compute initial transform (for scale)
  const initialTransform = $derived(() => {
    const scale = config.initialScale ?? 1
    const baseTransform = positionStyles().transform ?? ''

    if (scale === 1) {
      return baseTransform || undefined
    }

    const scaleTransform = `scale(${scale})`
    return baseTransform ? `${baseTransform} ${scaleTransform}` : scaleTransform
  })

  // Build inline style object
  const styleObject = $derived(() => {
    const pos = positionStyles()
    const size = sizeStyles()

    return {
      position: pos.position,
      top: pos.top,
      bottom: pos.bottom,
      left: pos.left,
      right: pos.right,
      width: size.width,
      height: size.height,
      zIndex: String(zIndex),
      opacity: String(config.initialOpacity ?? 1),
      transform: initialTransform(),
    }
  })

  // Convert style object to CSS string
  const styleString = $derived(() => {
    const obj = styleObject()
    return Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${kebabKey}: ${value}`
      })
      .join('; ')
  })

  // Build data attributes for GSAP targeting
  const dataAttributes = $derived(() => {
    const attrs: Record<string, string> = {
      'data-layer': config.id,
    }

    // Add parallax data if configured
    if (parallaxConfig) {
      attrs['data-parallax-speed'] = String(parallaxConfig.speed)
      attrs['data-parallax-axis'] = parallaxConfig.axis ?? 'y'
      attrs['data-parallax-trigger'] = parallaxConfig.trigger ?? 'scroll'
    }

    return attrs
  })

  // Determine if we should render an image, video, or custom content
  const isImage = $derived(
    config.src &&
      (config.src.endsWith('.png') ||
        config.src.endsWith('.jpg') ||
        config.src.endsWith('.jpeg') ||
        config.src.endsWith('.webp') ||
        config.src.endsWith('.gif') ||
        config.src.endsWith('.svg'))
  )

  const isVideo = $derived(
    config.src &&
      (config.src.endsWith('.mp4') ||
        config.src.endsWith('.webm') ||
        config.src.endsWith('.mov'))
  )

  // CSS class for layer wrapper (used when slot content is provided)
  const layerWrapperClass = css({
    position: 'absolute',
    overflow: 'hidden',
  })

  // CSS class for media elements
  const mediaClass = css({
    display: 'block',
    objectFit: 'cover',
  })
</script>

{#if isImage && config.src}
  <img
    src={config.src}
    alt={config.alt ?? ''}
    class={mediaClass}
    style={styleString()}
    {...dataAttributes()}
  />
{:else if isVideo && config.src}
  <video
    src={config.src}
    class={mediaClass}
    style={styleString()}
    autoplay
    muted
    loop
    playsinline
    {...dataAttributes()}
  >
    <track kind="captions" />
  </video>
{:else if children}
  <div
    class={layerWrapperClass}
    style={styleString()}
    {...dataAttributes()}
  >
    {@render children()}
  </div>
{:else if config.src}
  <!-- Fallback: treat as image -->
  <img
    src={config.src}
    alt={config.alt ?? ''}
    class={mediaClass}
    style={styleString()}
    {...dataAttributes()}
  />
{/if}
