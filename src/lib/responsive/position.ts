/**
 * Position Resolution System
 *
 * Resolves position configurations to final CSS coordinates.
 * Handles presets, regions, explicit coordinates, and anchor points.
 */

import type { Position, PositionPreset, Region, ExperienceType, FrameConfig, SafeZonesConfig } from '../types'
import { getPresetCoordinates, isValidPreset } from './presets'
import { getRegionCenter, parseSafeZones, type ParsedSafeZones } from './regions'
import { getParsedSafeZones, applySafeZones } from './safe-zones'

// ============================================================================
// Types
// ============================================================================

/**
 * Resolved position with CSS-ready values.
 */
export interface ResolvedPosition {
  /** X position as CSS value (percentage or explicit) */
  x: string
  /** Y position as CSS value (percentage or explicit) */
  y: string
  /** CSS transform to apply for anchor adjustment */
  transform: string
}

/**
 * Anchor point for element positioning.
 */
export type AnchorPoint = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Transform offset for each anchor point.
 */
interface AnchorOffset {
  x: number // -50 to 50 (percentage)
  y: number // -50 to 50 (percentage)
}

/**
 * Frame size for calculations.
 */
export interface FrameSize {
  width: number
  height: number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Transform offsets for each anchor point.
 * These translate the element so its anchor point aligns with the position.
 */
const ANCHOR_OFFSETS: Record<AnchorPoint, AnchorOffset> = {
  center: { x: -50, y: -50 },
  'top-left': { x: 0, y: 0 },
  'top-right': { x: -100, y: 0 },
  'bottom-left': { x: 0, y: -100 },
  'bottom-right': { x: -100, y: -100 },
}

// ============================================================================
// Position Resolution
// ============================================================================

/**
 * Resolve a position configuration to final CSS values.
 *
 * Priority order:
 * 1. Explicit x/y values (passthrough)
 * 2. Preset lookup
 * 3. Region calculation
 * 4. Default to center
 *
 * @param position - Position configuration
 * @param frame - Frame configuration
 * @param experience - Current experience type
 * @param safeZonesConfig - Safe zones configuration
 * @returns Resolved CSS position values
 */
export function resolvePosition(
  position: Position,
  frame: FrameConfig,
  experience: ExperienceType,
  safeZonesConfig: SafeZonesConfig
): ResolvedPosition {
  const frameSize: FrameSize = { width: frame.width, height: frame.height }
  const safeZones = getParsedSafeZones(experience, safeZonesConfig, frameSize)

  // 1. Handle explicit x/y values (passthrough)
  if (position.x !== undefined && position.y !== undefined) {
    return resolveExplicitPosition(position)
  }

  // 2. Handle preset
  if (position.preset) {
    return resolvePresetPosition(position, frameSize, safeZones)
  }

  // 3. Handle region
  if (position.region) {
    return resolveRegionPosition(position, frameSize, safeZones)
  }

  // 4. Default to center
  return resolveDefaultPosition(position, frameSize, safeZones)
}

/**
 * Resolve explicit x/y coordinates (passthrough mode).
 *
 * @param position - Position with explicit x/y
 * @returns Resolved position
 */
function resolveExplicitPosition(position: Position): ResolvedPosition {
  const anchor = position.anchor ?? 'center'
  const offset = ANCHOR_OFFSETS[anchor]
  const pixelOffset = position.offset ?? { x: 0, y: 0 }

  // Build transform string
  const transforms: string[] = []
  transforms.push(`translate(${offset.x}%, ${offset.y}%)`)

  if (pixelOffset.x || pixelOffset.y) {
    transforms.push(`translate(${pixelOffset.x ?? 0}px, ${pixelOffset.y ?? 0}px)`)
  }

  return {
    x: position.x!,
    y: position.y!,
    transform: transforms.join(' '),
  }
}

/**
 * Resolve a preset-based position.
 *
 * @param position - Position with preset
 * @param frameSize - Frame dimensions
 * @param safeZones - Parsed safe zones
 * @returns Resolved position
 */
function resolvePresetPosition(
  position: Position,
  frameSize: FrameSize,
  safeZones: ParsedSafeZones
): ResolvedPosition {
  const preset = position.preset!

  // Get preset coordinates (0-100 in full frame, not safe-zone adjusted)
  const coords = getPresetCoordinates(preset, frameSize)

  // Presets are already in full-frame percentages, no safe zone adjustment needed
  // (They represent design positions, not content positions)

  const anchor = position.anchor ?? 'center'
  const offset = ANCHOR_OFFSETS[anchor]
  const pixelOffset = position.offset ?? { x: 0, y: 0 }

  const transforms: string[] = []
  transforms.push(`translate(${offset.x}%, ${offset.y}%)`)

  if (pixelOffset.x || pixelOffset.y) {
    transforms.push(`translate(${pixelOffset.x ?? 0}px, ${pixelOffset.y ?? 0}px)`)
  }

  return {
    x: `${coords.x}%`,
    y: `${coords.y}%`,
    transform: transforms.join(' '),
  }
}

/**
 * Resolve a region-based position.
 *
 * @param position - Position with region
 * @param frameSize - Frame dimensions
 * @param safeZones - Parsed safe zones
 * @returns Resolved position
 */
function resolveRegionPosition(
  position: Position,
  frameSize: FrameSize,
  safeZones: ParsedSafeZones
): ResolvedPosition {
  const region = position.region!

  // Get region center (safe-zone aware)
  const center = getRegionCenter(region, frameSize, safeZones)

  // Apply vertical alignment adjustment
  let y = center.y
  if (position.vAlign === 'top') {
    // Move to top third of region
    y = center.y - (100 - safeZones.top - safeZones.bottom) / 9
  } else if (position.vAlign === 'bottom') {
    // Move to bottom third of region
    y = center.y + (100 - safeZones.top - safeZones.bottom) / 9
  }

  // Apply horizontal alignment adjustment
  let x = center.x
  if (position.hAlign === 'left') {
    x = center.x - (100 - safeZones.left - safeZones.right) / 9
  } else if (position.hAlign === 'right') {
    x = center.x + (100 - safeZones.left - safeZones.right) / 9
  }

  const anchor = position.anchor ?? 'center'
  const offset = ANCHOR_OFFSETS[anchor]
  const pixelOffset = position.offset ?? { x: 0, y: 0 }

  const transforms: string[] = []
  transforms.push(`translate(${offset.x}%, ${offset.y}%)`)

  if (pixelOffset.x || pixelOffset.y) {
    transforms.push(`translate(${pixelOffset.x ?? 0}px, ${pixelOffset.y ?? 0}px)`)
  }

  return {
    x: `${x}%`,
    y: `${y}%`,
    transform: transforms.join(' '),
  }
}

/**
 * Resolve to default center position.
 *
 * @param position - Position (may have anchor/offset)
 * @param frameSize - Frame dimensions
 * @param safeZones - Parsed safe zones
 * @returns Resolved position at center
 */
function resolveDefaultPosition(
  position: Position,
  frameSize: FrameSize,
  safeZones: ParsedSafeZones
): ResolvedPosition {
  // Center of safe area
  const x = safeZones.left + (100 - safeZones.left - safeZones.right) / 2
  const y = safeZones.top + (100 - safeZones.top - safeZones.bottom) / 2

  const anchor = position.anchor ?? 'center'
  const offset = ANCHOR_OFFSETS[anchor]
  const pixelOffset = position.offset ?? { x: 0, y: 0 }

  const transforms: string[] = []
  transforms.push(`translate(${offset.x}%, ${offset.y}%)`)

  if (pixelOffset.x || pixelOffset.y) {
    transforms.push(`translate(${pixelOffset.x ?? 0}px, ${pixelOffset.y ?? 0}px)`)
  }

  return {
    x: `${x}%`,
    y: `${y}%`,
    transform: transforms.join(' '),
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get CSS styles for a resolved position.
 *
 * @param resolved - Resolved position
 * @returns CSS style object
 */
export function getPositionStyles(resolved: ResolvedPosition): Record<string, string> {
  return {
    position: 'absolute',
    left: resolved.x,
    top: resolved.y,
    transform: resolved.transform,
  }
}

/**
 * Get inline style string for a resolved position.
 *
 * @param resolved - Resolved position
 * @returns CSS inline style string
 */
export function getPositionStyleString(resolved: ResolvedPosition): string {
  return `position: absolute; left: ${resolved.x}; top: ${resolved.y}; transform: ${resolved.transform};`
}

/**
 * Convert a resolved position to percentages (for calculations).
 *
 * @param resolved - Resolved position
 * @returns Position as percentages, or null if not percentage-based
 */
export function resolvedToPercentages(resolved: ResolvedPosition): { x: number; y: number } | null {
  const xMatch = resolved.x.match(/^([\d.]+)%$/)
  const yMatch = resolved.y.match(/^([\d.]+)%$/)

  if (!xMatch || !yMatch) return null

  return {
    x: parseFloat(xMatch[1]),
    y: parseFloat(yMatch[1]),
  }
}

/**
 * Create a position from raw percentages.
 *
 * @param x - X percentage (0-100)
 * @param y - Y percentage (0-100)
 * @param anchor - Anchor point (default: center)
 * @returns Resolved position
 */
export function createPositionFromPercentages(
  x: number,
  y: number,
  anchor: AnchorPoint = 'center'
): ResolvedPosition {
  const offset = ANCHOR_OFFSETS[anchor]

  return {
    x: `${x}%`,
    y: `${y}%`,
    transform: `translate(${offset.x}%, ${offset.y}%)`,
  }
}

/**
 * Interpolate between two positions (for animation).
 *
 * @param from - Start position (as percentages)
 * @param to - End position (as percentages)
 * @param progress - Progress (0-1)
 * @param anchor - Anchor point
 * @returns Interpolated position
 */
export function interpolatePositions(
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number,
  anchor: AnchorPoint = 'center'
): ResolvedPosition {
  const x = from.x + (to.x - from.x) * progress
  const y = from.y + (to.y - from.y) * progress

  return createPositionFromPercentages(x, y, anchor)
}

/**
 * Check if two resolved positions are equal.
 *
 * @param a - First position
 * @param b - Second position
 * @returns True if equal
 */
export function positionsEqual(a: ResolvedPosition, b: ResolvedPosition): boolean {
  return a.x === b.x && a.y === b.y && a.transform === b.transform
}

/**
 * Get the transform string for an anchor point.
 *
 * @param anchor - Anchor point
 * @param offset - Additional pixel offset
 * @returns CSS transform string
 */
export function getAnchorTransform(anchor: AnchorPoint, offset?: { x?: number; y?: number }): string {
  const anchorOffset = ANCHOR_OFFSETS[anchor]
  const transforms: string[] = []

  transforms.push(`translate(${anchorOffset.x}%, ${anchorOffset.y}%)`)

  if (offset?.x || offset?.y) {
    transforms.push(`translate(${offset.x ?? 0}px, ${offset.y ?? 0}px)`)
  }

  return transforms.join(' ')
}
