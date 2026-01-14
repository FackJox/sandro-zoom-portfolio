/**
 * Scroll Lock
 *
 * Uses GSAP Observer to intercept all scroll input during transitions.
 * This approach doesn't modify body/html styles, which would break fixed positioning.
 */

import { Observer, gsap } from '../core/gsap'

// Ensure Observer is registered
gsap.registerPlugin(Observer)

let scrollObserver: Observer | null = null

/**
 * Lock scroll by intercepting all scroll-related input events.
 * Uses GSAP Observer for cross-browser touch device support.
 */
export function lockScroll(): void {
  // Kill any existing observer
  scrollObserver?.kill()

  scrollObserver = Observer.create({
    type: 'wheel,touch,scroll',
    preventDefault: true,
    allowClicks: true,
    tolerance: 0,
    onPress: (self) => self.event?.preventDefault(),
  })

  console.log('[ScrollLock] Scroll locked')
}

/**
 * Unlock scroll and set position to target.
 *
 * @param targetScrollY - The scroll position to set after unlocking
 */
export function unlockScroll(targetScrollY: number): void {
  scrollObserver?.kill()
  scrollObserver = null

  // Set scroll to where the incoming scene begins
  window.scrollTo({ top: targetScrollY, behavior: 'instant' as ScrollBehavior })

  console.log(`[ScrollLock] Scroll unlocked, set to ${targetScrollY}px`)
}

/**
 * Check if scroll is currently locked.
 */
export function isScrollLocked(): boolean {
  return scrollObserver !== null
}
