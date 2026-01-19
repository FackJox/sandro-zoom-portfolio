/**
 * GSAP Plugin Registration
 *
 * Centralized GSAP setup with all required plugins.
 * Call registerGSAP() once on client before using any GSAP features.
 *
 * IMPORTANT: GSAP plugins reference browser globals (self, window) and cannot
 * be imported at module level due to SSR. All plugin imports are dynamic.
 */

import { browser } from '$app/environment'

let isRegistered = false
let gsapInstance: typeof import('gsap').gsap | null = null
let ScrollTriggerPlugin: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null
let CustomEasePlugin: typeof import('gsap/CustomEase').CustomEase | null = null
let FlipPlugin: any = null
let TextPluginInstance: any = null
let ObserverPlugin: any = null

/**
 * Register all GSAP plugins.
 * Safe to call multiple times - only registers once.
 * Must be called on client only.
 */
export async function registerGSAP(): Promise<void> {
  if (isRegistered) return
  if (!browser) return

  // Dynamic imports to avoid SSR issues with browser globals
  const [
    { gsap },
    { ScrollTrigger },
    { CustomEase },
    { Flip },
    { TextPlugin },
    { Observer }
  ] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/CustomEase'),
    import('gsap/dist/Flip'),
    import('gsap/dist/TextPlugin'),
    import('gsap/dist/Observer')
  ])

  // Store references for re-export
  gsapInstance = gsap
  ScrollTriggerPlugin = ScrollTrigger
  CustomEasePlugin = CustomEase
  FlipPlugin = Flip
  TextPluginInstance = TextPlugin
  ObserverPlugin = Observer

  gsap.registerPlugin(
    ScrollTrigger,
    CustomEase,
    Flip,
    TextPlugin,
    Observer
  )

  // Register portal transition easings
  CustomEase.create('irisMask', 'M0,0 C0.65,0 0.35,1 1,1')
  CustomEase.create('portalScale', 'M0,0 C0.4,0 0.2,1 1,1')
  CustomEase.create('portalIn', 'M0,0 C0,0 0.2,1 1,1')

  // Register brand physics easings
  CustomEase.create('ease-lock-on', 'M0,0 C0.19,1 0.22,1 1,1')
  CustomEase.create('ease-release', 'M0,0 C0.25,0 0.35,1 1,1')

  // Card flip bounce easing
  CustomEase.create('flipBounce', 'M0,0 C0.17,0.67 0.4,1.07 0.5,1.05 0.65,1.02 0.82,1 1,1')

  console.log('[GSAP] CustomEase registered')
  console.log('[GSAP] irisMask:', gsap.parseEase('irisMask'))
  console.log('[GSAP] portalScale:', gsap.parseEase('portalScale'))
  console.log('[GSAP] portalIn:', gsap.parseEase('portalIn'))

  // Expose gsap globally for console debugging
  ;(window as any).gsap = gsap

  isRegistered = true
}

/**
 * Check if GSAP plugins are registered.
 */
export function isGSAPRegistered(): boolean {
  return isRegistered
}

/**
 * Get GSAP instance. Throws if not registered.
 */
export function getGSAP() {
  if (!gsapInstance) throw new Error('GSAP not registered. Call registerGSAP() first.')
  return gsapInstance
}

/**
 * Get ScrollTrigger. Throws if not registered.
 */
export function getScrollTrigger() {
  if (!ScrollTriggerPlugin) throw new Error('GSAP not registered. Call registerGSAP() first.')
  return ScrollTriggerPlugin
}

/**
 * Get CustomEase. Throws if not registered.
 */
export function getCustomEase() {
  if (!CustomEasePlugin) throw new Error('GSAP not registered. Call registerGSAP() first.')
  return CustomEasePlugin
}

/**
 * Get Flip. Throws if not registered.
 */
export function getFlip() {
  if (!FlipPlugin) throw new Error('GSAP not registered. Call registerGSAP() first.')
  return FlipPlugin
}

/**
 * Get Observer. Throws if not registered.
 */
export function getObserver() {
  if (!ObserverPlugin) throw new Error('GSAP not registered. Call registerGSAP() first.')
  return ObserverPlugin
}

// Re-export for convenience (will be null until registerGSAP() is called)
// Components using these must ensure registerGSAP() was awaited first
export {
  gsapInstance as gsap,
  ScrollTriggerPlugin as ScrollTrigger,
  CustomEasePlugin as CustomEase,
  FlipPlugin as Flip,
  TextPluginInstance as TextPlugin,
  ObserverPlugin as Observer
}
