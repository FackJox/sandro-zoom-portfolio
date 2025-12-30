/**
 * GSAP Plugin Registration
 *
 * Centralized GSAP setup with all required plugins.
 * Call registerGSAP() once on client before using any GSAP features.
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// Note: ScrollSmoother, SplitText, DrawSVGPlugin, MotionPathPlugin
// require GSAP Club membership. Uncomment when license is available.
// import { ScrollSmoother } from 'gsap/ScrollSmoother'
// import { SplitText } from 'gsap/SplitText'
// import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
// import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

let isRegistered = false

/**
 * Register all GSAP plugins.
 * Safe to call multiple times - only registers once.
 */
export function registerGSAP(): void {
  if (isRegistered) return

  gsap.registerPlugin(
    ScrollTrigger,
    // ScrollSmoother,
    // SplitText,
    // DrawSVGPlugin,
    // MotionPathPlugin,
  )

  isRegistered = true
}

/**
 * Check if GSAP plugins are registered.
 */
export function isGSAPRegistered(): boolean {
  return isRegistered
}

// Re-export GSAP and plugins for convenience
export { gsap, ScrollTrigger }
// export { ScrollSmoother, SplitText, DrawSVGPlugin, MotionPathPlugin }
