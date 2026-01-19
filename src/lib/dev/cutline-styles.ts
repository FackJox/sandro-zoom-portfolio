/**
 * Cutline Style Constants
 *
 * Phantom Lines preset - muted gray, documentary feel.
 * Follows Alpine Noir brand guidelines with subtle, technical aesthetics.
 */

export const CUTLINE = {
  /** Border width for cut lines */
  borderWidth: '1px',
  /** RGBA color for cut lines - muted gray at 50% */
  color: 'rgba(112, 121, 119, 0.50)',
  /** RGBA color for glitch tile glow */
  glowColor: 'rgba(112, 121, 119, 0.15)',
  /** Tile size in pixels */
  tileSize: { desktop: 150, mobile: 100 },
  /** Whether to show scan line overlay */
  showScanLines: true,
} as const
