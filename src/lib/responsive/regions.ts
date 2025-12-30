/**
 * Semantic Region System
 *
 * Defines named regions based on design fundamentals (rule of thirds grid).
 * All calculations are pure functions that return coordinates as percentages.
 *
 * Grid Layout (3x3):
 * ┌─────────────────────────────────────────────────────┐
 * │          │    1    │    2    │    3    │           │
 * │  safe    ├─────────┼─────────┼─────────┤   safe    │
 * │  zone    │    4    │    5    │    6    │   zone    │
 * │          ├─────────┼─────────┼─────────┤           │
 * │          │    7    │    8    │    9    │           │
 * └─────────────────────────────────────────────────────┘
 */

import type { Region, FrameConfig, SafeZoneInsets } from '../types'

// ============================================================================
// Types
// ============================================================================

/**
 * Coordinates as percentages (0-100).
 */
export interface RegionCoordinates {
  /** X position as percentage (0-100) */
  x: number
  /** Y position as percentage (0-100) */
  y: number
  /** Width as percentage (0-100) */
  width: number
  /** Height as percentage (0-100) */
  height: number
}

/**
 * Grid cell identifier (1-9).
 */
export type GridCell = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Grid cell name mapping.
 */
export type GridCellName =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center-center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/**
 * Parsed safe zone values in percentages.
 */
