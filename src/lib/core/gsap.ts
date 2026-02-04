/**
 * GSAP Plugin Registration
 *
 * Centralized GSAP setup with all required plugins.
 * Call registerGSAP() once on client before using any GSAP features.
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { Flip } from 'gsap/dist/Flip'
import { TextPlugin } from 'gsap/dist/TextPlugin'
import { Observer } from 'gsap/dist/Observer'
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
    ScrollToPlugin,
    CustomEase,
    Flip,
    TextPlugin,
    Observer,
    // ScrollSmoother,
    // SplitText,
    // DrawSVGPlugin,
    // MotionPathPlugin,
  )

  // Register portal transition easings
  CustomEase.create('irisMask', 'M0,0 C0.65,0 0.35,1 1,1')
  CustomEase.create('portalScale', 'M0,0 C0.4,0 0.2,1 1,1')
  CustomEase.create('portalIn', 'M0,0 C0,0 0.2,1 1,1')

  // Register brand physics easings
  // From: docs/Brand Physics Archtype.md
  CustomEase.create('ease-lock-on', 'M0,0 C0.19,1 0.22,1 1,1')
  CustomEase.create('ease-release', 'M0,0 C0.25,0 0.35,1 1,1')

  // Card flip bounce easing - peaks at ~105% (≈190°), settles to 100% (180°)
  // Creates the satisfying "overshoot and settle" effect
  CustomEase.create('flipBounce', 'M0,0 C0.17,0.67 0.4,1.07 0.5,1.05 0.65,1.02 0.82,1 1,1')

  // DEBUG: Verify custom easings are registered
  if (typeof window !== 'undefined') {
    console.log('[GSAP] CustomEase registered')
    console.log('[GSAP] irisMask:', gsap.parseEase('irisMask'))
    console.log('[GSAP] portalScale:', gsap.parseEase('portalScale'))
    console.log('[GSAP] portalIn:', gsap.parseEase('portalIn'))
    // Expose gsap globally for console debugging
    ;(window as any).gsap = gsap
  }

  isRegistered = true
}

/**
 * Check if GSAP plugins are registered.
 */
export function isGSAPRegistered(): boolean {
  return isRegistered
}

// Re-export GSAP and plugins for convenience
export { gsap, ScrollTrigger, ScrollToPlugin, CustomEase, Flip, TextPlugin, Observer }
// export { ScrollSmoother, SplitText, DrawSVGPlugin, MotionPathPlugin }
