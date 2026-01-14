/**
 * Card Flip Transition
 *
 * Creates a grid of tiles that flip to reveal the incoming scene.
 * Uses html2canvas to capture the outgoing scene as a snapshot.
 */

import html2canvas from 'html2canvas'
import { gsap } from '../core/gsap'

// ============================================================================
// Scroll Lock Utility
// ============================================================================

interface ScrollLockState {
  scrollY: number
  bodyStyle: string
  htmlStyle: string
}

let scrollLockState: ScrollLockState | null = null

/**
 * Lock scroll position during async transitions.
 * Uses CSS fixed positioning pattern - robust across browsers.
 * Does NOT manipulate ScrollTriggers - scene state manager handles transition guards.
 */
export function lockScroll(): void {
  if (scrollLockState) return // Already locked

  const scrollY = window.scrollY

  scrollLockState = {
    scrollY,
    bodyStyle: document.body.style.cssText,
    htmlStyle: document.documentElement.style.cssText,
  }

  // Lock body in place with CSS only
  document.body.style.cssText = `
    ${document.body.style.cssText}
    position: fixed;
    top: -${scrollY}px;
    left: 0;
    right: 0;
    overflow: hidden;
  `

  console.log(`[ScrollLock] Locked at ${scrollY}px`)
}

/**
 * Unlock scroll and optionally snap to a target position.
 * @param targetScrollY - If provided, scroll to this position instead of original
 */
export function unlockScroll(targetScrollY?: number): void {
  if (!scrollLockState) return // Not locked

  // Restore original styles
  document.body.style.cssText = scrollLockState.bodyStyle
  document.documentElement.style.cssText = scrollLockState.htmlStyle

  // Scroll to target position (or back to where we were)
  const scrollTo = targetScrollY ?? scrollLockState.scrollY
  window.scrollTo(0, scrollTo)

  console.log(`[ScrollLock] Unlocked, scrolled to ${scrollTo}px`)

  scrollLockState = null
}

// ============================================================================
// Types
// ============================================================================

export interface CardFlipTransitionConfig {
  /** Total duration of the flip animation in seconds */
  duration: number
  /** How much of the duration is spread across stagger delays (scan corruption spread) */
  staggerDuration: number
  /** Target tile size in pixels (150 for desktop, 80 for mobile) */
  targetTileSize: number
}

export interface GridDimensions {
  cols: number
  rows: number
  tileWidth: number
  tileHeight: number
}

export interface CardFlipGrid {
  element: HTMLElement
  dimensions: GridDimensions
  play: () => Promise<void>
  destroy: () => void
}

// ============================================================================
// Grid Calculation
// ============================================================================

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

/**
 * Get the target tile size based on device.
 */
export function getTargetTileSize(): number {
  if (typeof window === 'undefined') return 150
  return window.innerWidth < 768 ? 80 : 150
}

// ============================================================================
// Scene Capture
// ============================================================================

/**
 * Capture a scene element as a base64 image using html2canvas.
 */
export async function captureScene(sceneElement: HTMLElement): Promise<string> {
  const canvas = await html2canvas(sceneElement, {
    useCORS: true,
    allowTaint: false,
    scale: window.devicePixelRatio,
    logging: false,
    backgroundColor: null,
  })
  return canvas.toDataURL('image/jpeg', 0.9)
}

// ============================================================================
// Grid Creation
// ============================================================================

/**
 * Create the flip grid DOM element with all tiles.
 */
