/**
 * Frame Scaling System
 *
 * Handles reference frame scaling to fit various viewport sizes.
 * Supports cover, contain, and fill scaling modes with min/max constraints.
 *
 * @module core/frame
 */

import type { FrameConfig } from '../types'

/**
 * Check if we're in a browser environment.
 */
const isBrowser = typeof window !== 'undefined'

// ============================================================================
// Types
// ============================================================================

/**
 * Viewport dimensions.
 */
export interface Viewport {
  /** Viewport width in pixels */
  width: number
  /** Viewport height in pixels */
  height: number
}

/**
 * Frame transform result.
 */
export interface FrameTransform {
  /** Scale factor to apply */
  scale: number
  /** Horizontal offset in pixels */
  offsetX: number
  /** Vertical offset in pixels */
  offsetY: number
  /** Final frame width after scaling */
  width: number
  /** Final frame height after scaling */
  height: number
  /** Whether frame is clipped (cover mode) */
  isClipped: boolean
  /** Whether frame has letterboxing (contain mode) */
  isLetterboxed: boolean
}

/**
 * Scaling mode for frame fitting.
 */
export type ScalingMode = 'cover' | 'contain' | 'fill'

// ============================================================================
// Frame Transform Calculation
// ============================================================================

/**
 * Calculates the transform needed to fit a reference frame into a viewport.
 *
 * Scaling modes:
 * - `cover`: Scale to cover viewport (may crop edges)
 * - `contain`: Scale to fit inside viewport (may letterbox)
 * - `fill`: Stretch to fill viewport (ignores aspect ratio)
 *
 * @param reference - Reference frame dimensions
 * @param viewport - Current viewport dimensions
 * @param scaling - Scaling mode (default: 'cover')
 * @param minScale - Minimum scale factor (default: 0)
 * @param maxScale - Maximum scale factor (default: Infinity)
 * @returns Frame transform with scale and offset
 *
 * @example
 * ```ts
 * // Reference frame is 1920x1080, viewport is 1440x900
 * const transform = calculateFrameTransform(
 *   { width: 1920, height: 1080 },
 *   { width: 1440, height: 900 },
 *   'cover'
 * )
 *
 * // Apply to container:
 * // transform: scale(${transform.scale}) translate(${transform.offsetX}px, ${transform.offsetY}px)
 * ```
 */
export function calculateFrameTransform(
  reference: { width: number; height: number },
  viewport: Viewport,
  scaling: ScalingMode = 'cover',
  minScale = 0,
  maxScale = Infinity
): FrameTransform {
  const { width: refW, height: refH } = reference
  const { width: vpW, height: vpH } = viewport

  // Calculate aspect ratios
  const refAspect = refW / refH
  const vpAspect = vpW / vpH

  let scale: number
  let isClipped = false
  let isLetterboxed = false

  switch (scaling) {
    case 'cover':
      // Scale so frame covers viewport completely
      if (vpAspect > refAspect) {
        // Viewport is wider - scale based on width
        scale = vpW / refW
      } else {
        // Viewport is taller - scale based on height
        scale = vpH / refH
      }
      isClipped = true
      break

    case 'contain':
      // Scale so frame fits inside viewport
      if (vpAspect > refAspect) {
        // Viewport is wider - scale based on height
        scale = vpH / refH
      } else {
        // Viewport is taller - scale based on width
        scale = vpW / refW
      }
      isLetterboxed = true
      break

    case 'fill':
      // No uniform scaling needed for fill
      // Return special case with separate x/y scales
      return {
        scale: 1, // Not used directly for fill
        offsetX: 0,
        offsetY: 0,
        width: vpW,
        height: vpH,
        isClipped: false,
        isLetterboxed: false,
      }
  }

  // Apply min/max constraints
  const clampedScale = Math.max(minScale, Math.min(maxScale, scale))
  if (clampedScale !== scale) {
    scale = clampedScale
    // Update clipping/letterboxing flags based on clamped scale
    isClipped = scaling === 'cover' && scale > 0
    isLetterboxed = scaling === 'contain' && scale > 0
  }

  // Calculate final dimensions
  const finalW = refW * scale
  const finalH = refH * scale

  // Calculate centering offset
  const offsetX = (vpW - finalW) / 2
  const offsetY = (vpH - finalH) / 2

  return {
    scale,
    offsetX,
    offsetY,
    width: finalW,
    height: finalH,
    isClipped: isClipped && (finalW > vpW || finalH > vpH),
    isLetterboxed: isLetterboxed && (finalW < vpW || finalH < vpH),
  }
}

// ============================================================================
// Frame State (Svelte 5 Runes)
// ============================================================================

/**
 * Reactive frame state.
 */
export interface FrameState {
  /** Current transform */
  transform: FrameTransform
  /** Current viewport */
  viewport: Viewport
  /** Reference dimensions */
  reference: { width: number; height: number }
  /** Whether frame is ready */
  isReady: boolean
}

/**
 * Creates a reactive frame state store using Svelte 5 runes.
 * Automatically updates when viewport resizes.
 *
 * Must be called within a component context.
 *
 * @param config - Frame configuration
 * @returns Reactive frame state object
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createFrameState } from 'svelte-scrollytelling'
 *
 *   const frame = createFrameState({
 *     width: 1920,
 *     height: 1080,
 *     scaling: 'cover',
 *     minScale: 0.5,
 *     maxScale: 1.5
 *   })
 *
 *   $effect(() => {
 *     console.log('Scale:', frame.transform.scale)
 *   })
 * </script>
 *
 * <div style:transform="scale({frame.transform.scale})">
 *   <!-- Content -->
 * </div>
 * ```
 */