export interface ParsedSafeZones {
  top: number
  bottom: number
  left: number
  right: number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Map from grid cell number to region name.
 */
export const GRID_CELL_TO_NAME: Record<GridCell, GridCellName> = {
  1: 'top-left',
  2: 'top-center',
  3: 'top-right',
  4: 'center-left',
  5: 'center-center',
  6: 'center-right',
  7: 'bottom-left',
  8: 'bottom-center',
  9: 'bottom-right',
}

/**
 * Map from region name to grid cell number.
 */
export const NAME_TO_GRID_CELL: Record<GridCellName, GridCell> = {
  'top-left': 1,
  'top-center': 2,
  'top-right': 3,
  'center-left': 4,
  'center-center': 5,
  'center-right': 6,
  'bottom-left': 7,
  'bottom-center': 8,
  'bottom-right': 9,
}

/**
 * Third divisions (0%, 33.33%, 66.67%, 100%).
 */
const THIRD = 100 / 3
const TWO_THIRDS = (100 * 2) / 3

// ============================================================================
// Utilities
// ============================================================================

/**
 * Parse a CSS value (with units) into a percentage of the frame dimension.
 *
 * @param value - CSS value like '16px', '10%', 'env(safe-area-inset-top, 44px)'
 * @param frameDimension - Frame dimension in pixels for px conversion
 * @returns Value as percentage (0-100)
 */
export function parseToPercentage(value: string, frameDimension: number): number {
  // Handle percentage values directly
  if (value.endsWith('%')) {
    return parseFloat(value)
  }

  // Handle env() with fallback - extract the fallback value
  const envMatch = value.match(/env\([^,]+,\s*(\d+(?:\.\d+)?)(px)?\s*\)/)
  if (envMatch) {
    const fallbackPx = parseFloat(envMatch[1])
    return (fallbackPx / frameDimension) * 100
  }

  // Handle pixel values
  if (value.endsWith('px')) {
    const px = parseFloat(value)
    return (px / frameDimension) * 100
  }

  // Handle rem values (assume 16px base)
  if (value.endsWith('rem')) {
    const rem = parseFloat(value)
    return ((rem * 16) / frameDimension) * 100
  }

  // Handle plain numbers as pixels
  const num = parseFloat(value)
  if (!isNaN(num)) {
    return (num / frameDimension) * 100
  }

  return 0
}

/**
 * Parse safe zone insets into percentages.
 *
 * @param safeZones - Safe zone insets with CSS values
 * @param frameSize - Frame dimensions for conversion
 * @returns Safe zones as percentages
 */
export function parseSafeZones(
  safeZones: SafeZoneInsets,
  frameSize: { width: number; height: number }
): ParsedSafeZones {
  return {
    top: parseToPercentage(safeZones.top, frameSize.height),
    bottom: parseToPercentage(safeZones.bottom, frameSize.height),
    left: parseToPercentage(safeZones.left, frameSize.width),
    right: parseToPercentage(safeZones.right, frameSize.width),
  }
}

// ============================================================================
// Region Calculations
// ============================================================================

/**
 * Get the coordinates for a grid cell (1-9).
 *
 * @param cell - Grid cell number (1-9)
 * @param safeZones - Optional safe zone insets (as percentages)
 * @returns Region coordinates as percentages
 */
export function getGridCellCoordinates(cell: GridCell, safeZones?: ParsedSafeZones): RegionCoordinates {
  const safe = safeZones ?? { top: 0, bottom: 0, left: 0, right: 0 }

  // Calculate usable area after safe zones
  const usableLeft = safe.left
  const usableTop = safe.top
  const usableWidth = 100 - safe.left - safe.right
  const usableHeight = 100 - safe.top - safe.bottom

  // Third dimensions within usable area
  const cellWidth = usableWidth / 3
  const cellHeight = usableHeight / 3

  // Calculate column (0, 1, 2) and row (0, 1, 2) from cell number
  const col = (cell - 1) % 3
  const row = Math.floor((cell - 1) / 3)

  return {
    x: usableLeft + col * cellWidth,
    y: usableTop + row * cellHeight,
    width: cellWidth,
    height: cellHeight,
  }
}

/**
 * Get the center point of a grid cell.
 *
 * @param cell - Grid cell number (1-9)
 * @param safeZones - Optional safe zone insets (as percentages)
 * @returns Center coordinates as percentages
 */
export function getGridCellCenter(cell: GridCell, safeZones?: ParsedSafeZones): { x: number; y: number } {
  const coords = getGridCellCoordinates(cell, safeZones)
  return {
    x: coords.x + coords.width / 2,
    y: coords.y + coords.height / 2,
  }
}

/**
 * Get coordinates for a semantic region.
 *
 * @param region - Region name
 * @param frameSize - Frame dimensions for context
 * @param safeZones - Optional safe zone insets (as percentages)
 * @returns Region coordinates as percentages
 */
export function getRegionCoordinates(
  region: Region,
  frameSize: { width: number; height: number },
  safeZones?: ParsedSafeZones
): RegionCoordinates {
  const safe = safeZones ?? { top: 0, bottom: 0, left: 0, right: 0 }

  // Calculate usable area
  const usableLeft = safe.left
  const usableTop = safe.top
  const usableWidth = 100 - safe.left - safe.right
  const usableHeight = 100 - safe.top - safe.bottom

  switch (region) {
    // Vertical thirds (full height columns)
    case 'left-third':
      return {
        x: usableLeft,
        y: usableTop,
        width: usableWidth / 3,
        height: usableHeight,
      }

    case 'center':
      return {
        x: usableLeft + usableWidth / 3,
        y: usableTop,
        width: usableWidth / 3,
        height: usableHeight,
      }

    case 'right-third':
      return {
        x: usableLeft + (usableWidth * 2) / 3,
        y: usableTop,
        width: usableWidth / 3,
        height: usableHeight,
      }

    // 3x3 grid cells
    case 'top-left':
      return getGridCellCoordinates(1, safe)

    case 'top-center':
      return getGridCellCoordinates(2, safe)

    case 'top-right':
      return getGridCellCoordinates(3, safe)

    case 'center-left':
      return getGridCellCoordinates(4, safe)

    case 'center-center':
      return getGridCellCoordinates(5, safe)

    case 'center-right':
      return getGridCellCoordinates(6, safe)

    case 'bottom-left':
      return getGridCellCoordinates(7, safe)

    case 'bottom-center':
      return getGridCellCoordinates(8, safe)

    case 'bottom-right':
      return getGridCellCoordinates(9, safe)

    default:
      // Fallback to center
      return {
        x: usableLeft + usableWidth / 3,
        y: usableTop + usableHeight / 3,
        width: usableWidth / 3,
        height: usableHeight / 3,
      }
  }
}

/**
 * Get the center point of a region.
 *
 * @param region - Region name
 * @param frameSize - Frame dimensions
 * @param safeZones - Optional safe zone insets (as percentages)
 * @returns Center point as percentages
 */
export function getRegionCenter(
  region: Region,
  frameSize: { width: number; height: number },
  safeZones?: ParsedSafeZones
): { x: number; y: number } {
  const coords = getRegionCoordinates(region, frameSize, safeZones)
  return {
    x: coords.x + coords.width / 2,
    y: coords.y + coords.height / 2,
  }
}

/**
 * Check if a point is within a region.
 *
 * @param point - Point coordinates as percentages
 * @param region - Region name
 * @param frameSize - Frame dimensions
 * @param safeZones - Optional safe zone insets
 * @returns True if point is within region
 */
export function isPointInRegion(
  point: { x: number; y: number },
  region: Region,
  frameSize: { width: number; height: number },
  safeZones?: ParsedSafeZones
): boolean {
  const coords = getRegionCoordinates(region, frameSize, safeZones)
  return (
    point.x >= coords.x &&
    point.x <= coords.x + coords.width &&
    point.y >= coords.y &&
    point.y <= coords.y + coords.height
  )
}

/**
 * Get all grid cells as an array of coordinates.
 *
 * @param safeZones - Optional safe zone insets
 * @returns Array of 9 grid cell coordinates
 */
export function getAllGridCells(safeZones?: ParsedSafeZones): RegionCoordinates[] {
  const cells: GridCell[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  return cells.map((cell) => getGridCellCoordinates(cell, safeZones))
}