export function createFlipGridElement(
  snapshot: string,
  dimensions: GridDimensions
): HTMLElement {
  const { cols, rows, tileWidth, tileHeight } = dimensions
  const viewportWidth = cols * tileWidth
  const viewportHeight = rows * tileHeight

  // Create container - NO background so incoming scene shows through
  const container = document.createElement('div')
  container.className = 'card-flip-grid'
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
    perspective: 1200px;
    pointer-events: none;
  `

  // Add subtle scan line overlay for digital feel (very light, doesn't block content)
  const scanLines = document.createElement('div')
  scanLines.className = 'scan-lines'
  scanLines.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 101;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(15, 23, 26, 0.02) 3px,
      rgba(15, 23, 26, 0.02) 4px
    );
  `
  container.appendChild(scanLines)

  // Create tiles
  const tileCount = cols * rows
  // Subtle gap between tiles (1px) for digital grid feel
  const gapSize = 1

  for (let i = 0; i < tileCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Adjust background position to account for gaps
    const bgPosX = -(col * tileWidth)
    const bgPosY = -(row * tileHeight)

    const tile = document.createElement('div')
    tile.className = 'flip-tile'
    tile.dataset.index = String(i)
    tile.style.cssText = `
      transform-style: preserve-3d;
      position: relative;
      margin: ${gapSize / 2}px;
    `

    // Front face (shows snapshot slice)
    const front = document.createElement('div')
    front.className = 'flip-tile-front'
    front.style.cssText = `
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      background-image: url(${snapshot});
      background-size: ${viewportWidth}px ${viewportHeight}px;
      background-position: ${bgPosX}px ${bgPosY}px;
      border: 1px solid rgba(70, 79, 76, 0.2);
    `

    // Back face with subtle accent edge (Egg Toast) - digital activation state
    const back = document.createElement('div')
    back.className = 'flip-tile-back'
    back.style.cssText = `
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      transform: rotateX(180deg);
      background: transparent;
      box-shadow: inset 0 0 0 1px rgba(246, 198, 5, 0.15);
    `

    tile.appendChild(front)
    tile.appendChild(back)
    container.appendChild(tile)
  }

  return container
}

// ============================================================================
// Animation
// ============================================================================

/**
 * Seeded random number generator for reproducible "random" patterns.
 * Uses mulberry32 algorithm.
 */
function seededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/**
 * Calculate tile delay using "scan corruption" pattern.
 *
 * Tiles flip in a pattern that resembles digital data refresh:
 * - Base timing follows horizontal scan lines (row-by-row)
 * - Random variation within each row creates "data corruption" feel
 * - Some tiles flip early/late like transmission glitches
 *
 * This aligns with the Machine/Documentary brand archetype:
 * mechanical, rhythmic, but with controlled imperfection.
 */
function getTileDelay(
  index: number,
  cols: number,
  rows: number,
  staggerDuration: number
): number {
  const col = index % cols
  const row = Math.floor(index / cols)

  // Use seeded random for reproducible results
  const random = seededRandom(index * 1337)

  // Base delay: row-by-row scan (top to bottom)
  // Each row starts slightly after the previous
  const rowProgress = row / Math.max(rows - 1, 1)
  const baseDelay = rowProgress * staggerDuration * 0.7

  // Random variation within row (±30% of row timing)
  // Creates the "data corruption" / transmission latency feel
  const rowVariation = (random() - 0.5) * staggerDuration * 0.3

  // Occasional "glitch" tiles that flip much earlier or later
  // ~10% chance of being a glitch tile
  const isGlitch = random() < 0.1
  const glitchOffset = isGlitch ? (random() - 0.5) * staggerDuration * 0.5 : 0

  // Column influence: slight left-to-right bias within each row
  // Like a CRT scan line
  const colProgress = col / Math.max(cols - 1, 1)
  const colDelay = colProgress * staggerDuration * 0.15

  const totalDelay = baseDelay + rowVariation + glitchOffset + colDelay

  // Clamp to valid range
  return Math.max(0, Math.min(totalDelay, staggerDuration))
}

/**
 * Create and play the flip animation timeline.
 *
 * Uses 'ease-lock-on' easing from the brand physics:
 * "Fast acquisition, smooth settle—like a gimbal finding and locking onto a subject."
 * No bounce, no overshoot. Cameras don't hunt.
 */
