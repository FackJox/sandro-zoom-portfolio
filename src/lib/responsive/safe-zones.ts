/**
 * Safe Zone System
 *
 * Manages safe areas for different devices and experiences.
 * Safe zones ensure content doesn't overlap with device UI elements
 * (notches, home indicators, rounded corners, etc.).
 */

import type { SafeZoneInsets, SafeZonesConfig, ExperienceType, FrameConfig } from '../types'
import { parseSafeZones, type ParsedSafeZones } from './regions'

// ============================================================================
// Types
// ============================================================================

/**
 * Device type for safe zone selection.
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * Coordinate bounds after applying safe zones.
 */
export interface SafeBounds {
  /** Left boundary as percentage */
  left: number
  /** Right boundary as percentage */
  right: number
  /** Top boundary as percentage */
  top: number
  /** Bottom boundary as percentage */
  bottom: number
  /** Usable width as percentage */
  width: number
  /** Usable height as percentage */
  height: number
}

/**
 * Point with x/y coordinates (percentages).
 */
export interface Point {
  x: number
  y: number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default safe zone values for each device type.
 */
export const DEFAULT_SAFE_ZONES: SafeZonesConfig = {
  mobile: {
    top: 'env(safe-area-inset-top, 44px)',
    bottom: 'env(safe-area-inset-bottom, 34px)',
    left: '16px',
    right: '16px',
  },
  tablet: {
    top: '24px',
    bottom: '24px',
    left: '32px',
    right: '32px',
  },
  desktop: {
    top: '48px',
    bottom: '48px',
    left: '64px',
    right: '64px',
  },
}

// ============================================================================
// Device Detection
// ============================================================================

/**
 * Detect device type from window properties.
 * Uses a combination of viewport size and input capabilities.
 *
 * @returns Detected device type
 */
export function detectDeviceType(): DeviceType {
  // Server-side or no window
  if (typeof window === 'undefined') {
    return 'desktop'
  }

  const width = window.innerWidth
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches

  // Mobile: narrow viewport OR touch-first device in portrait
  if (width < 768 || (hasTouch && isCoarsePointer && width < 1024)) {
    return 'mobile'
  }

  // Tablet: medium viewport with touch
  if (width < 1024 && hasTouch) {
    return 'tablet'
  }

  return 'desktop'
}

/**
 * Map experience type to device type.
 *
 * @param experience - Current experience type
 * @returns Corresponding device type
 */
export function experienceToDeviceType(experience: ExperienceType): DeviceType {
  return experience === 'mobile' ? 'mobile' : 'desktop'
}

// ============================================================================
// Safe Zone Functions
// ============================================================================

/**
 * Get safe zone insets for the current experience.
 *
 * @param experience - Current experience type ('desktop' | 'mobile')
 * @param config - Safe zones configuration
 * @returns Safe zone insets for the experience
 */
export function getSafeZones(experience: ExperienceType, config: SafeZonesConfig): SafeZoneInsets {
  const deviceType = experienceToDeviceType(experience)
  return config[deviceType]
}

/**
 * Get parsed safe zones as percentages for the current experience.
 *
 * @param experience - Current experience type
 * @param config - Safe zones configuration
 * @param frameSize - Frame dimensions for conversion
 * @returns Safe zones as percentages
 */
export function getParsedSafeZones(
  experience: ExperienceType,
  config: SafeZonesConfig,
  frameSize: { width: number; height: number }
): ParsedSafeZones {
  const insets = getSafeZones(experience, config)
  return parseSafeZones(insets, frameSize)
}

/**
 * Calculate the safe bounds (usable area) after applying safe zones.
 *
 * @param safeZones - Safe zone insets as percentages
 * @returns Bounds of the safe area
 */
export function calculateSafeBounds(safeZones: ParsedSafeZones): SafeBounds {
  return {
    left: safeZones.left,
    right: 100 - safeZones.right,
    top: safeZones.top,
    bottom: 100 - safeZones.bottom,
    width: 100 - safeZones.left - safeZones.right,
    height: 100 - safeZones.top - safeZones.bottom,
  }
}

/**
 * Apply safe zone insets to coordinates.
 * Maps a position within the safe area (0-100) to the full frame.
 *
 * @param coords - Coordinates as percentages (0-100 within safe area)
 * @param safeZones - Safe zone insets as percentages
 * @returns Coordinates mapped to full frame
 */
export function applySafeZones(coords: Point, safeZones: ParsedSafeZones): Point {
  const bounds = calculateSafeBounds(safeZones)

  return {
    x: bounds.left + (coords.x / 100) * bounds.width,
    y: bounds.top + (coords.y / 100) * bounds.height,
  }
}

/**
 * Remove safe zone offsets from coordinates.
 * Maps a position from the full frame to within the safe area.
 *
 * @param coords - Coordinates as percentages in full frame
 * @param safeZones - Safe zone insets as percentages
 * @returns Coordinates within safe area (0-100)
 */
export function removeSafeZones(coords: Point, safeZones: ParsedSafeZones): Point {
  const bounds = calculateSafeBounds(safeZones)

  return {
    x: ((coords.x - bounds.left) / bounds.width) * 100,
    y: ((coords.y - bounds.top) / bounds.height) * 100,
  }
}

/**
 * Check if a point is within the safe area.
 *
 * @param point - Point coordinates as percentages
 * @param safeZones - Safe zone insets as percentages
 * @returns True if point is within safe area
 */
export function isPointInSafeArea(point: Point, safeZones: ParsedSafeZones): boolean {
  const bounds = calculateSafeBounds(safeZones)

  return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom
}

/**
 * Clamp a point to stay within the safe area.
 *
 * @param point - Point coordinates as percentages
 * @param safeZones - Safe zone insets as percentages
 * @returns Clamped point within safe area
 */
export function clampToSafeArea(point: Point, safeZones: ParsedSafeZones): Point {
  const bounds = calculateSafeBounds(safeZones)

  return {
    x: Math.max(bounds.left, Math.min(bounds.right, point.x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)),
  }
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate CSS custom properties for safe zones.
 *
 * @param safeZones - Safe zone insets
 * @param prefix - CSS variable prefix (default: 'safe')
 * @returns CSS string with custom properties
 */
export function generateSafeZoneCSS(safeZones: SafeZoneInsets, prefix: string = 'safe'): string {
  return `
  --${prefix}-top: ${safeZones.top};
  --${prefix}-bottom: ${safeZones.bottom};
  --${prefix}-left: ${safeZones.left};
  --${prefix}-right: ${safeZones.right};
`.trim()
}

/**
 * Generate complete CSS for all device safe zones.
 *
 * @param config - Full safe zones configuration
 * @returns CSS string with all safe zone variables
 */
export function generateAllSafeZoneCSS(config: SafeZonesConfig): string {
  return `
:root {
  /* Mobile safe zones */
  --safe-mobile-top: ${config.mobile.top};
  --safe-mobile-bottom: ${config.mobile.bottom};
  --safe-mobile-left: ${config.mobile.left};
  --safe-mobile-right: ${config.mobile.right};

  /* Tablet safe zones */
  --safe-tablet-top: ${config.tablet.top};
  --safe-tablet-bottom: ${config.tablet.bottom};
  --safe-tablet-left: ${config.tablet.left};
  --safe-tablet-right: ${config.tablet.right};

  /* Desktop safe zones */
  --safe-desktop-top: ${config.desktop.top};
  --safe-desktop-bottom: ${config.desktop.bottom};
  --safe-desktop-left: ${config.desktop.left};
  --safe-desktop-right: ${config.desktop.right};
}

/* Active safe zones (set by JS based on device) */
.scrollytelling-stage {
  --safe-top: var(--safe-desktop-top);
  --safe-bottom: var(--safe-desktop-bottom);
  --safe-left: var(--safe-desktop-left);
  --safe-right: var(--safe-desktop-right);
}

@media (max-width: 1023px) and (pointer: coarse) {
  .scrollytelling-stage {
    --safe-top: var(--safe-tablet-top);
    --safe-bottom: var(--safe-tablet-bottom);
    --safe-left: var(--safe-tablet-left);
    --safe-right: var(--safe-tablet-right);
  }
}

@media (max-width: 767px) {
  .scrollytelling-stage {
    --safe-top: var(--safe-mobile-top);
    --safe-bottom: var(--safe-mobile-bottom);
    --safe-left: var(--safe-mobile-left);
    --safe-right: var(--safe-mobile-right);
  }
}
`.trim()
}

/**
 * Generate inline styles for safe zone padding.
 *
 * @param safeZones - Safe zone insets
 * @returns Inline style object
 */
export function getSafeZoneStyles(safeZones: SafeZoneInsets): Record<string, string> {
  return {
    paddingTop: safeZones.top,
    paddingBottom: safeZones.bottom,
    paddingLeft: safeZones.left,
    paddingRight: safeZones.right,
  }
}
