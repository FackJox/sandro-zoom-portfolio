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

import { gsap, ScrollTrigger } from '../core/gsap'
import { lockScroll, unlockScroll } from './scroll-lock'

// ============================================================================
// Scrubbed Animation Sync
// ============================================================================

/**
 * Force all scrubbed ScrollTrigger animations to their correct progress.
 *
 * When scroll position is set instantly (like after card-flip), scrubbed
 * animations take time to catch up (based on scrub value). This function
 * bypasses that delay by directly setting animation progress.
 */
function syncScrubbedAnimations(): void {
  const triggers = ScrollTrigger.getAll()

  triggers.forEach(st => {
    // Only process scrubbed triggers with animations
    if (!st.vars.scrub || !st.animation) return

    // Get current scroll progress for this trigger
    const scrollProgress = st.progress

    // Force animation to match scroll progress immediately
    st.animation.progress(scrollProgress)

    console.log(`[CardFlip] Synced scrubbed animation: progress=${Math.round(scrollProgress * 100)}%`)
  })
}

/**
 * Force ContentSlab elements to their visible state.
 *
 * After card-flip reverse, we need to ensure ContentSlab is visible
 * and stays visible even if the user's scroll momentum continues.
 *
 * @param sceneElement - The scene element to search within
 */
function forceContentSlabVisible(sceneElement: HTMLElement): void {
  const contentSlab = sceneElement.querySelector('[data-content-slab]') as HTMLElement | null
  if (!contentSlab) return

  // Directly set to visible state
  gsap.set(contentSlab, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    overwrite: 'auto',
  })
  console.log('[CardFlip] Forced ContentSlab to visible state')
}

// ============================================================================
// Brand Colors
// ============================================================================

