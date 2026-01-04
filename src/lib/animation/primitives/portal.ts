/**
 * Portal Zoom Transition
 *
 * Creates the NatGeo-style circular mask transition between scenes.
 * The mask shrinks faster than the scale, creating an "iris closing" effect.
 *
 * @example
 * ```svelte
 * <!-- Scene with directional text animations -->
 * <div data-scene="hero">
 *   <div data-animate="text" data-direction="left">Slides from left</div>
 *   <div data-animate="text" data-direction="right">Slides from right</div>
 *   <div data-animate="text" data-direction="up">Slides from top</div>
 *   <div data-animate="text" data-direction="down">Slides from bottom</div>
 * </div>
 * ```
 */

import { gsap } from '../../core/gsap'

// ============================================================================
// Types
// ============================================================================

export interface PortalTextAnimationConfig {
  /** Distance in pixels to animate from (default: 100) */
  distance?: number
  /** Duration as proportion of total transition (default: 0.5) */
  durationRatio?: number
  /** Start time as proportion of total transition (default: 0.3) */
  startRatio?: number
  /** Stagger between elements in seconds (default: 0.1) */
  stagger?: number
  /** Easing function (default: 'power2.out') */
  ease?: string
}

export interface PortalTransitionConfig {
  /** Duration in seconds (default: 1.6) */
  duration?: number
  /** Anchor point for the mask (default: { x: '50%', y: '45%' }) */
  anchor?: { x: string; y: string }
  /** Text selectors within scenes for staggered animation */
  textSelector?: string
  /** Initial scale for incoming scene zoom-out reveal (default: 2.0) */
  incomingScale?: number
  /** Final scale for outgoing scene (default: 0.3) */
  outgoingScale?: number
  /** Text animation configuration */
  textAnimation?: PortalTextAnimationConfig
  /** Enable debug logging (default: false in production) */
  debug?: boolean
}

export interface PortalTimeline {
  timeline: gsap.core.Timeline
  duration: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TEXT_ANIMATION: Required<PortalTextAnimationConfig> = {
  distance: 100,
  durationRatio: 0.5,
  startRatio: 0.3,
  stagger: 0.1,
  ease: 'power2.out',
}

const DEFAULT_CONFIG: Required<Omit<PortalTransitionConfig, 'textAnimation' | 'debug'>> & {
  textAnimation: Required<PortalTextAnimationConfig>
  debug: boolean
} = {
  duration: 1.6,
  anchor: { x: '50%', y: '45%' },
  textSelector: '[data-animate="text"]',
  incomingScale: 2.0,
  outgoingScale: 0.3,
  textAnimation: DEFAULT_TEXT_ANIMATION,
  debug: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
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
 * // Basic usage
 * const { timeline } = createPortalTransition('#scene-1', '#scene-2')
 *
 * // With custom configuration
 * const { timeline } = createPortalTransition('#scene-1', '#scene-2', {
 *   duration: 2.0,
 *   incomingScale: 1.5,
 *   textAnimation: { distance: 150 }
 * })
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
  // Merge configs with defaults
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    textAnimation: { ...DEFAULT_TEXT_ANIMATION, ...config.textAnimation },
  }

  const {
    duration,
    anchor,
    textSelector,
    incomingScale,
    outgoingScale,
    textAnimation,
    debug,
  } = mergedConfig

  const tl = gsap.timeline({ paused: true })

  const anchorPoint = `${anchor.x} ${anchor.y}`
  const clipStart = `circle(150% at ${anchorPoint})`
  const clipEnd = `circle(0% at ${anchorPoint})`

  // Conditional debug logging
  const log = debug ? console.log.bind(console) : () => {}

  log(`[Portal] Creating transition | duration=${duration}s anchor=${anchorPoint} scale=${incomingScale}`)

