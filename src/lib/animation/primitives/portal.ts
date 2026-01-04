/**
 * Portal Zoom Transition
 *
 * Creates the NatGeo-style circular mask transition between scenes.
 * The mask shrinks faster than the scale, creating an "iris closing" effect.
 */

import { gsap } from '../../core/gsap'

// ============================================================================
// Types
// ============================================================================

export interface PortalTransitionConfig {
  /** Duration in seconds (default: 0.8) */
  duration?: number
  /** Anchor point for the mask (default: { x: '50%', y: '45%' }) */
  anchor?: { x: string; y: string }
  /** Text selectors within scenes for staggered animation */
  textSelector?: string
}

export interface PortalTimeline {
  timeline: gsap.core.Timeline
  duration: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<PortalTransitionConfig> = {
  duration: 1.6,  // Doubled for smoother scroll-linked animation
  anchor: { x: '50%', y: '45%' },
  textSelector: '[data-animate="text"]',
}

// ============================================================================
// Portal Transition Factory
// ============================================================================

/**
 * Create a portal zoom transition timeline between two scenes.
 *
 * @param outgoingScene - DOM element or selector for the scene being masked out
 * @param incomingScene - DOM element or selector for the scene being revealed
 * @param config - Transition configuration
 * @returns Timeline object with the portal transition
 *
 * @example
 * ```typescript
 * const { timeline } = createPortalTransition('#scene-1', '#scene-2')
 *
 * ScrollTrigger.create({
 *   trigger: '.transition-zone',
 *   start: 'top top',
 *   end: '+=500',
 *   scrub: true,
 *   animation: timeline,
 * })
 * ```
 */
export function createPortalTransition(
  outgoingScene: gsap.TweenTarget,
  incomingScene: gsap.TweenTarget,
  config: PortalTransitionConfig = {}
): PortalTimeline {
  const { duration, anchor, textSelector } = { ...DEFAULT_CONFIG, ...config }

  const tl = gsap.timeline({ paused: true })

  const anchorPoint = `${anchor.x} ${anchor.y}`
  const clipStart = `circle(150% at ${anchorPoint})`
  const clipEnd = `circle(0% at ${anchorPoint})`

  // DEBUG: Log transition creation
  console.log(`[Portal] Creating transition | duration=${duration}s anchor=${anchorPoint}`)

  // -------------------------------------------------------------------------
  // Outgoing Scene: Scale (slower easing) - use fromTo for consistent behavior
  // -------------------------------------------------------------------------
  tl.fromTo(outgoingScene,
    {
      scale: 1,
      transformOrigin: anchorPoint,
    },
    {
      scale: 0.3,
      duration,
      ease: 'portalScale',
      onStart: () => console.log('[Portal] Outgoing scale started'),
      onComplete: () => console.log('[Portal] Outgoing scale complete'),
    },
    0
  )

  // -------------------------------------------------------------------------
  // Outgoing Scene: Mask (faster easing - creates iris effect)
  // -------------------------------------------------------------------------
  tl.fromTo(outgoingScene,
    {
      clipPath: clipStart,
    },
    {
      clipPath: clipEnd,
      duration,
      ease: 'irisMask',
      onUpdate: function() {
        const progress = this.progress()
        if (progress > 0.24 && progress < 0.26) {
          console.log('[Portal] Mask at 25%:', (this.targets()[0] as HTMLElement).style.clipPath)
        }
        if (progress > 0.49 && progress < 0.51) {
          console.log('[Portal] Mask at 50%:', (this.targets()[0] as HTMLElement).style.clipPath)
        }
      },
    },
    0
  )

  // -------------------------------------------------------------------------
  // Outgoing Scene: Final opacity fade (last 25% of duration)
  // -------------------------------------------------------------------------
  tl.fromTo(outgoingScene,
    { opacity: 1 },
    {
      opacity: 0,
      duration: duration * 0.25,
      ease: 'none',
    },
    duration * 0.75
  )

  // -------------------------------------------------------------------------
  // Incoming Scene: Scale settle + opacity
  // -------------------------------------------------------------------------
  tl.fromTo(incomingScene,
    {
      scale: 1.15,
      opacity: 0.85,
    },
    {
      scale: 1,
      opacity: 1,
      duration,
      ease: 'portalIn',
      onStart: () => console.log('[Portal] Incoming scale started'),
      onComplete: () => console.log('[Portal] Incoming scale complete'),
    },
    0
  )

  // -------------------------------------------------------------------------
  // Outgoing Text: Slide out left with stagger
  // -------------------------------------------------------------------------
  const outgoingEl = typeof outgoingScene === 'string'
    ? document.querySelector(outgoingScene)
    : outgoingScene
  const outgoingText = outgoingEl
    ? gsap.utils.toArray((outgoingEl as Element).querySelectorAll(textSelector))
    : []
  if (outgoingText.length > 0) {
    console.log('[Portal] Outgoing text elements:', outgoingText.length)
    tl.fromTo(outgoingText,
      { x: 0, opacity: 1 },
      {
        x: -60,
        opacity: 0,
        duration: duration * 0.5,
        stagger: 0.08,
        ease: 'power2.in',
      },
      0
    )
  }

  // -------------------------------------------------------------------------
  // Incoming Text: Slide in from right with stagger (delayed)
  // -------------------------------------------------------------------------
  const incomingEl = typeof incomingScene === 'string'
    ? document.querySelector(incomingScene)
    : incomingScene
  const incomingText = incomingEl
    ? gsap.utils.toArray((incomingEl as Element).querySelectorAll(textSelector))
    : []
  if (incomingText.length > 0) {
    console.log('[Portal] Incoming text elements:', incomingText.length)
    tl.fromTo(incomingText,
      { x: 60, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: duration * 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      },
      duration * 0.3  // Start after 30% of transition
    )
  }

  return {
    timeline: tl,
    duration,
  }
}

/**
 * Set up initial state for a scene that will be the outgoing scene.
 * Call this on mount to ensure proper starting state.
 */
export function setupOutgoingScene(scene: gsap.TweenTarget, anchor = { x: '50%', y: '45%' }): void {
  const anchorPoint = `${anchor.x} ${anchor.y}`

  gsap.set(scene, {
    clipPath: `circle(150% at ${anchorPoint})`,
    scale: 1,
    opacity: 1,
    transformOrigin: anchorPoint,
  })

  console.log(`[Portal] Setup outgoing scene`)
}

/**
 * Set up initial state for a scene that will be the incoming scene.
 * Call this on mount to ensure proper starting state.
 */
export function setupIncomingScene(scene: gsap.TweenTarget, anchor = { x: '50%', y: '45%' }): void {
  const anchorPoint = `${anchor.x} ${anchor.y}`

  gsap.set(scene, {
    scale: 1.15,
    opacity: 0.85,
    transformOrigin: anchorPoint,
  })

  console.log(`[Portal] Setup incoming scene`)
}