// Brand colors from panda.config.ts
const COLORS = {
  blackStallion: '#0f171a',     // brand.primary - background through gaps
  coverOfNight: 'rgba(70, 79, 76, 0.3)',   // brand.surfaceAlt at 30%
  phantom: 'rgba(112, 121, 119, 0.4)',     // brand.phantom at 40%

  // Egg Toast (#f6c605) - brand.accent - the cut line color
  cutLineAccent: 'rgba(246, 198, 5, 0.85)',   // Bright gold cut
  cutLineGlow: 'rgba(246, 198, 5, 0.15)',     // Subtle glow for glitch tiles
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
    tile.dataset.col = String(col)
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
    const frontOutlineColor = isGlitch ? COLORS.cutLineGlow : COLORS.phantom
    frontFace.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: hidden;
      backface-visibility: hidden;
      border: 0px solid transparent;
      box-sizing: border-box;
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
      border: 0px solid transparent;
      box-sizing: border-box;
    `
    backFace.dataset.outlineColor = COLORS.phantom
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
 * Create and play the multi-phase flip animation:
 * 1a. Vertical cuts: Continuous vertical lines sweep left→right
 * 1b. Horizontal cuts: Continuous horizontal lines sweep top→bottom
 * 2.  Flip wave: Tiles flip to reveal incoming scene
 * 3a. Horizontal uncut: Horizontal lines disappear bottom→top
 * 3b. Vertical uncut: Vertical lines disappear right→left
 */
function createFlipAnimation(
  container: HTMLElement,
  tileDelays: TileDelay[],
  _config: CardFlipTransitionConfig,
  rows: number,
  cols: number
): Promise<void> {
  return new Promise((resolve) => {
    const tiles = container.querySelectorAll('.flip-tile')
    const frontFaces = container.querySelectorAll('.flip-tile-front')
    const backFaces = container.querySelectorAll('.flip-tile-back')

    // Phase timing
    const verticalCutDuration = 0.4    // Vertical lines sweep
    const horizontalCutDuration = 0.4  // Horizontal lines sweep
    const gapBetweenCuts = 0.06        // Brief pause between cut phases
    const gapBeforeFlip = 0.1          // Pause before flip starts

    const horizontalCutStart = verticalCutDuration + gapBetweenCuts
    const flipStartTime = horizontalCutStart + horizontalCutDuration + gapBeforeFlip
    const flipDuration = 0.4
    const maxStaggerDelay = Math.max(...tileDelays.map(t => t.delay))
    const flipEndTime = flipStartTime + maxStaggerDelay + flipDuration

    const gapAfterFlip = 0.1
    const uncutStartTime = flipEndTime + gapAfterFlip
    const horizontalUncutDuration = 0.3
    const verticalUncutDuration = 0.3
    const verticalUncutStart = uncutStartTime + horizontalUncutDuration + gapBetweenCuts

    // Create seeded random for column/row variation
    const rng = (() => {
      let seed = 42
      return () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return seed / 0x7fffffff
      }
    })()

    // Pre-calculate column delays with randomness (for vertical cuts)
    const colDelays: number[] = []
    const baseColDelay = verticalCutDuration / cols
    for (let c = 0; c < cols; c++) {
      const variation = (rng() - 0.5) * baseColDelay * 0.5 // ±25% variation
      colDelays.push(c * baseColDelay + variation)
    }

    // Pre-calculate row delays with randomness (for horizontal cuts)
    const rowDelays: number[] = []
    const baseRowDelay = horizontalCutDuration / rows
    for (let r = 0; r < rows; r++) {
      const variation = (rng() - 0.5) * baseRowDelay * 0.5 // ±25% variation
      rowDelays.push(r * baseRowDelay + variation)
    }

    console.log(`[CardFlip] Timing: vCut=0-${verticalCutDuration}s (${cols} cols) hCut=${horizontalCutStart.toFixed(2)}-${(horizontalCutStart + horizontalCutDuration).toFixed(2)}s (${rows} rows) flip=${flipStartTime.toFixed(2)}s`)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          ctx.revert()
          resolve()
        },
      })

      // Group tiles by column and row
      const tilesByCol: Map<number, HTMLElement[]> = new Map()
      const tilesByRow: Map<number, HTMLElement[]> = new Map()
      const frontByCol: Map<number, HTMLElement[]> = new Map()
      const frontByRow: Map<number, HTMLElement[]> = new Map()
      const backByCol: Map<number, HTMLElement[]> = new Map()
      const backByRow: Map<number, HTMLElement[]> = new Map()

      tiles.forEach((tile, i) => {
        const tileEl = tile as HTMLElement
        const col = parseInt(tileEl.dataset.col || '0', 10)
        const row = parseInt(tileEl.dataset.row || '0', 10)
        const frontFace = frontFaces[i] as HTMLElement
        const backFace = backFaces[i] as HTMLElement

        if (!tilesByCol.has(col)) tilesByCol.set(col, [])
        if (!tilesByRow.has(row)) tilesByRow.set(row, [])
        if (!frontByCol.has(col)) frontByCol.set(col, [])
        if (!frontByRow.has(row)) frontByRow.set(row, [])
        if (!backByCol.has(col)) backByCol.set(col, [])
        if (!backByRow.has(row)) backByRow.set(row, [])

        tilesByCol.get(col)!.push(tileEl)
        tilesByRow.get(row)!.push(tileEl)
        frontByCol.get(col)!.push(frontFace)
        frontByRow.get(row)!.push(frontFace)
        backByCol.get(col)!.push(backFace)
        backByRow.get(row)!.push(backFace)
      })

      // Phase 1a: Vertical cuts - continuous lines sweep left→right
      // All tiles in a column get their left/right borders at the same time
      for (let c = 0; c < cols; c++) {
        const delay = colDelays[c]
        const fronts = frontByCol.get(c) || []
        const backs = backByCol.get(c) || []

        tl.to(
          [...fronts, ...backs],
          {
            borderLeftWidth: '1px',
            borderRightWidth: '1px',
            borderColor: COLORS.cutLineAccent,
            duration: 0.02,
            ease: 'none',
          },
          delay
        )
      }

      // Phase 1b: Horizontal cuts - continuous lines sweep top→bottom
      // All tiles in a row get their top/bottom borders at the same time
      for (let r = 0; r < rows; r++) {
        const delay = horizontalCutStart + rowDelays[r]
        const fronts = frontByRow.get(r) || []
        const backs = backByRow.get(r) || []

        tl.to(
          [...fronts, ...backs],
          {
            borderTopWidth: '1px',
            borderBottomWidth: '1px',
            duration: 0.02,
            ease: 'none',
          },
          delay
        )
      }

      // Phase 2: Flip wave (outlines stay visible during flip)
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

      // Phase 3a: Horizontal uncut - continuous lines disappear bottom→top
      // Reverse order: bottom rows first
      for (let r = rows - 1; r >= 0; r--) {
        const reverseIndex = rows - 1 - r
        const delay = uncutStartTime + (reverseIndex * (horizontalUncutDuration / rows)) + (rng() - 0.5) * 0.03
        const fronts = frontByRow.get(r) || []
        const backs = backByRow.get(r) || []

        tl.to(
          [...fronts, ...backs],
          {
            borderTopWidth: '0px',
            borderBottomWidth: '0px',
            duration: 0.05,
            ease: 'power1.out',
          },
          delay
        )
      }

      // Phase 3b: Vertical uncut - continuous lines disappear right→left
      // Reverse order: right columns first
      for (let c = cols - 1; c >= 0; c--) {
        const reverseIndex = cols - 1 - c
        const delay = verticalUncutStart + (reverseIndex * (verticalUncutDuration / cols)) + (rng() - 0.5) * 0.03
        const fronts = frontByCol.get(c) || []
        const backs = backByCol.get(c) || []

        tl.to(
          [...fronts, ...backs],
          {
            borderLeftWidth: '0px',
            borderRightWidth: '0px',
            borderColor: 'transparent',
            duration: 0.05,
            ease: 'power1.out',
          },
          delay
        )
      }
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
    play: () => createFlipAnimation(element, tileDelays, config, dimensions.rows, dimensions.cols),
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

    // Helper to safely get element identifier (handles SVG elements)
    const getElementId = (el: Element): string => {
      const cn = el.className
      if (typeof cn === 'string' && cn) return cn.slice(0, 50)
      if (cn && typeof cn === 'object' && 'baseVal' in cn) return (cn as SVGAnimatedString).baseVal?.slice(0, 50) || el.tagName
      return el.tagName
    }

    // DIAGNOSTIC: Check for active tweens on outgoing scene elements
    const outgoingElements = [outgoing, ...outgoing.querySelectorAll('*')]
    const activeTweens: { element: string; progress: number; targets: string }[] = []
    outgoingElements.forEach(el => {
      const tweens = gsap.getTweensOf(el)
      tweens.forEach(tween => {
        const progress = tween.progress()
        if (progress < 1) {
          activeTweens.push({
            element: getElementId(el),
            progress: Math.round(progress * 100),
            targets: tween.targets().map((t: any) => getElementId(t)).join(', ')
          })
        }
      })
    })
    if (activeTweens.length > 0) {
      console.warn(`[CardFlip #${thisTransition}] ⚠️ ACTIVE TWEENS on outgoing scene:`, activeTweens)
    } else {
      console.log(`[CardFlip #${thisTransition}] ✓ No active tweens on outgoing scene`)
    }

    // DIAGNOSTIC: Check scrubbed ScrollTriggers
    const scrubbedTriggers = ScrollTrigger.getAll().filter(st => st.vars.scrub && st.animation)
    scrubbedTriggers.forEach(st => {
      const scrollProgress = st.progress
      const animProgress = st.animation!.progress()
      if (Math.abs(scrollProgress - animProgress) > 0.05) {
        console.warn(`[CardFlip #${thisTransition}] ⚠️ SCRUB LAG: scroll=${Math.round(scrollProgress * 100)}% anim=${Math.round(animProgress * 100)}%`)
      }
    })

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

    // IMPORTANT: Set scroll position and sync scrubbed animations BEFORE
    // showing the incoming scene. This ensures that scrubbed animations
    // (like ContentSlab in AboutScene) are at the correct progress when
    // the scene becomes visible, preventing a visible "re-animation".
    unlockScroll(config.targetScrollY)

    // Force ScrollTrigger to recalculate all triggers' progress based on
    // the new scroll position, then sync scrubbed animations immediately.
    ScrollTrigger.update()
    syncScrubbedAnimations()
    console.log('[CardFlip] Scroll position set and scrubbed animations synced')

    // For REVERSE transitions, force ContentSlab to visible state.
    // This prevents the issue where user's scroll momentum continues after
    // card-flip completes, causing the scrubbed animation to reverse and
    // fade out the ContentSlab.
    if (direction === 'reverse') {
      forceContentSlabVisible(incoming)
    }

    // NOW show incoming scene with correct animation states
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    incoming.style.zIndex = '20'
    outgoing.style.zIndex = '0'

    console.log('[CardFlip] Transition complete')

  } catch (error) {
    // On error, still need to unlock scroll
    unlockScroll(config.targetScrollY)
    throw error
  }
}