function createFlipAnimation(
  container: HTMLElement,
  dimensions: GridDimensions,
  config: CardFlipTransitionConfig
): Promise<void> {
  return new Promise((resolve) => {
    const tiles = container.querySelectorAll('.flip-tile')
    const { cols, rows } = dimensions
    const { duration, staggerDuration } = config
    const flipDuration = duration - staggerDuration

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          ctx.revert()
          resolve()
        },
      })

      tiles.forEach((tile, i) => {
        const delay = getTileDelay(i, cols, rows, staggerDuration)
        tl.to(
          tile,
          {
            rotateX: 180,
            duration: flipDuration,
            // Brand physics: "ease-lock-on" - fast acquisition, smooth settle
            // No bounce, no overshoot. Precision landing.
            ease: 'ease-lock-on',
          },
          delay
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
  snapshot: string,
  config: CardFlipTransitionConfig
): CardFlipGrid {
  const targetSize = config.targetTileSize || getTargetTileSize()
  const dimensions = calculateGrid(
    window.innerWidth,
    window.innerHeight,
    targetSize
  )

  const element = createFlipGridElement(snapshot, dimensions)
  document.body.appendChild(element)

  return {
    element,
    dimensions,
    play: () => createFlipAnimation(element, dimensions, config),
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    },
  }
}

/**
 * Execute the complete card flip transition with scroll locking.
 *
 * @param outgoing - The outgoing scene element
 * @param incoming - The incoming scene element
 * @param config - Transition configuration
 * @param targetScrollY - Scroll position to snap to after transition completes
 */
export async function executeCardFlipTransition(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  config: CardFlipTransitionConfig,
  targetScrollY?: number
): Promise<void> {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) {
    // Instant transition, no flip
    gsap.set(outgoing, { autoAlpha: 0, scale: 1 })
    gsap.set(incoming, { autoAlpha: 1, scale: 1 })
    if (targetScrollY !== undefined) {
      window.scrollTo(0, targetScrollY)
    }
    return
  }

  console.log('[CardFlip] Starting transition...')

  // 1. IMMEDIATELY lock scroll to prevent user scrolling during async operations
  lockScroll()

  try {
    // 2. Capture outgoing scene BEFORE any visibility changes
    // Ensure outgoing is at scale 1 for proper capture
    gsap.set(outgoing, { scale: 1 })
    const snapshot = await captureScene(outgoing)
    console.log('[CardFlip] Scene captured')

    // 3. Reset incoming scene transform and make it visible behind grid
    // CRITICAL: Reset scale to 1 (portal setup sets it to 2.0)
    gsap.set(incoming, {
      scale: 1,
      autoAlpha: 1,
      clearProps: 'transform', // Clear any transform from portal setup
    })
    incoming.style.visibility = 'visible'
    incoming.style.opacity = '1'
    incoming.style.zIndex = '10' // Behind grid (100) but in front of hidden outgoing

    // 4. Mount grid overlay (z-index 100)
    const grid = mountCardFlipGrid(snapshot, config)
    console.log(`[CardFlip] Grid mounted: ${grid.dimensions.cols}x${grid.dimensions.rows}`)

    // 5. Hide outgoing DOM (grid shows the snapshot instead)
    outgoing.style.visibility = 'hidden'
    outgoing.style.opacity = '0'
    outgoing.style.zIndex = '0'
    gsap.set(outgoing, { autoAlpha: 0 })

    // 6. Play flip animation - tiles flip to reveal incoming scene behind
    console.log('[CardFlip] Starting flip animation...')
    await grid.play()
    console.log('[CardFlip] Flip animation complete')

    // 7. Cleanup grid - incoming scene now fully visible
    grid.destroy()
    console.log('[CardFlip] Grid destroyed')

  } finally {
    // 8. ALWAYS unlock scroll, even if an error occurred
    // Snap to target position so timeline is in correct state
    unlockScroll(targetScrollY)
    console.log('[CardFlip] Transition complete')
  }
}