  // -------------------------------------------------------------------------
  // Outgoing Scene: Scale (slower easing) - use fromTo for consistent behavior
  // -------------------------------------------------------------------------
  tl.fromTo(outgoingScene,
    {
      scale: 1,
      transformOrigin: anchorPoint,
    },
    {
      scale: outgoingScale,
      duration,
      ease: 'portalScale',
      onStart: () => log('[Portal] Outgoing scale started'),
      onComplete: () => log('[Portal] Outgoing scale complete'),
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
      onUpdate: debug ? function() {
        const progress = this.progress()
        if (progress > 0.24 && progress < 0.26) {
          log('[Portal] Mask at 25%:', (this.targets()[0] as HTMLElement).style.clipPath)
        }
        if (progress > 0.49 && progress < 0.51) {
          log('[Portal] Mask at 50%:', (this.targets()[0] as HTMLElement).style.clipPath)
        }
      } : undefined,
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
  // Incoming Scene: Zoom-Out Reveal
  // CRITICAL: Large scale creates dramatic edge cropping that reveals as it
  // scales down, creating the signature "camera zooming out" sensation.
  // No opacity fade needed - scene is already visible behind outgoing.
  // -------------------------------------------------------------------------
  tl.fromTo(incomingScene,
    {
      scale: incomingScale,
    },
    {
      scale: 1,
      duration,
      ease: 'portalIn',
      onStart: () => log('[Portal] Incoming zoom-out reveal started'),
      onComplete: () => log('[Portal] Incoming zoom-out reveal complete'),
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
    log('[Portal] Outgoing text elements:', outgoingText.length)
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
  // Incoming Text: Directional slide-in animations
  // Supports: left, right, up, down via data-direction attribute
  // -------------------------------------------------------------------------
  const incomingEl = typeof incomingScene === 'string'
    ? document.querySelector(incomingScene)
    : incomingScene

  if (incomingEl) {
    const { distance, durationRatio, startRatio, stagger, ease } = textAnimation
    const animDuration = duration * durationRatio
    const animStart = duration * startRatio

    // Direction mappings: from offset → to neutral position
    const directions: Record<string, { x?: number; y?: number }> = {
      left: { x: -distance },
      right: { x: distance },
      up: { y: -distance },
      down: { y: distance },
    }

    // Animate each direction
    for (const [dir, offset] of Object.entries(directions)) {
      const elements = gsap.utils.toArray(
        (incomingEl as Element).querySelectorAll(`[data-direction="${dir}"]`)
      )
      if (elements.length > 0) {
        log(`[Portal] Incoming ${dir} text elements:`, elements.length)
        tl.fromTo(elements,
          { ...offset, opacity: 0 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            duration: animDuration,
            stagger,
            ease,
          },
          animStart
        )
      }
    }

    // Fallback: any text without direction (slides from right by default)
    const defaultText = gsap.utils.toArray(
      (incomingEl as Element).querySelectorAll(`${textSelector}:not([data-direction])`)
    )
    if (defaultText.length > 0) {
      log('[Portal] Incoming default text elements:', defaultText.length)
      tl.fromTo(defaultText,
        { x: distance * 0.6, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: animDuration,
          stagger,
          ease,
        },
        animStart
      )
    }
  }

  return {
    timeline: tl,
    duration,
  }
}

/**
 * Set up initial state for a scene that will be the outgoing scene.
 * Call this on mount to ensure proper starting state.
 *
 * @param scene - DOM element or selector
 * @param anchor - Transform origin point (default: { x: '50%', y: '45%' })
 *
 * @example
 * ```typescript
 * setupOutgoingScene('#scene-1')
 * setupOutgoingScene(sceneElement, { x: '50%', y: '50%' })
 * ```
 */
export function setupOutgoingScene(
  scene: gsap.TweenTarget,
  anchor = { x: '50%', y: '45%' }
): void {
  const anchorPoint = `${anchor.x} ${anchor.y}`

  gsap.set(scene, {
    clipPath: `circle(150% at ${anchorPoint})`,
    scale: 1,
    opacity: 1,
    transformOrigin: anchorPoint,
  })
}

/**
 * Set up initial state for a scene that will be the incoming scene.
 * Call this on mount to ensure proper starting state.
 *
 * CRITICAL: Large scale creates dramatic edge cropping - this is what makes
 * the transition feel like the camera is "zooming out" to reveal the scene.
 *
 * @param scene - DOM element or selector
 * @param anchor - Transform origin point (default: { x: '50%', y: '45%' })
 * @param scale - Initial scale factor (default: 2.0)
 *
 * @example
 * ```typescript
 * setupIncomingScene('#scene-2')
 * setupIncomingScene(sceneElement, { x: '50%', y: '50%' }, 1.5)
 * ```
 */
export function setupIncomingScene(
  scene: gsap.TweenTarget,
  anchor = { x: '50%', y: '45%' },
  scale = 2.0
): void {
  const anchorPoint = `${anchor.x} ${anchor.y}`

  gsap.set(scene, {
    scale,
    transformOrigin: anchorPoint,
  })
}
