/**
 * Position Presets
 *
 * Named position presets based on design fundamentals:
 * - Golden Ratio (1:1.618)
 * - Rule of Thirds
 * - Rule of Fifths
 * - Center variants
 *
 * All coordinates are percentages (0-100).
 */

import type { PositionPreset } from '../types'

// ============================================================================
// Types
// ============================================================================

/**
 * Preset coordinates as percentages.
 */
export interface PresetCoordinates {
  /** X position as percentage (0-100) */
  x: number
  /** Y position as percentage (0-100) */
  y: number
}

/**
 * Preset definition with metadata.
 */
export interface PresetDefinition {
  /** X position as percentage */
  x: number
  /** Y position as percentage */
  y: number
  /** Human-readable description */
  description: string
  /** Category for grouping */
  category: 'golden' | 'thirds' | 'fifths' | 'center'
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Golden ratio value (phi).
 */
export const GOLDEN_RATIO = 1.618033988749895

/**
 * Golden ratio as percentage from start (38.2%).
 */
export const GOLDEN_MINOR = (1 / GOLDEN_RATIO) * 100 // ~38.2%

/**
 * Golden ratio as percentage from end (61.8%).
 */
export const GOLDEN_MAJOR = 100 - GOLDEN_MINOR // ~61.8%

/**
 * Third positions (33.33%, 66.67%).
 */
export const THIRD = 100 / 3 // ~33.33%
export const TWO_THIRDS = (100 * 2) / 3 // ~66.67%

/**
 * Fifth positions (20%, 40%, 60%, 80%).
 */
export const FIFTH = 20
export const TWO_FIFTHS = 40
export const THREE_FIFTHS = 60
export const FOUR_FIFTHS = 80

// ============================================================================
// Preset Definitions
// ============================================================================

/**
 * All position preset definitions with metadata.
 */
export const presets: Record<PositionPreset, PresetDefinition> = {
  // Golden ratio presets
  'golden-left': {
    x: GOLDEN_MINOR,
    y: 50,
    description: 'Golden ratio from left edge (38.2%)',
    category: 'golden',
  },
  'golden-right': {
    x: GOLDEN_MAJOR,
    y: 50,
    description: 'Golden ratio from right edge (61.8%)',
    category: 'golden',
  },
  'golden-top': {
    x: 50,
    y: GOLDEN_MINOR,
    description: 'Golden ratio from top edge (38.2%)',
    category: 'golden',
  },
  'golden-bottom': {
    x: 50,
    y: GOLDEN_MAJOR,
    description: 'Golden ratio from bottom edge (61.8%)',
    category: 'golden',
  },

  // Rule of thirds - lines
  'third-left': {
    x: THIRD,
    y: 50,
    description: 'Left third line (33.3%)',
    category: 'thirds',
  },
  'third-right': {
    x: TWO_THIRDS,
    y: 50,
    description: 'Right third line (66.7%)',
    category: 'thirds',
  },
  'third-top': {
    x: 50,
    y: THIRD,
    description: 'Top third line (33.3%)',
    category: 'thirds',
  },
  'third-bottom': {
    x: 50,
    y: TWO_THIRDS,
    description: 'Bottom third line (66.7%)',
    category: 'thirds',
  },

  // Rule of thirds - power points (intersections)
  'thirds-intersect-tl': {
    x: THIRD,
    y: THIRD,
    description: 'Top-left power point (rule of thirds intersection)',
    category: 'thirds',
  },
  'thirds-intersect-tr': {
    x: TWO_THIRDS,
    y: THIRD,
    description: 'Top-right power point (rule of thirds intersection)',
    category: 'thirds',
  },
  'thirds-intersect-bl': {
    x: THIRD,
    y: TWO_THIRDS,
    description: 'Bottom-left power point (rule of thirds intersection)',
    category: 'thirds',
  },
  'thirds-intersect-br': {
    x: TWO_THIRDS,
    y: TWO_THIRDS,
    description: 'Bottom-right power point (rule of thirds intersection)',
    category: 'thirds',
  },

  // Rule of fifths
  'fifth-1': {
    x: FIFTH,
    y: 50,
    description: 'First fifth line (20%)',
    category: 'fifths',
  },
  'fifth-2': {
    x: TWO_FIFTHS,
    y: 50,
    description: 'Second fifth line (40%)',
    category: 'fifths',
  },
  'fifth-3': {
    x: THREE_FIFTHS,
    y: 50,
    description: 'Third fifth line (60%)',
    category: 'fifths',
  },
  'fifth-4': {
    x: FOUR_FIFTHS,
    y: 50,
    description: 'Fourth fifth line (80%)',
    category: 'fifths',
  },

  // Center variants
  center: {
    x: 50,
    y: 50,
    description: 'Dead center',
    category: 'center',
  },
  'center-left': {
    x: 25,
    y: 50,
    description: 'Left of center (25%)',
    category: 'center',
  },
  'center-right': {
    x: 75,
    y: 50,
    description: 'Right of center (75%)',
    category: 'center',
  },
  'center-top': {
    x: 50,
    y: 25,
    description: 'Above center (25%)',
    category: 'center',
  },
  'center-bottom': {
    x: 50,
    y: 75,
    description: 'Below center (75%)',
    category: 'center',
  },
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Get coordinates for a named preset.
 *
 * @param preset - Preset name
 * @param frameSize - Frame dimensions (optional, for future use)
 * @returns Coordinates as percentages
 */
export function getPresetCoordinates(
  preset: PositionPreset,
  frameSize?: { width: number; height: number }
): PresetCoordinates {
  const definition = presets[preset]
  if (!definition) {
    // Fallback to center for unknown presets
    return { x: 50, y: 50 }
  }
  return { x: definition.x, y: definition.y }
}

/**
 * Get all presets in a specific category.
 *
 * @param category - Category to filter by
 * @returns Map of preset name to definition
 */
export function getPresetsByCategory(
  category: PresetDefinition['category']
): Map<PositionPreset, PresetDefinition> {
  const result = new Map<PositionPreset, PresetDefinition>()
  for (const [name, def] of Object.entries(presets)) {
    if (def.category === category) {
      result.set(name as PositionPreset, def)
    }
  }
  return result
}

/**
 * Check if a preset name is valid.
 *
 * @param name - Preset name to check
 * @returns True if valid
 */
export function isValidPreset(name: string): name is PositionPreset {
  return name in presets
}

/**
 * Get the nearest preset to a given point.
 *
 * @param point - Point coordinates as percentages
 * @returns Nearest preset name and distance
 */
export function getNearestPreset(point: { x: number; y: number }): { preset: PositionPreset; distance: number } {
  let nearest: PositionPreset = 'center'
  let minDistance = Infinity

  for (const [name, def] of Object.entries(presets)) {
    const dx = point.x - def.x
    const dy = point.y - def.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      minDistance = distance
      nearest = name as PositionPreset
    }
  }

  return { preset: nearest, distance: minDistance }
}

/**
 * Calculate golden ratio positions for a given dimension.
 * Useful for custom golden ratio calculations.
 *
 * @param dimension - Size in any unit
 * @returns Minor (38.2%) and major (61.8%) positions
 */
export function calculateGoldenPositions(dimension: number): { minor: number; major: number } {
  const minor = dimension / GOLDEN_RATIO
  const major = dimension - minor
  return { minor, major }
}

/**
 * Calculate third positions for a given dimension.
 *
 * @param dimension - Size in any unit
 * @returns First (33.3%) and second (66.7%) third positions
 */
export function calculateThirdPositions(dimension: number): { first: number; second: number } {
  return {
    first: dimension / 3,
    second: (dimension * 2) / 3,
  }
}

/**
 * Calculate fifth positions for a given dimension.
 *
 * @param dimension - Size in any unit
 * @returns All four fifth positions
 */
export function calculateFifthPositions(dimension: number): {
  first: number
  second: number
  third: number
  fourth: number
} {
  return {
    first: dimension * 0.2,
    second: dimension * 0.4,
    third: dimension * 0.6,
    fourth: dimension * 0.8,
  }
}
