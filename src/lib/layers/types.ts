/**
 * Layer System Types
 *
 * Re-exports layer types from the main type system and provides
 * layer-specific internal types and helpers.
 */

// Re-export all layer-related types from main types
export type {
  LayerConfig,
  LayerGroupConfig,
  LayerPosition,
  LayerSize,
  ParallaxConfig,
} from '../types'

export { LAYER_Z } from '../types'

// ============================================================================
// Layer ID Inference Helpers
// ============================================================================

/**
 * Standard layer IDs with known z-index mappings.
 */
export type StandardLayerId = 'bg' | 'mg' | 'fg'

/**
 * Type guard to check if a layer ID is a standard layer.
 */
export function isStandardLayerId(id: string): id is StandardLayerId {
  return id === 'bg' || id === 'mg' || id === 'fg'
}

/**
 * Get the default z-index for a layer based on its ID.
 * Standard layers (bg, mg, fg) get their known z-index values.
 * Custom layers default to 50 (midground level).
 */
export function getDefaultZIndex(id: string): number {
  switch (id) {
    case 'bg':
      return 0
    case 'mg':
      return 50
    case 'fg':
      return 100
    default:
      return 50
  }
}

// ============================================================================
// Parallax Helpers
// ============================================================================

/**
 * Calculate parallax speed from z-index.
 * Lower z = slower speed (further away), higher z = faster speed (closer).
 *
 * Speed formula: 0.6 + (z / 250)
 * - bg (z=0): 0.6x speed
 * - mg (z=50): 0.8x speed
 * - fg (z=100): 1.0x speed
 * - overlay (z=200): 1.4x speed
 */
export function zToParallaxSpeed(z: number): number {
  return 0.6 + z / 250
}

/**
 * Resolve parallax config from boolean shorthand or full config.
 * If true, calculates speed from z-index.
 * If object, returns as-is with defaults filled in.
 */
export function resolveParallaxConfig(
  parallax: boolean | import('../types').ParallaxConfig | undefined,
  zIndex: number
): import('../types').ParallaxConfig | undefined {
  if (parallax === undefined || parallax === false) {
    return undefined
  }

  if (parallax === true) {
    return {
      speed: zToParallaxSpeed(zIndex),
      axis: 'y',
      trigger: 'scroll',
    }
  }

  return {
    axis: 'y',
    trigger: 'scroll',
    ...parallax,
  }
}

// ============================================================================
// Internal Layer Types
// ============================================================================

/**
 * Resolved layer configuration with all computed values.
 */
export interface ResolvedLayerConfig {
  /** Layer ID */
  id: string
  /** Asset source (images/video) */
  src?: string
  /** Computed z-index */
  zIndex: number
  /** Alt text for accessibility */
  alt?: string
  /** Resolved position styles */
  positionStyles: LayerPositionStyles
  /** Resolved size styles */
  sizeStyles: LayerSizeStyles
  /** Initial opacity (0-1) */
  initialOpacity: number
  /** Initial scale */
  initialScale: number
  /** Resolved parallax config (if enabled) */
  parallax?: import('../types').ParallaxConfig
  /** Whether this is a group */
  isGroup: boolean
  /** Children (for groups) */
  children?: ResolvedLayerConfig[]
}

/**
 * Computed position styles for a layer.
 */
export interface LayerPositionStyles {
  position: 'absolute'
  top?: string
  bottom?: string
  left?: string
  right?: string
  transform?: string
}

/**
 * Computed size styles for a layer.
 */
export interface LayerSizeStyles {
  width: string
  height: string
  objectFit?: 'cover' | 'contain' | 'fill'
}

/**
 * Resolve a LayerConfig into computed styles and values.
 */
export function resolveLayerConfig(
  config: import('../types').LayerConfig
): ResolvedLayerConfig {
  const zIndex = config.z ?? getDefaultZIndex(config.id)

  return {
    id: config.id,
    src: config.src,
    zIndex,
    alt: config.alt ?? '',
    positionStyles: resolvePositionStyles(config.position),
    sizeStyles: resolveSizeStyles(config.size),
    initialOpacity: config.initialOpacity ?? 1,
    initialScale: config.initialScale ?? 1,
    parallax: resolveParallaxConfig(config.parallax, zIndex),
    isGroup: config.type === 'group',
    children: config.children?.map(resolveLayerConfig),
  }
}

/**
 * Resolve position config to CSS styles.
 */
function resolvePositionStyles(
  position: import('../types').LayerPosition | undefined
): LayerPositionStyles {
  const styles: LayerPositionStyles = {
    position: 'absolute',
  }

  if (!position) {
    // Default: fill container
    styles.top = '0'
    styles.left = '0'
    return styles
  }

  // Handle vertical positioning
  if (position.bottom) {
    styles.bottom = position.y ?? '0'
  } else {
    styles.top = position.y ?? '0'
  }

  // Handle horizontal positioning based on anchor
  switch (position.anchor) {
    case 'center':
      styles.left = position.x ?? '50%'
      styles.transform = 'translateX(-50%)'
      break
    case 'right':
      styles.right = position.x ?? '0'
      break
    case 'left':
    default:
      styles.left = position.x ?? '0'
      break
  }

  return styles
}

/**
 * Resolve size config to CSS styles.
 */
function resolveSizeStyles(
  size: import('../types').LayerSize | undefined
): LayerSizeStyles {
  return {
    width: size?.width ?? '100%',
    height: size?.height ?? '100%',
    objectFit: 'cover',
  }
}
