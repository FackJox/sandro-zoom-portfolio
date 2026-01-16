/**
 * Card Flip Transition (Alpine Noir / Machine Archetype)
 *
 * Creates a grid of tiles that flip to reveal the incoming scene.
 * Uses DOM cloning for pixel-perfect rendering (no screenshots).
 *
 * Visual Treatment:
 * - 1px gaps between tiles (Black Stallion visible through gaps)
 * - Front face: subtle border (Cover of Night at 20% opacity)
 * - Back face: Egg Toast accent (15% opacity) - digital activation state
 * - Scan line overlay on entire grid
 */

import { gsap } from '../core/gsap'
import { lockScroll, unlockScroll } from './scroll-lock'

// ============================================================================
// Brand Colors
// ============================================================================

const COLORS = {
  blackStallion: '#0f171a',     // Background through gaps
  coverOfNight: 'rgba(12, 16, 18, 0.2)',  // Front border
  eggToast: 'rgba(244, 162, 97, 0.15)',   // Back accent
  eggToastGlitch: 'rgba(244, 162, 97, 0.1)', // Glitch tile hint
}

// ============================================================================
// Types
// ============================================================================

export interface CardFlipTransitionConfig {
  /** Total duration of the flip animation in seconds (default: 1.6) */
  duration: number
  /** How much of the duration is spread across stagger delays (default: 0.8) */
  staggerDuration: number
  /** Probability of a tile being a glitch tile (default: 0.1 = 10%) */
  glitchProbability: number
  /** Random seed for reproducible results (default: 42) */
  seed: number
}