export function createFrameState(config: FrameConfig): FrameState {
  const reference = { width: config.width, height: config.height }
  const scaling = config.scaling
  const minScale = config.minScale ?? 0.5
  const maxScale = config.maxScale ?? 1.5

  // Initialize viewport
  let viewport = $state<Viewport>(
    isBrowser ? { width: window.innerWidth, height: window.innerHeight } : { width: 1920, height: 1080 }
  )

  // Calculate initial transform
  let transform = $state<FrameTransform>(calculateFrameTransform(reference, viewport, scaling, minScale, maxScale))

  let isReady = $state(false)

  // Set up resize observer in browser
  if (isBrowser) {
    const updateViewport = () => {
      viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      transform = calculateFrameTransform(reference, viewport, scaling, minScale, maxScale)
    }

    // Use ResizeObserver for more accurate viewport tracking
    const resizeObserver = new ResizeObserver(() => {
      updateViewport()
    })

    // Observe document body
    resizeObserver.observe(document.body)

    // Also listen for window resize as fallback
    window.addEventListener('resize', updateViewport)

    // Initial update
    updateViewport()
    isReady = true

    // Note: Cleanup should be handled by the calling component
  }

  return {
    get transform() {
      return transform
    },
    get viewport() {
      return viewport
    },
    get reference() {
      return reference
    },
    get isReady() {
      return isReady
    },
  }
}

// ============================================================================
// CSS Transform Utilities
// ============================================================================

/**
 * Generates CSS transform string from frame transform.
 *
 * @param transform - Frame transform
 * @param includeOffset - Include translate offset (default: true)
 * @returns CSS transform string
 *
 * @example
 * ```ts
 * const css = getTransformCSS(transform)
 * // 'scale(0.75) translate(120px, 0px)'
 * ```
 */
export function getTransformCSS(transform: FrameTransform, includeOffset = true): string {
  const parts: string[] = []

  if (transform.scale !== 1) {
    parts.push(`scale(${transform.scale})`)
  }

  if (includeOffset && (transform.offsetX !== 0 || transform.offsetY !== 0)) {
    // Use translate with scaled offsets
    const x = transform.offsetX / transform.scale
    const y = transform.offsetY / transform.scale
    parts.push(`translate(${x}px, ${y}px)`)
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
}

/**
 * Generates CSS style object for frame container.
 *
 * @param transform - Frame transform
 * @param reference - Reference dimensions
 * @returns CSS style object
 *
 * @example
 * ```ts
 * const styles = getFrameStyles(transform, { width: 1920, height: 1080 })
 * // { width: '1920px', height: '1080px', transform: 'scale(0.75) translate(...)', ... }
 * ```
 */
export function getFrameStyles(
  transform: FrameTransform,
  reference: { width: number; height: number }
): Record<string, string> {
  return {
    width: `${reference.width}px`,
    height: `${reference.height}px`,
    transform: getTransformCSS(transform),
    transformOrigin: 'top left',
    position: 'absolute',
    top: '0',
    left: '0',
  }
}

// ============================================================================
// Viewport Utilities
// ============================================================================

/**
 * Get current viewport dimensions.
 *
 * @returns Viewport dimensions
 */
export function getViewport(): Viewport {
  if (!isBrowser) {
    return { width: 1920, height: 1080 }
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

/**
 * Get viewport aspect ratio.
 *
 * @returns Aspect ratio (width / height)
 */
export function getViewportAspect(): number {
  const viewport = getViewport()
  return viewport.width / viewport.height
}

/**
 * Check if viewport is in portrait orientation.
 *
 * @returns True if portrait
 */
export function isPortrait(): boolean {
  const viewport = getViewport()
  return viewport.height > viewport.width
}

/**
 * Check if viewport is in landscape orientation.
 *
 * @returns True if landscape
 */
export function isLandscape(): boolean {
  const viewport = getViewport()
  return viewport.width >= viewport.height
}

// ============================================================================
// Coordinate Mapping
// ============================================================================

/**
 * Maps a point from reference coordinates to viewport coordinates.
 *
 * @param point - Point in reference coordinates
 * @param transform - Current frame transform
 * @returns Point in viewport coordinates
 *
 * @example
 * ```ts
 * // Element at (960, 540) in 1920x1080 reference
 * const screenPos = mapToViewport({ x: 960, y: 540 }, transform)
 * // Returns actual screen position after scaling/offset
 * ```
 */
export function mapToViewport(point: { x: number; y: number }, transform: FrameTransform): { x: number; y: number } {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  }
}

/**
 * Maps a point from viewport coordinates to reference coordinates.
 *
 * @param point - Point in viewport coordinates
 * @param transform - Current frame transform
 * @returns Point in reference coordinates
 *
 * @example
 * ```ts
 * // Click at (720, 405) on screen
 * const refPos = mapToReference({ x: 720, y: 405 }, transform)
 * // Returns position in 1920x1080 reference space
 * ```
 */
export function mapToReference(point: { x: number; y: number }, transform: FrameTransform): { x: number; y: number } {
  return {
    x: (point.x - transform.offsetX) / transform.scale,
    y: (point.y - transform.offsetY) / transform.scale,
  }
}

/**
 * Checks if a reference point is visible within the viewport.
 *
 * @param point - Point in reference coordinates
 * @param transform - Current frame transform
 * @param viewport - Current viewport
 * @param margin - Optional margin around viewport (default: 0)
 * @returns True if point is visible
 */
export function isPointVisible(
  point: { x: number; y: number },
  transform: FrameTransform,
  viewport: Viewport,
  margin = 0
): boolean {
  const screenPos = mapToViewport(point, transform)

  return (
    screenPos.x >= -margin &&
    screenPos.x <= viewport.width + margin &&
    screenPos.y >= -margin &&
    screenPos.y <= viewport.height + margin
  )
}
