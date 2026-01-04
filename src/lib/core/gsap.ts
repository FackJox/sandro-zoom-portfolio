/**
 * GSAP Plugin Registration
 *
 * Centralized GSAP setup with all required plugins.
 * Call registerGSAP() once on client before using any GSAP features.
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
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
    CustomEase,
    // ScrollSmoother,
    // SplitText,
    // DrawSVGPlugin,
    // MotionPathPlugin,
  )

  // Register portal transition easings
  CustomEase.create('irisMask', 'M0,0 C0.65,0 0.35,1 1,1')
  CustomEase.create('portalScale', 'M0,0 C0.4,0 0.2,1 1,1')
  CustomEase.create('portalIn', 'M0,0 C0,0 0.2,1 1,1')

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
export { gsap, ScrollTrigger, CustomEase }
// export { ScrollSmoother, SplitText, DrawSVGPlugin, MotionPathPlugin }