export interface ExecuteCardFlipConfig extends CardFlipTransitionConfig {
  /** Where to set scroll after transition completes */
  targetScrollY: number
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
  play: () => Promise<void>
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
// Scan Corruption Pattern
// ============================================================================

/**
 * Calculate scan delays for row-by-row animation with variation and glitch tiles.
 */
export function calculateScanDelays(
  cols: number,
  rows: number,
  staggerDuration: number,
  glitchProbability: number = 0.1,
  seed: number = 42
): TileDelay[] {
  const rng = seededRandom(seed)
  const tileCount = cols * rows
  const delays: TileDelay[] = []

  const rowDelay = staggerDuration / rows

  for (let i = 0; i < tileCount; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    const colOffset = (col / cols) * rowDelay * 0.3
    let delay = row * rowDelay + colOffset

    const latencyVariation = (rng() - 0.5) * 0.2 * rowDelay
    delay += latencyVariation

    const isGlitch = rng() < glitchProbability
    if (isGlitch) {
      const glitchOffset = (rng() - 0.5) * 0.6 * staggerDuration
      delay = Math.max(0, delay + glitchOffset)
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

  // DIAGNOSTIC: Check source element's actual position
  const sourceRect = sourceElement.getBoundingClientRect()
  if (tileX === 0 && tileY === 0) {
    console.log('[CardFlip] Clone source check (tile 0,0):', {
      sourceRect: { top: sourceRect.top, left: sourceRect.left, width: sourceRect.width, height: sourceRect.height },
      cloneOffset: { left: -tileX, top: -tileY },
      cloneSize: { width: viewportWidth, height: viewportHeight },
      sourceOffsetFromViewport: { left: sourceRect.left, top: sourceRect.top },
    })
  }

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
// Grid Creation (DOM-Based)
// ============================================================================

/**
 * Create the flip grid using DOM clones instead of canvas screenshots.
 * Each tile contains a clone of the full scene, positioned to show only its region.
 * This ensures pixel-perfect rendering with correct fonts and styles.
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

  // DIAGNOSTIC: Log grid setup with sub-pixel analysis
  const incomingRect = incomingElement.getBoundingClientRect()
  const totalTileWidth = cols * tileWidth
  const totalTileHeight = rows * tileHeight
  const widthDiff = sourceWidth - totalTileWidth
  const heightDiff = sourceHeight - totalTileHeight

  console.log('[CardFlip] Grid setup:', {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    outgoing: { width: sourceWidth, height: sourceHeight, top: outgoingRect.top, left: outgoingRect.left },
    incoming: { width: incomingRect.width, height: incomingRect.height, top: incomingRect.top, left: incomingRect.left },
    grid: { cols, rows, tileWidth: tileWidth.toFixed(4), tileHeight: tileHeight.toFixed(4) },
    coverage: {
      totalTileWidth: totalTileWidth.toFixed(4),
      totalTileHeight: totalTileHeight.toFixed(4),
      widthDiff: widthDiff.toFixed(4),
      heightDiff: heightDiff.toFixed(4),
    },
    subPixel: {
      tileWidthHasSubPixel: tileWidth !== Math.floor(tileWidth),
      tileHeightHasSubPixel: tileHeight !== Math.floor(tileHeight),
      cumulativeWidthError: (cols * (tileWidth - Math.floor(tileWidth))).toFixed(4),
      cumulativeHeightError: (rows * (tileHeight - Math.floor(tileHeight))).toFixed(4),
    },
  })

  // Check if outgoing and incoming have different dimensions/positions
  if (Math.abs(outgoingRect.height - incomingRect.height) > 1) {
    console.warn('[CardFlip] ⚠️ Height mismatch between outgoing/incoming:', {
      outgoingHeight: outgoingRect.height,
      incomingHeight: incomingRect.height,
      diff: outgoingRect.height - incomingRect.height,
    })
  }

  // Check if source is offset from viewport origin
  if (Math.abs(outgoingRect.top) > 0.5 || Math.abs(outgoingRect.left) > 0.5) {
    console.warn('[CardFlip] ⚠️ Source element is offset from viewport origin:', {
      sourceTop: outgoingRect.top,
      sourceLeft: outgoingRect.left,
      'This may cause misalignment!': true,
    })
  }

  // Create container - tiles fill 100%, no gaps
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

  // Create scan line overlay
  const scanLines = document.createElement('div')
  scanLines.className = 'scan-lines'
  scanLines.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1000;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
  `
  container.appendChild(scanLines)

  // Create tiles - exact fit, no gaps
  // Cut lines are created with outline (doesn't affect layout)
  const tileCount = cols * rows
  for (let i = 0; i < tileCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const isGlitch = tileDelays[i]?.isGlitch ?? false

    // Exact positioning - tiles fill viewport completely
    const tileLeft = col * tileWidth
    const tileTop = row * tileHeight

    // DIAGNOSTIC: Log first tile of each row
    if (col === 0) {
      console.log(`[CardFlip] Row ${row} tile:`, {
        tileLeft,
        tileTop,
        tileWidth,
        tileHeight,
        cloneOffset: { x: -tileLeft, y: -tileTop },
      })
    }

    const tile = document.createElement('div')
    tile.className = `flip-tile${isGlitch ? ' glitch' : ''}`
    tile.dataset.index = String(i)
    tile.dataset.row = String(row)
    tile.style.cssText = `
      transform-style: preserve-3d;
      position: absolute;
      left: ${tileLeft}px;
      top: ${tileTop}px;
      width: ${tileWidth}px;
      height: ${tileHeight}px;
    `

    // Front face (shows OUTGOING scene region)
    // Outline creates cut line effect without affecting layout
    // Starts transparent, animated visible in wave pattern
    const frontFace = document.createElement('div')
    frontFace.className = 'flip-tile-front'
    const frontOutlineColor = isGlitch ? COLORS.eggToastGlitch : COLORS.coverOfNight
    frontFace.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: hidden;
      backface-visibility: hidden;
      outline: 1px solid transparent;
      outline-offset: -1px;
    `
    frontFace.dataset.outlineColor = frontOutlineColor
    // Clone uses source dimensions to match actual content size
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
      outline: 1px solid transparent;
      outline-offset: -1px;
    `
    backFace.dataset.outlineColor = COLORS.eggToast
    const backClone = createTileClone(incomingElement, tileLeft, tileTop, sourceWidth, sourceHeight)
    backFace.appendChild(backClone)

    tile.appendChild(frontFace)
    tile.appendChild(backFace)
    container.appendChild(tile)
  }

  // DIAGNOSTIC: Verify grid coverage after creation
  // First temporarily add to DOM to measure, then return
  const tempParent = document.createElement('div')
  tempParent.style.cssText = 'position: fixed; inset: 0; visibility: hidden; pointer-events: none;'
  document.body.appendChild(tempParent)
  tempParent.appendChild(container)

  // Measure actual tile positions
  const allTiles = container.querySelectorAll('.flip-tile')
  const firstTile = allTiles[0] as HTMLElement
  const lastTile = allTiles[allTiles.length - 1] as HTMLElement
  const lastRow = rows - 1
  const lastCol = cols - 1

  if (firstTile && lastTile) {
    const firstRect = firstTile.getBoundingClientRect()
    const lastRect = lastTile.getBoundingClientRect()

    // Expected positions
    const expectedLastLeft = lastCol * tileWidth
    const expectedLastTop = lastRow * tileHeight
    const expectedLastRight = expectedLastLeft + tileWidth
    const expectedLastBottom = expectedLastTop + tileHeight

    console.log('[CardFlip] Tile position verification:', {
      firstTile: {
        expected: { top: 0, left: 0 },
        actual: { top: firstRect.top.toFixed(2), left: firstRect.left.toFixed(2) },
        diff: { top: firstRect.top.toFixed(2), left: firstRect.left.toFixed(2) },
      },
      lastTile: {
        expected: { top: expectedLastTop.toFixed(2), left: expectedLastLeft.toFixed(2), right: expectedLastRight.toFixed(2), bottom: expectedLastBottom.toFixed(2) },
        actual: { top: lastRect.top.toFixed(2), left: lastRect.left.toFixed(2), right: lastRect.right.toFixed(2), bottom: lastRect.bottom.toFixed(2) },
      },
      gridCoverage: {
        actualRight: lastRect.right.toFixed(2),
        actualBottom: lastRect.bottom.toFixed(2),
        sourceWidth: sourceWidth.toFixed(2),
        sourceHeight: sourceHeight.toFixed(2),
        rightGap: (sourceWidth - lastRect.right).toFixed(2),
        bottomGap: (sourceHeight - lastRect.bottom).toFixed(2),
      },
    })

    // Warn if first tile isn't at origin
    if (Math.abs(firstRect.top) > 1 || Math.abs(firstRect.left) > 1) {
      console.warn('[CardFlip] ⚠️ First tile not at viewport origin:', {
        topOffset: firstRect.top,
        leftOffset: firstRect.left,
      })
    }

    // Warn if grid doesn't cover source area
    if (Math.abs(lastRect.right - sourceWidth) > 2 || Math.abs(lastRect.bottom - sourceHeight) > 2) {
      console.warn('[CardFlip] ⚠️ Grid coverage mismatch:', {
        rightMismatch: lastRect.right - sourceWidth,
        bottomMismatch: lastRect.bottom - sourceHeight,
      })
    }
  }

  // Remove from temp parent, return container
  tempParent.removeChild(container)
  document.body.removeChild(tempParent)

  return container
}

// ============================================================================
// Animation
// ============================================================================

/**
 * Create and play the two-phase flip animation:
 * 1. Wave reveal: Cutlines (outlines) appear row-by-row from top to bottom
 * 2. Flip: Tiles flip to reveal incoming scene with stagger pattern
 */
function createFlipAnimation(
  container: HTMLElement,
  tileDelays: TileDelay[],
  config: CardFlipTransitionConfig,
  rows: number
): Promise<void> {
  return new Promise((resolve) => {
    const tiles = container.querySelectorAll('.flip-tile')
    const frontFaces = container.querySelectorAll('.flip-tile-front')
    const backFaces = container.querySelectorAll('.flip-tile-back')
    const { duration, staggerDuration } = config

    // Phase timing
    const revealDuration = 0.4 // Total time for wave reveal
    const revealRowDelay = revealDuration / rows // Delay per row
    const flipDuration = duration - staggerDuration - revealDuration

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          ctx.revert()
          resolve()
        },
      })

      // Phase 1: Wave reveal - show outlines row by row
      tiles.forEach((tile, i) => {
        const row = parseInt((tile as HTMLElement).dataset.row || '0', 10)
        const rowDelay = row * revealRowDelay
        const frontFace = frontFaces[i] as HTMLElement
        const backFace = backFaces[i] as HTMLElement

        if (frontFace && backFace) {
          const frontColor = frontFace.dataset.outlineColor || COLORS.coverOfNight
          const backColor = backFace.dataset.outlineColor || COLORS.eggToast

          // Reveal outlines (cut lines) - instant appearance per row
          tl.to(
            frontFace,
            {
              outlineColor: frontColor,
              duration: 0.01,
              ease: 'none',
            },
            rowDelay
          )
          tl.to(
            backFace,
            {
              outlineColor: backColor,
              duration: 0.01,
              ease: 'none',
            },
            rowDelay
          )
        }
      })

      // Phase 2: Flip animation starts after reveal completes
      const flipStartTime = revealDuration

      tileDelays.forEach(({ index, delay }) => {
        const tile = tiles[index]
        if (!tile) return

        tl.to(
          tile,
          {
            rotateX: 180,
            duration: flipDuration,
            ease: 'ease-lock-on',
          },
          flipStartTime + delay
        )
      })
    }, container)
  })
}

