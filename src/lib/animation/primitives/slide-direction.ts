/**
 * Slide Direction Detection
 *
 * Determines optimal slide-in direction based on element's screen position.
 * Used by portal transitions to create natural entrance animations.
 */

export type SlideDirection = 'left' | 'right' | 'up' | 'down'

export type SlideGroupPattern = 'nearest-edge' | 'alternating-h' | 'alternating-v' | 'auto'

export interface SlideDirectionConfig {
  /** Threshold for edge detection (0-0.5, default: 0.3) */
  edgeThreshold?: number
}

/**
 * Get direction offset for animation.
 * Converts direction to x/y offset values.
 */
export function getDirectionOffset(
  direction: SlideDirection,
  distance: number
): { x: number; y: number } {
  switch (direction) {
    case 'left':
      return { x: -distance, y: 0 }
    case 'right':
      return { x: distance, y: 0 }
    case 'up':
      return { x: 0, y: -distance }
    case 'down':
      return { x: 0, y: distance }
    default:
      return { x: distance, y: 0 } // Default to right
  }
}

/**
 * Get slide direction based on element's viewport position.
 * Calculates which edge the element is closest to.
 */
export function getSlideDirection(
  element: Element,
  config: SlideDirectionConfig = {}
): SlideDirection {
  const { edgeThreshold = 0.3 } = config

  const rect = element.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // Calculate center point as relative position (0-1)
  const centerX = (rect.left + rect.width / 2) / viewport.width
  const centerY = (rect.top + rect.height / 2) / viewport.height

  // Calculate distances from each edge (0 = at edge, 0.5 = center)
  const distances = {
    left: centerX,
    right: 1 - centerX,
    up: centerY,
    down: 1 - centerY,
  }

  // Find minimum distance (closest edge)
  let closestEdge: SlideDirection = 'down'
  let minDistance = Infinity

  for (const [edge, dist] of Object.entries(distances)) {
    if (dist < minDistance) {
      minDistance = dist
      closestEdge = edge as SlideDirection
    }
  }

  // If element is too centered (no edge closer than threshold), default to bottom
  if (minDistance > edgeThreshold) {
    return 'down'
  }

  return closestEdge
}

/**
 * Get slide direction for mobile context.
 * Simplified: mostly uses left/right alternation for vertically stacked elements.
 */
export function getMobileSlideDirection(
  element: Element,
  index: number
): SlideDirection {
  // Alternate left/right based on index
  return index % 2 === 0 ? 'right' : 'left'
}

/**
 * Get slide directions for a group of elements.
 * Supports predefined patterns or automatic detection.
 */
export function getGroupSlideDirections(
  elements: Element[],
  pattern: SlideGroupPattern,
  isMobile: boolean = false
): Map<Element, SlideDirection> {
  const directions = new Map<Element, SlideDirection>()

  switch (pattern) {
    case 'alternating-h':
      // Horizontal alternation: right, left, right, left...
      elements.forEach((el, i) => {
        directions.set(el, i % 2 === 0 ? 'right' : 'left')
      })
      break

    case 'alternating-v':
      // Vertical alternation: down, up, down, up...
      elements.forEach((el, i) => {
        directions.set(el, i % 2 === 0 ? 'down' : 'up')
      })
      break

    case 'nearest-edge':
      // Auto-detect based on position
      elements.forEach((el, i) => {
        if (isMobile) {
          // Mobile uses alternating-h for stacked layouts
          directions.set(el, i % 2 === 0 ? 'right' : 'left')
        } else {
          directions.set(el, getSlideDirection(el))
        }
      })
      break

    case 'auto':
    default:
      // Pure auto-detection
      elements.forEach((el) => {
        directions.set(el, getSlideDirection(el))
      })
      break
  }

  return directions
}

/**
 * Group elements by their slide direction for efficient batch animation.
 */
export function groupElementsByDirection(
  directions: Map<Element, SlideDirection>
): Record<SlideDirection, Element[]> {
  const groups: Record<SlideDirection, Element[]> = {
    left: [],
    right: [],
    up: [],
    down: [],
  }

  for (const [element, direction] of directions) {
    groups[direction].push(element)
  }

  return groups
}
