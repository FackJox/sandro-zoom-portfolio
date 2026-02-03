/**
 * Card Flip Transition - Scroll-Scrubbed Version
 *
 * Creates a grid of tiles that flip to reveal the incoming scene.
 * Uses DOM cloning for pixel-perfect rendering (no screenshots).
 *
 * Key features:
 * - Fully scroll-scrubbed (user controls flip progress by scrolling)
 * - Row-by-row scan pattern with random variation
 * - 10% glitch tiles that flip early/late
 * - Clean visual treatment (no gaps, borders, or scan lines)
 */

import { gsap } from '../core/gsap'

// ============================================================================
// Types
// ============================================================================

export interface CardFlipTransitionConfig {
  /** Probability of a tile being a glitch tile (default: 0.1 = 10%) */
  glitchProbability: number
  /** Random seed for reproducible results (default: 42) */
  seed: number
}

export interface GridDimensions {
  cols: number
  rows: number
  tileWidth: number
  tileHeight: number
}

export interface TileDelay {
  index: number
  delay: number
  isGlitch: boolean
}

export interface CardFlipGrid {
  element: HTMLElement
  dimensions: GridDimensions
  tileDelays: TileDelay[]
  timeline: gsap.core.Timeline
  destroy: () => void
}

// ============================================================================
// Seeded Random
// ============================================================================

/**
 * Create a seeded random number generator for reproducible results.
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// ============================================================================
// Grid Calculation
// ============================================================================

/**
 * Get the target tile size based on device.
 * Desktop: 150px (larger, fewer tiles - more deliberate)
 * Mobile: 100px
 */
export function getTargetTileSize(): number {
  if (typeof window === 'undefined') return 150
  return window.innerWidth < 768 ? 100 : 150
}

/**
 * Calculate grid dimensions to keep tiles as square as possible.
 */
export function calculateGrid(
  viewportWidth: number,
  viewportHeight: number,
  targetTileSize: number
): GridDimensions {
  const cols = Math.round(viewportWidth / targetTileSize)
  const rows = Math.round(viewportHeight / targetTileSize)

  return {
    cols: Math.max(cols, 1),
    rows: Math.max(rows, 1),
    tileWidth: viewportWidth / Math.max(cols, 1),
    tileHeight: viewportHeight / Math.max(rows, 1),
  }
}

// ============================================================================
// Scrub Delay Calculation
// ============================================================================

/**
 * Calculate delays for scroll-scrubbed animation.
 *
 * Timing parameters:
 * - staggerSpread (0.6): Tile start times span 60% of total scroll range
 * - flipDuration (0.4): Each tile takes 40% of scroll range to complete
 *
 * This ensures all tiles complete their flip by 100% scroll progress.
 */
export function calculateScrubDelays(
  cols: number,
  rows: number,
  glitchProbability: number = 0.1,
  seed: number = 42
): TileDelay[] {
  const rng = seededRandom(seed)
  const delays: TileDelay[] = []
  const staggerSpread = 0.6 // Tile starts span 60% of scroll

  for (let i = 0; i < cols * rows; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    // Base: row position (top rows first)
    const rowDelay = (row / rows) * staggerSpread

    // Column offset: left-to-right bias within row
    const colOffset = (col / cols) * (staggerSpread / rows) * 0.3

    // Random variation: +/-15% of one row's delay range
    const rowRange = staggerSpread / rows
    const randomOffset = (rng() - 0.5) * 0.3 * rowRange

    let delay = rowDelay + colOffset + randomOffset

    // 10% glitch tiles: flip way early or way late
    const isGlitch = rng() < glitchProbability
    if (isGlitch) {
      const glitchOffset = (rng() - 0.5) * 0.5 * staggerSpread // +/-25% of total spread
      delay = Math.max(0, Math.min(staggerSpread, delay + glitchOffset))
    }

    delays.push({ index: i, delay, isGlitch })
  }

  return delays
}

// ============================================================================
// DOM Cloning Utilities
// ============================================================================

/**
 * Create a deep clone of an element suitable for tile display.
 * The clone is positioned with negative offset to show only the tile's region.
 */
function createTileClone(
  sourceElement: HTMLElement,
  tileX: number,
  tileY: number,
  viewportWidth: number,
  viewportHeight: number
): HTMLElement {
  // Clone the entire element tree
  const clone = sourceElement.cloneNode(true) as HTMLElement

  // Remove any IDs to prevent duplicates
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
  clone.removeAttribute('id')

  // Position the clone so only the tile's region is visible
  clone.style.cssText = `
    position: absolute;
    left: ${-tileX}px;
    top: ${-tileY}px;
    width: ${viewportWidth}px;
    height: ${viewportHeight}px;
    pointer-events: none;
    margin: 0;
    transform: none;
    visibility: visible;
    opacity: 1;
  `

  // Reset visibility/opacity on all children that may have GSAP inline styles
  // This ensures cloned content is visible regardless of animation state
  clone.querySelectorAll('[style*="visibility"], [style*="opacity"]').forEach(el => {
    const htmlEl = el as HTMLElement
    htmlEl.style.visibility = 'visible'
    htmlEl.style.opacity = '1'
  })

  return clone
}