// ============================================================================
// Main Transition Function
// ============================================================================

/**
 * Mount the card flip grid and return control functions.
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

  const tileDelays = calculateScanDelays(
    dimensions.cols,
    dimensions.rows,
    config.staggerDuration,
    config.glitchProbability,
    config.seed
  )

  const element = createFlipGridElement(outgoingElement, incomingElement, dimensions, tileDelays)
  document.body.appendChild(element)

  return {
    element,
    dimensions,
    tileDelays,
    play: () => createFlipAnimation(element, tileDelays, config, dimensions.rows),
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    },
  }
}

// Track transition count for diagnostics
let transitionCount = 0

/**
 * Execute the complete card flip transition.
 * Uses DOM cloning for pixel-perfect rendering.
 */
export async function executeCardFlipTransition(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  config: ExecuteCardFlipConfig,
  direction: 'forward' | 'reverse' = 'forward'
): Promise<void> {
  transitionCount++
  const thisTransition = transitionCount

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) {
    gsap.set(outgoing, { autoAlpha: 0 })
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    outgoing.style.visibility = 'hidden'
    outgoing.style.zIndex = '0'
    incoming.style.zIndex = '20'
    window.scrollTo({ top: config.targetScrollY, behavior: 'instant' as ScrollBehavior })
    return
  }

  lockScroll()

  try {
    console.log(`[CardFlip #${thisTransition}] Starting ${direction} transition (DOM-based)...`)

    // Ensure incoming is visible for cloning (but behind outgoing)
    incoming.style.visibility = 'visible'
    gsap.set(incoming, { autoAlpha: 1 })

    // DIAGNOSTIC: Full state comparison for first vs subsequent transitions
    const outgoingRect = outgoing.getBoundingClientRect()
    const incomingRect = incoming.getBoundingClientRect()
    const outgoingStyles = window.getComputedStyle(outgoing)
    const incomingStyles = window.getComputedStyle(incoming)

    // Check parent containers too
    const outgoingParent = outgoing.parentElement
    const parentRect = outgoingParent?.getBoundingClientRect()
    const parentStyles = outgoingParent ? window.getComputedStyle(outgoingParent) : null

    console.log(`[CardFlip #${thisTransition}] === DIAGNOSTIC: TRANSITION ${thisTransition} ===`)
    console.log(`[CardFlip #${thisTransition}] Window:`, {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollY: window.scrollY,
      documentHeight: document.documentElement.scrollHeight,
    })
    console.log(`[CardFlip #${thisTransition}] Outgoing rect:`, {
      top: outgoingRect.top,
      left: outgoingRect.left,
      width: outgoingRect.width,
      height: outgoingRect.height,
      bottom: outgoingRect.bottom,
      right: outgoingRect.right,
    })
    console.log(`[CardFlip #${thisTransition}] Incoming rect:`, {
      top: incomingRect.top,
      left: incomingRect.left,
      width: incomingRect.width,
      height: incomingRect.height,
      bottom: incomingRect.bottom,
      right: incomingRect.right,
    })
    console.log(`[CardFlip #${thisTransition}] Outgoing styles:`, {
      transform: outgoingStyles.transform,
      position: outgoingStyles.position,
      top: outgoingStyles.top,
      left: outgoingStyles.left,
      width: outgoingStyles.width,
      height: outgoingStyles.height,
      transformOrigin: outgoingStyles.transformOrigin,
      scale: outgoingStyles.scale,
    })
    console.log(`[CardFlip #${thisTransition}] Incoming styles:`, {
      transform: incomingStyles.transform,
      position: incomingStyles.position,
      top: incomingStyles.top,
      left: incomingStyles.left,
      width: incomingStyles.width,
      height: incomingStyles.height,
      transformOrigin: incomingStyles.transformOrigin,
      scale: incomingStyles.scale,
    })
    if (outgoingParent && parentRect && parentStyles) {
      console.log(`[CardFlip #${thisTransition}] Parent container:`, {
        rect: { top: parentRect.top, left: parentRect.left, width: parentRect.width, height: parentRect.height },
        styles: { transform: parentStyles.transform, position: parentStyles.position, overflow: parentStyles.overflow },
      })
    }

    // Check if outgoing/incoming rects differ (they should be same position)
    if (Math.abs(outgoingRect.top - incomingRect.top) > 1 || Math.abs(outgoingRect.height - incomingRect.height) > 1) {
      console.warn(`[CardFlip #${thisTransition}] ⚠️ RECT MISMATCH: outgoing vs incoming differ!`, {
        topDiff: outgoingRect.top - incomingRect.top,
        heightDiff: outgoingRect.height - incomingRect.height,
      })
    }

    // Check if source top is not 0 (would cause offset)
    if (Math.abs(outgoingRect.top) > 1) {
      console.warn(`[CardFlip #${thisTransition}] ⚠️ SOURCE OFFSET: outgoing.top = ${outgoingRect.top}px (expected 0)`)
    }

    // Mount grid with DOM clones
    const grid = mountCardFlipGrid(outgoing, incoming, config)
    console.log(`[CardFlip] Grid mounted: ${grid.dimensions.cols}x${grid.dimensions.rows}`)

    // Hide original scenes (grid shows the clones)
    gsap.set(outgoing, { autoAlpha: 0 })
    outgoing.style.visibility = 'hidden'
    gsap.set(incoming, { autoAlpha: 0 })
    incoming.style.visibility = 'hidden'

    // Play flip animation
    await grid.play()

    // Cleanup grid
    grid.destroy()

    // Show incoming, update z-index states
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    incoming.style.zIndex = '20'
    outgoing.style.zIndex = '0'

    console.log('[CardFlip] Transition complete')

  } finally {
    unlockScroll(config.targetScrollY)
  }
}
