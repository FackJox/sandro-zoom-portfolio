/**
 * Card Flip Transition (Alpine Noir / Machine Archetype)
 *
 * Creates a grid of tiles that flip to reveal the incoming scene.
 * Uses scan corruption pattern with row-by-row animation and glitch tiles.
 *
 * Visual Treatment:
 * - 1px gaps between tiles (Black Stallion visible through gaps)
 * - Front face: subtle border (Cover of Night at 20% opacity)
 * - Back face: Egg Toast accent (15% opacity) - digital activation state
 * - Scan line overlay on entire grid
 */

import { domToCanvas } from 'modern-screenshot'
import { getCanvases } from './cache'
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
 *
 * Tiles flip in a scan pattern (top→bottom, left→right within each row)
 * with random timing variation to simulate data transmission latency.
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

  // Base delay per row (stagger spread across all rows)
  const rowDelay = staggerDuration / rows

  for (let i = 0; i < tileCount; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    // Base scan timing: row position + column offset within row
    const colOffset = (col / cols) * rowDelay * 0.3  // 30% variation within row
    let delay = row * rowDelay + colOffset

    // Add random "latency" variation (-10% to +10% of row delay)
    const latencyVariation = (rng() - 0.5) * 0.2 * rowDelay
    delay += latencyVariation

    // 10% chance of glitch tile (flips at unexpected time)
    const isGlitch = rng() < glitchProbability
    if (isGlitch) {
      // Glitch tiles flip either early or late (±30% of total stagger)
      const glitchOffset = (rng() - 0.5) * 0.6 * staggerDuration
      delay = Math.max(0, delay + glitchOffset)
    }

    delays.push({ index: i, delay, isGlitch })
  }

  return delays
}

// ============================================================================
// Scene Capture
// ============================================================================

/**
 * Capture a scene element as a canvas using modern-screenshot.
 * Returns the canvas directly (no base64 conversion).
 */
export async function captureScene(sceneElement: HTMLElement): Promise<HTMLCanvasElement> {
  // Wait for all fonts to be loaded before capturing
  await document.fonts.ready

  const canvas = await domToCanvas(sceneElement, {
    scale: window.devicePixelRatio,
    backgroundColor: null,
    style: {
      visibility: 'visible',
      opacity: '1',
    },
    // Font embedding options
    font: {
      preferredFormat: 'woff2',
    },
  })
  return canvas
}

// ============================================================================
// Grid Creation (Alpine Noir Visual Treatment)
// ============================================================================

/**
 * Create the flip grid DOM element with all tiles.
 * Includes digital visual treatment: 1px gaps, borders, scan lines.
 *
 * @param outgoingCanvas - Canvas of the outgoing scene (front face)
 * @param incomingCanvas - Canvas of the incoming scene (back face)
 */
export function createFlipGridElement(
  outgoingCanvas: HTMLCanvasElement,
  incomingCanvas: HTMLCanvasElement,
  dimensions: GridDimensions,
  tileDelays: TileDelay[]
): HTMLElement {
  const { cols, rows, tileWidth, tileHeight } = dimensions

  // Create container with 1px gaps
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
    gap: 1px;
    background: ${COLORS.blackStallion};
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

  // Create tiles using canvas-to-canvas drawing
  const tileCount = cols * rows
  for (let i = 0; i < tileCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const isGlitch = tileDelays[i]?.isGlitch ?? false

    const tile = document.createElement('div')
    tile.className = `flip-tile${isGlitch ? ' glitch' : ''}`
    tile.dataset.index = String(i)
    tile.style.cssText = `
      transform-style: preserve-3d;
      position: relative;
    `

    // Front face canvas (shows OUTGOING scene slice)
    const frontCanvas = document.createElement('canvas')
    frontCanvas.width = tileWidth * window.devicePixelRatio
    frontCanvas.height = tileHeight * window.devicePixelRatio
    frontCanvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      box-shadow: inset 0 0 0 1px ${isGlitch ? COLORS.eggToastGlitch : COLORS.coverOfNight};
    `
    const frontCtx = frontCanvas.getContext('2d')
    if (frontCtx) {
      frontCtx.drawImage(
        outgoingCanvas,
        col * tileWidth * window.devicePixelRatio,
        row * tileHeight * window.devicePixelRatio,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio,
        0,
        0,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio
      )
    }

    // Back face canvas (shows INCOMING scene slice)
    const backCanvas = document.createElement('canvas')
    backCanvas.width = tileWidth * window.devicePixelRatio
    backCanvas.height = tileHeight * window.devicePixelRatio
    backCanvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      transform: rotateX(180deg);
      box-shadow: inset 0 0 0 1px ${COLORS.eggToast};
    `
    const backCtx = backCanvas.getContext('2d')
    if (backCtx) {
      backCtx.drawImage(
        incomingCanvas,
        col * tileWidth * window.devicePixelRatio,
        row * tileHeight * window.devicePixelRatio,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio,
        0,
        0,
        tileWidth * window.devicePixelRatio,
        tileHeight * window.devicePixelRatio
      )
    }

    tile.appendChild(frontCanvas)
    tile.appendChild(backCanvas)
    container.appendChild(tile)
  }

  return container
}

