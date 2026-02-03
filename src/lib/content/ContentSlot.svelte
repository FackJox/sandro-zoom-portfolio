<script lang="ts">
  /**
   * ContentSlot Component
   *
   * Positions content using the responsive positioning system.
   * Handles presets, explicit positions, anchor points, and pixel offsets.
   */

  import type { Snippet } from 'svelte'
  import type { Position, PositionPreset } from '../types'
  import { css } from '$styled/css'

  // ============================================================================
  // Types
  // ============================================================================

  interface Props {
    /** Position configuration */
    position: Position
    /** Content to render in this slot */
    children: Snippet
  }

  // ============================================================================
  // Props
  // ============================================================================

  let { position, children }: Props = $props()

  // ============================================================================
  // Position Preset Coordinates
  // ============================================================================

  /**
   * Position preset mappings to x/y percentages.
   * Based on golden ratio (38.2% / 61.8%) and rule of thirds (33.33% / 66.67%).
   */
  const PRESET_COORDINATES: Record<PositionPreset, { x: string; y: string }> = {
    // Golden ratio presets
    'golden-left': { x: '38.2%', y: '50%' },
    'golden-right': { x: '61.8%', y: '50%' },
    'golden-top': { x: '50%', y: '38.2%' },
    'golden-bottom': { x: '50%', y: '61.8%' },

    // Rule of thirds presets
    'third-left': { x: '33.33%', y: '50%' },
    'third-right': { x: '66.67%', y: '50%' },
    'third-top': { x: '50%', y: '33.33%' },
    'third-bottom': { x: '50%', y: '66.67%' },

    // Thirds intersection points (power points)
    'thirds-intersect-tl': { x: '33.33%', y: '33.33%' },
    'thirds-intersect-tr': { x: '66.67%', y: '33.33%' },
    'thirds-intersect-bl': { x: '33.33%', y: '66.67%' },
    'thirds-intersect-br': { x: '66.67%', y: '66.67%' },

    // Rule of fifths presets (20% intervals)
    'fifth-1': { x: '20%', y: '50%' },
    'fifth-2': { x: '40%', y: '50%' },
    'fifth-3': { x: '60%', y: '50%' },
    'fifth-4': { x: '80%', y: '50%' },

    // Center variants
    center: { x: '50%', y: '50%' },
    'center-left': { x: '25%', y: '50%' },
    'center-right': { x: '75%', y: '50%' },
    'center-top': { x: '50%', y: '25%' },
    'center-bottom': { x: '50%', y: '75%' },
  }

  /**
   * Region center coordinates for semantic regions.
   */
  const REGION_CENTERS: Record<string, { x: string; y: string }> = {
    'left-third': { x: '16.67%', y: '50%' },
    center: { x: '50%', y: '50%' },
    'right-third': { x: '83.33%', y: '50%' },
    'top-left': { x: '16.67%', y: '16.67%' },
    'top-center': { x: '50%', y: '16.67%' },
    'top-right': { x: '83.33%', y: '16.67%' },
    'center-left': { x: '16.67%', y: '50%' },
    'center-center': { x: '50%', y: '50%' },
    'center-right': { x: '83.33%', y: '50%' },
    'bottom-left': { x: '16.67%', y: '83.33%' },
    'bottom-center': { x: '50%', y: '83.33%' },
    'bottom-right': { x: '83.33%', y: '83.33%' },
  }

  // ============================================================================
  // Position Resolution
  // ============================================================================

  /**
   * Resolve position to CSS x/y coordinates.
   */
  function resolvePosition(pos: Position): { x: string; y: string } {
    // 1. Explicit x/y takes precedence
    if (pos.x !== undefined && pos.y !== undefined) {
      return { x: pos.x, y: pos.y }
    }

    // 2. Named preset
    if (pos.preset) {
      const presetCoords = PRESET_COORDINATES[pos.preset]
      if (presetCoords) {
        return { ...presetCoords }
      }
    }

    // 3. Semantic region with alignment
    if (pos.region) {
      const regionCenter = REGION_CENTERS[pos.region]
      if (regionCenter) {
        // Apply vertical alignment adjustment
        let y = regionCenter.y
        if (pos.vAlign === 'top') {
          y = adjustY(regionCenter.y, -16.67) // Move up by third
        } else if (pos.vAlign === 'bottom') {
          y = adjustY(regionCenter.y, 16.67) // Move down by third
        }

        // Apply horizontal alignment adjustment
        let x = regionCenter.x
        if (pos.hAlign === 'left') {
          x = adjustX(regionCenter.x, -16.67) // Move left
        } else if (pos.hAlign === 'right') {
          x = adjustX(regionCenter.x, 16.67) // Move right
        }

        return { x, y }
      }
    }

    // 4. Partial x or y with defaults
    return {
      x: pos.x ?? '50%',
      y: pos.y ?? '50%',
    }
  }

  /**
   * Adjust a percentage value by an offset.
   */
  function adjustX(base: string, offset: number): string {
    const value = parseFloat(base)
    return `${Math.max(0, Math.min(100, value + offset))}%`
  }

  function adjustY(base: string, offset: number): string {
    const value = parseFloat(base)
    return `${Math.max(0, Math.min(100, value + offset))}%`
  }

  /**
   * Get CSS transform for anchor point.
   */
  function getAnchorTransform(anchor: Position['anchor']): string {
    switch (anchor) {
      case 'top-left':
        return 'translate(0, 0)'
      case 'top-right':
        return 'translate(-100%, 0)'
      case 'bottom-left':
        return 'translate(0, -100%)'
      case 'bottom-right':
        return 'translate(-100%, -100%)'
      case 'center':
      default:
        return 'translate(-50%, -50%)'
    }
  }

  // ============================================================================
  // Derived Values
  // ============================================================================

  const resolved = $derived(resolvePosition(position))
  const anchorTransform = $derived(getAnchorTransform(position.anchor))

  // Build offset string
  const offsetX = $derived(position.offset?.x ?? 0)
  const offsetY = $derived(position.offset?.y ?? 0)

  // Combine anchor transform with offset
  const fullTransform = $derived(
    offsetX !== 0 || offsetY !== 0
      ? `${anchorTransform} translate(${offsetX}px, ${offsetY}px)`
      : anchorTransform
  )

  // ============================================================================
  // Styles
  // ============================================================================

  const slotStyles = css({
    position: 'absolute',
    // IMPORTANT: fit-content ensures proper sizing for transform calculations
    // Without this, percentage-based transforms may calculate on wrong dimensions
    width: 'fit-content',
    height: 'fit-content',
    // Prevent content from affecting layout
    pointerEvents: 'auto',
    // DEBUG: visible border to see positioning
    border: '2px solid red',
  })

  // DEBUG: Log resolved position
  $effect(() => {
    console.log('[ContentSlot] position', {
      preset: position.preset,
      region: position.region,
      inputX: position.x,
      inputY: position.y,
      resolvedX: resolved.x,
      resolvedY: resolved.y,
      anchor: position.anchor,
      transform: fullTransform,
    })
  })
</script>

<div
  class={slotStyles}
  style:left={resolved.x}
  style:top={resolved.y}
  style:transform={fullTransform}
  data-content-slot
>
  {@render children()}
</div>