// ============================================================================
// Grid Creation (Simplified)
// ============================================================================

/**
 * Create the flip grid using DOM clones.
 * Each tile contains a clone of the full scene, positioned to show only its region.
 *
 * Simplified visual treatment:
 * - No gaps between tiles
 * - No borders or outlines
 * - No scan line overlay
 */
export function createFlipGridElement(
  outgoingElement: HTMLElement,
  incomingElement: HTMLElement,
  dimensions: GridDimensions,
  tileDelays: TileDelay[]
): HTMLElement {
  const { cols, rows, tileWidth, tileHeight } = dimensions

  // Use source element dimensions, not viewport (avoids scrollbar mismatch)
  const outgoingRect = outgoingElement.getBoundingClientRect()
  const sourceWidth = outgoingRect.width
  const sourceHeight = outgoingRect.height

  console.log('[CardFlip] Grid setup:', {
    grid: { cols, rows },
    tileSize: { width: tileWidth.toFixed(2), height: tileHeight.toFixed(2) },
    source: { width: sourceWidth.toFixed(2), height: sourceHeight.toFixed(2) },
  })

  // Create container
  const container = document.createElement('div')
  container.className = 'card-flip-grid'
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 100;
    perspective: 1200px;
    pointer-events: none;
  `

  // Create tiles - exact fit, no gaps
  const tileCount = cols * rows
  for (let i = 0; i < tileCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const isGlitch = tileDelays[i]?.isGlitch ?? false

    // Exact positioning - tiles fill viewport completely
    const tileLeft = col * tileWidth
    const tileTop = row * tileHeight

    const tile = document.createElement('div')
    tile.className = `flip-tile${isGlitch ? ' glitch' : ''}`
    tile.dataset.index = String(i)
    tile.style.cssText = `
      transform-style: preserve-3d;
      position: absolute;
      left: ${tileLeft}px;
      top: ${tileTop}px;
      width: ${tileWidth}px;
      height: ${tileHeight}px;
    `

    // Front face (shows OUTGOING scene region)
    const frontFace = document.createElement('div')
    frontFace.className = 'flip-tile-front'
    frontFace.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: hidden;
      backface-visibility: hidden;
    `
    const frontClone = createTileClone(outgoingElement, tileLeft, tileTop, sourceWidth, sourceHeight)
    frontFace.appendChild(frontClone)

    // Back face (shows INCOMING scene region)
    const backFace = document.createElement('div')
    backFace.className = 'flip-tile-back'
    backFace.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: hidden;
      backface-visibility: hidden;
      transform: rotateX(180deg);
    `
    const backClone = createTileClone(incomingElement, tileLeft, tileTop, sourceWidth, sourceHeight)
    backFace.appendChild(backClone)

    tile.appendChild(frontFace)
    tile.appendChild(backFace)
    container.appendChild(tile)
  }

  return container
}

// ============================================================================
// Scrubbed Timeline
// ============================================================================

/**
 * Build a timeline for scroll-scrubbed flip animation.
 *
 * Each tile flips from 0 to 180 degrees based on its calculated delay.
 * The timeline is attached to a ScrollTrigger with scrub: true externally.
 */
function buildScrubTimeline(
  container: HTMLElement,
  tileDelays: TileDelay[]
): gsap.core.Timeline {
  const tiles = container.querySelectorAll('.flip-tile')
  const tl = gsap.timeline()

  const flipDuration = 0.4 // Each tile takes 40% of scroll range to complete

  tileDelays.forEach(({ index, delay }) => {
    const tile = tiles[index]
    if (!tile) return

    tl.fromTo(
      tile,
      { rotateX: 0 },
      { rotateX: 180, duration: flipDuration, ease: 'none' },
      delay
    )
  })

  return tl
}

// ============================================================================
// Main Mount Function
// ============================================================================

/**
 * Mount the card flip grid and return the element + timeline.
 *
 * The timeline should be attached to a ScrollTrigger with scrub: true
 * by the calling code (PortalContainer).
 */
export function mountCardFlipGrid(
  outgoingElement: HTMLElement,
  incomingElement: HTMLElement,
  config: CardFlipTransitionConfig
): CardFlipGrid {
  // Use source element dimensions, not viewport (avoids scrollbar mismatch)
  const sourceRect = outgoingElement.getBoundingClientRect()
  const targetSize = getTargetTileSize()
  const dimensions = calculateGrid(
    sourceRect.width,
    sourceRect.height,
    targetSize
  )

  const tileDelays = calculateScrubDelays(
    dimensions.cols,
    dimensions.rows,
    config.glitchProbability,
    config.seed
  )

  const element = createFlipGridElement(outgoingElement, incomingElement, dimensions, tileDelays)
  document.body.appendChild(element)

  const timeline = buildScrubTimeline(element, tileDelays)

  console.log(`[CardFlip] Grid mounted: ${dimensions.cols}x${dimensions.rows} tiles`)

  return {
    element,
    dimensions,
    tileDelays,
    timeline,
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    },
  }
}

// ============================================================================
// Reduced Motion Support
// ============================================================================

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