// ============================================================================
// Animation
// ============================================================================

/**
 * Create and play the flip animation timeline.
 * Uses ease-lock-on for mechanical precision (no bounce/overshoot).
 */
function createFlipAnimation(
  container: HTMLElement,
  dimensions: GridDimensions,
  tileDelays: TileDelay[],
  config: CardFlipTransitionConfig
): Promise<void> {
  return new Promise((resolve) => {
    const tiles = container.querySelectorAll('.flip-tile')
    const { duration, staggerDuration } = config
    const flipDuration = duration - staggerDuration

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          ctx.revert()
          resolve()
        },
      })

      // Use pre-calculated scan delays
      tileDelays.forEach(({ index, delay }) => {
        const tile = tiles[index]
        if (!tile) return

        tl.to(
          tile,
          {
            rotateX: 180,
            duration: flipDuration,
            ease: 'ease-lock-on',  // Mechanical: fast acquisition, smooth settle
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
 *
 * @param outgoingCanvas - Canvas of the outgoing scene (front face)
 * @param incomingCanvas - Canvas of the incoming scene (back face)
 * @param config - Transition configuration
 */
export function mountCardFlipGrid(
  outgoingCanvas: HTMLCanvasElement,
  incomingCanvas: HTMLCanvasElement,
  config: CardFlipTransitionConfig
): CardFlipGrid {
  const targetSize = getTargetTileSize()
  const dimensions = calculateGrid(
    window.innerWidth,
    window.innerHeight,
    targetSize
  )

  const tileDelays = calculateScanDelays(
    dimensions.cols,
    dimensions.rows,
    config.staggerDuration,
    config.glitchProbability,
    config.seed
  )

  const element = createFlipGridElement(outgoingCanvas, incomingCanvas, dimensions, tileDelays)
  document.body.appendChild(element)

  return {
    element,
    dimensions,
    tileDelays,
    play: () => createFlipAnimation(element, dimensions, tileDelays, config),
    destroy: () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    },
  }
}

/**
 * Execute the complete card flip transition.
 * Uses pre-cached canvases when available, falls back to live capture.
 *
 * @param outgoing - The outgoing scene element
 * @param incoming - The incoming scene element
 * @param config - Transition configuration including targetScrollY
 * @param direction - 'forward' (default) or 'reverse' for scrolling back
 */
export async function executeCardFlipTransition(
  outgoing: HTMLElement,
  incoming: HTMLElement,
  config: ExecuteCardFlipConfig,
  direction: 'forward' | 'reverse' = 'forward'
): Promise<void> {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) {
    // Instant transition, no flip
    gsap.set(outgoing, { autoAlpha: 0 })
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    outgoing.style.visibility = 'hidden'
    outgoing.style.zIndex = '0'
    incoming.style.zIndex = '20'
    window.scrollTo({ top: config.targetScrollY, behavior: 'instant' as ScrollBehavior })
    return
  }

  // 1. Lock scroll immediately
  lockScroll()

  try {
    console.log(`[CardFlip] Starting ${direction} transition...`)

    // 2. Try to get cached canvases
    let outgoingCanvas: HTMLCanvasElement
    let incomingCanvas: HTMLCanvasElement

    const cached = getCanvases()

    if (cached) {
      console.log('[CardFlip] Using cached canvases')
      // For forward: outgoing=about, incoming=services
      // For reverse: outgoing=services, incoming=about
      outgoingCanvas = direction === 'forward' ? cached.about : cached.services
      incomingCanvas = direction === 'forward' ? cached.services : cached.about
    } else {
      // Fallback: capture live (shouldn't happen if warmup worked)
      console.warn('[CardFlip] Cache miss - capturing live')

      outgoingCanvas = await captureScene(outgoing)

      // Temporarily show incoming to capture
      gsap.set(incoming, { autoAlpha: 1 })
      incoming.style.visibility = 'visible'

      incomingCanvas = await captureScene(incoming)

      // Hide incoming again
      gsap.set(incoming, { autoAlpha: 0 })
      incoming.style.visibility = 'hidden'
    }

    // 3. Mount grid overlay with canvases
    const grid = mountCardFlipGrid(outgoingCanvas, incomingCanvas, config)
    console.log(`[CardFlip] Grid mounted: ${grid.dimensions.cols}x${grid.dimensions.rows} (${grid.tileDelays.filter(t => t.isGlitch).length} glitch tiles)`)

    // 4. Hide outgoing DOM (grid shows its canvas)
    gsap.set(outgoing, { autoAlpha: 0 })
    outgoing.style.visibility = 'hidden'

    // 5. Play flip animation
    console.log('[CardFlip] Starting flip animation...')
    await grid.play()
    console.log('[CardFlip] Flip animation complete')

    // 6. Cleanup grid
    grid.destroy()

    // 7. Show incoming, update z-index states
    gsap.set(incoming, { autoAlpha: 1 })
    incoming.style.visibility = 'visible'
    incoming.style.zIndex = '20'
    outgoing.style.zIndex = '0'

    console.log('[CardFlip] Transition complete')

  } finally {
    // 8. Always unlock scroll, even if error
    unlockScroll(config.targetScrollY)
  }
}
