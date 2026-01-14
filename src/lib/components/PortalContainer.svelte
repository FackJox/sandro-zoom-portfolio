<!--
  PortalContainer.svelte

  Manages portal zoom transitions between Scene children.
  Uses children pattern - pass scenes as child elements with data-scene attribute.

  @example
  ```svelte
  <PortalContainer totalDuration={20} markers>
    <div data-scene="hero">Hero content</div>
    <div data-scene="film">Film content</div>
  </PortalContainer>
  ```

  @example With directional text animations
  ```svelte
  <PortalContainer totalDuration={30} incomingScale={2.0}>
    <div data-scene="hero">
      <h1 data-animate="text" data-direction="left">Title</h1>
      <p data-animate="text" data-direction="right">Subtitle</p>
    </div>
    <div data-scene="about">
      <h1 data-animate="text" data-direction="up">About</h1>
    </div>
  </PortalContainer>
  ```
-->
<script lang="ts" module>
  import type { PortalTransitionConfig, PortalTextAnimationConfig } from '../animation/primitives/portal'

  // Context key for scene configuration (exported for child components)
  export const PORTAL_CONTEXT_KEY = 'portal-scene-config'

  export interface PortalSceneConfig {
    durations: number[]
    startTimes: number[]
    scrollSpeed: number
    totalDuration: number
  }

  export interface PortalContainerProps {
    /** Total scroll duration in seconds (use this OR sceneDurations) */
    totalDuration?: number
    /** Per-scene durations in seconds (use this OR totalDuration) */
    sceneDurations?: number[]
    /** Scroll speed in px/s (default: 65) */
    scrollSpeed?: number
    /** Duration of each portal transition in seconds (default: 1.6) */
    transitionDuration?: number
    /** Initial scale for incoming scene zoom-out reveal (default: 2.0) */
    incomingScale?: number
    /** Final scale for outgoing scene (default: 0.3) */
    outgoingScale?: number
    /** Anchor point for transitions (default: { x: '50%', y: '45%' }) */
    anchor?: { x: string; y: string }
    /** Text animation configuration */
    textAnimation?: PortalTextAnimationConfig
    /** Show debug markers */
    markers?: boolean
    /** Enable debug logging */
    debug?: boolean
  }
</script>

<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte'
  import { gsap, ScrollTrigger } from '../core/gsap'
  import { createPortalTransition, setupOutgoingScene, setupIncomingScene } from '../animation/primitives/portal'
  import { getTransition, isCardFlipTransition, executeCardFlipTransition } from '../transitions'
  import type { CardFlipTransitionConfig } from '../transitions'

  let {
    totalDuration,
    sceneDurations,
    scrollSpeed = 65,
    transitionDuration = 1.6,
    incomingScale = 2.0,
    outgoingScale = 0.3,
    anchor = { x: '50%', y: '45%' },
    textAnimation,
    markers = false,
    debug = false,
    children,
  }: PortalContainerProps & { children: any } = $props()

  // ============================================================================
  // State
  // ============================================================================

  let containerEl: HTMLElement | null = $state(null)
  let viewportEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  // Calculate total duration from sceneDurations if provided
  const computedTotalDuration = $derived(
    sceneDurations ? sceneDurations.reduce((a, b) => a + b, 0) : (totalDuration ?? 100)
  )

  // Calculate scroll distance
  const scrollDistance = $derived(computedTotalDuration * scrollSpeed)

  // Pre-calculate scene start times from sceneDurations
  const sceneStartTimes = $derived(() => {
    if (!sceneDurations) return []
    const times: number[] = [0]
    for (let i = 1; i < sceneDurations.length; i++) {
      times.push(times[i - 1] + sceneDurations[i - 1])
    }
    return times
  })

  // Set context for child sections to read
  setContext(PORTAL_CONTEXT_KEY, {
    get durations() { return sceneDurations ?? [] },
    get startTimes() { return sceneStartTimes() },
    get scrollSpeed() { return scrollSpeed },
    get totalDuration() { return computedTotalDuration },
  } as PortalSceneConfig)

  // ============================================================================
  // Animation Setup
  // ============================================================================

  onMount(() => {
    if (!containerEl || !viewportEl) return

    // Create GSAP context for cleanup
    ctx = gsap.context(() => {
      // Get all scene elements from DOM
      const sceneElements = viewportEl!.querySelectorAll('[data-scene]')
      const sceneCount = sceneElements.length

      // Calculate per-scene durations
      let durations: number[]
      if (sceneDurations && sceneDurations.length === sceneCount) {
        durations = sceneDurations
      } else if (sceneDurations && sceneDurations.length !== sceneCount) {
        console.warn(`[PortalContainer] sceneDurations length (${sceneDurations.length}) doesn't match scene count (${sceneCount}), using equal distribution`)
        durations = Array(sceneCount).fill(computedTotalDuration / sceneCount)
      } else {
        durations = Array(sceneCount).fill((totalDuration ?? 100) / sceneCount)
      }

      // Calculate cumulative start times for each scene
      const sceneStartTimes: number[] = [0]
      for (let i = 1; i < sceneCount; i++) {
        sceneStartTimes.push(sceneStartTimes[i - 1] + durations[i - 1])
      }

      // DIAGNOSTIC: Always log key info (flat)
      console.log(`[PortalContainer] Setup: sceneCount=${sceneCount} durations=[${durations.join(',')}]s startTimes=[${sceneStartTimes.join(',')}]s totalDuration=${computedTotalDuration}s scrollDistance=${scrollDistance}px windowHeight=${window.innerHeight} transitionDuration=${transitionDuration}s`)

      // DIAGNOSTIC: Log each scene element (flat)
      sceneElements.forEach((el, i) => {
        const rect = (el as HTMLElement).getBoundingClientRect()
        const scrollStart = sceneStartTimes[i] * scrollSpeed
        const scrollEnd = (sceneStartTimes[i] + durations[i]) * scrollSpeed
        console.log(`[PortalContainer] Scene ${i} (${(el as HTMLElement).dataset.scene}): top=${rect.top.toFixed(0)} left=${rect.left.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)} duration=${durations[i]}s startTime=${sceneStartTimes[i]}s scrollRange=${scrollStart}px-${scrollEnd}px`)
      })

      if (sceneCount < 2) {
        console.warn('[PortalContainer] Need at least 2 scenes for transitions')
        return
      }

      // Set up initial states
      sceneElements.forEach((el, i) => {
        const sceneEl = el as HTMLElement
        if (i === 0) {
          // First scene is active
          setupOutgoingScene(sceneEl, anchor)
          sceneEl.style.zIndex = '20'
        } else {
          // Check if the transition TO this scene is card flip
          const isCardFlip = isCardFlipTransition(i - 1, i)
          if (isCardFlip) {
            // Card flip: incoming scene should be at normal scale (not zoomed)
            // It will be revealed by the flipping tiles
            gsap.set(sceneEl, { autoAlpha: 0, scale: 1 })
            sceneEl.style.visibility = 'hidden'
            sceneEl.style.zIndex = '10'
          } else {
            // Portal: incoming scene starts zoomed in
            setupIncomingScene(sceneEl, anchor, incomingScale)
            sceneEl.style.visibility = 'hidden'
            sceneEl.style.zIndex = '10'
          }
        }
      })

      // Track card flip state to prevent re-triggering
      const cardFlipTriggered: Record<string, boolean> = {}

      // Create transitions between each pair of scenes
      for (let i = 0; i < sceneCount - 1; i++) {
        const outgoing = sceneElements[i] as HTMLElement
        const incoming = sceneElements[i + 1] as HTMLElement

        // Calculate trigger points using cumulative scene times
        // Transition is centered on the boundary between scenes
        const sceneBoundary = sceneStartTimes[i + 1] // When scene i+1 starts
        const transitionStart = sceneBoundary - transitionDuration / 2
        const scrollStart = transitionStart * scrollSpeed

        // Check if this transition should use card flip
        const transition = getTransition(i, i + 1)
        const useCardFlip = transition.type === 'cardFlip'

        if (debug) {
          console.log(`[PortalContainer] Transition ${i}->${i + 1}: type=${transition.type} boundary=${sceneBoundary.toFixed(2)}s start=${transitionStart.toFixed(2)}s scrollStart=${scrollStart.toFixed(0)}px`)
        }

        if (useCardFlip) {
          // ============================================================
          // CARD FLIP TRANSITION
          // ============================================================
          const cardFlipConfig = transition.config as CardFlipTransitionConfig
          const triggerKey = `${i}->${i + 1}`

          // Calculate target scroll position (where incoming scene starts)
          const targetScrollY = sceneStartTimes[i + 1] * scrollSpeed

          console.log(`[CardFlip ${i}->${i+1}] Setting up trigger at ${scrollStart.toFixed(0)}px, targetScrollY=${targetScrollY.toFixed(0)}px`)

          ScrollTrigger.create({
            trigger: containerEl,
            start: `top+=${scrollStart} top`,
            end: `top+=${scrollStart + 1} top`,  // Minimal range - just a trigger point
            markers: markers,
            onEnter: async () => {
              // Prevent re-triggering
              if (cardFlipTriggered[triggerKey]) {
                console.log(`[CardFlip ${i}->${i+1}] Already triggered, skipping`)
                return
              }
              cardFlipTriggered[triggerKey] = true

              console.log(`[CardFlip ${i}->${i+1}] TRIGGERED at scroll=${window.scrollY}px`)

              // Execute the card flip transition
              await executeCardFlipTransition(outgoing, incoming, {
                ...cardFlipConfig,
                targetScrollY,
              })

              console.log(`[CardFlip ${i}->${i+1}] COMPLETE`)
            },
            onLeaveBack: () => {
              // Reset trigger state when scrolling back past the trigger point
              // This allows the transition to be triggered again if user scrolls back
              console.log(`[CardFlip ${i}->${i+1}] LEAVE_BACK - resetting trigger state`)
              cardFlipTriggered[triggerKey] = false

              // Restore outgoing scene, hide incoming
              gsap.set(outgoing, { autoAlpha: 1 })
              outgoing.style.visibility = 'visible'
              outgoing.style.zIndex = '20'
              gsap.set(incoming, { autoAlpha: 0 })
              incoming.style.visibility = 'hidden'
              incoming.style.zIndex = '10'
            },
          })
        } else {
          // ============================================================
          // PORTAL ZOOM TRANSITION
          // ============================================================
          const { timeline } = createPortalTransition(
            outgoing,
            incoming,
            {
              duration: transitionDuration,
              anchor,
              incomingScale,
              outgoingScale,
              textAnimation,
              debug,
            }
          )

          // Create ScrollTrigger for this transition
          const scrollEnd = scrollStart + transitionDuration * scrollSpeed

          console.log(`[Portal ${i}->${i+1}] ScrollTrigger range: ${scrollStart.toFixed(0)}px - ${scrollEnd.toFixed(0)}px`)

          ScrollTrigger.create({
            trigger: containerEl,
            start: `top+=${scrollStart} top`,
            end: `+=${transitionDuration * scrollSpeed}`,
            scrub: true,
            markers: markers,
            animation: timeline,
            onUpdate: (self) => {
              // Log portal progress every 25%
              const progress = Math.round(self.progress * 100)
              if (progress % 25 === 0) {
                console.log(`[Portal ${i}->${i+1}] progress=${progress}% scroll=${Math.round(self.scroll())}px`)
              }
            },
            onEnter: () => {
              console.log(`[Portal ${i}->${i+1}] ENTER scroll=${window.scrollY}px`)
              incoming.style.visibility = 'visible'
            },
            onLeave: () => {
              console.log(`[Portal ${i}->${i+1}] LEAVE scroll=${window.scrollY}px`)
              outgoing.style.visibility = 'hidden'
              outgoing.style.zIndex = '0'
              incoming.style.zIndex = '20'
            },
            onEnterBack: () => {
              console.log(`[Portal ${i}->${i+1}] ENTER_BACK scroll=${window.scrollY}px`)
              outgoing.style.visibility = 'visible'
              outgoing.style.zIndex = '20'
              incoming.style.zIndex = '10'
            },
            onLeaveBack: () => {
              console.log(`[Portal ${i}->${i+1}] LEAVE_BACK scroll=${window.scrollY}px`)
              incoming.style.visibility = 'hidden'
            },
          })
        }
      }

    }, containerEl)

    // Refresh ScrollTrigger after setup
    ScrollTrigger.refresh()

    // DIAGNOSTIC: Log scroll position periodically (flat)
    let lastLoggedScroll = -1000
    const scrollLogger = () => {
      const currentScroll = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      // Log every 500px
      if (Math.abs(currentScroll - lastLoggedScroll) >= 500) {
        lastLoggedScroll = currentScroll
        console.log(`[PortalContainer] Scroll: current=${currentScroll.toFixed(0)}px max=${maxScroll.toFixed(0)}px expected=${scrollDistance}px excess=${(maxScroll - scrollDistance).toFixed(0)}px pct=${((currentScroll / scrollDistance) * 100).toFixed(1)}%`)
      }
    }
    window.addEventListener('scroll', scrollLogger)

    // Initial log
    scrollLogger()

    // Store for cleanup
    ;(ctx as any)._scrollLogger = scrollLogger
  })

  onDestroy(() => {
    if (ctx && (ctx as any)._scrollLogger) {
      window.removeEventListener('scroll', (ctx as any)._scrollLogger)
    }
    ctx?.revert()
  })
</script>

<div
  bind:this={containerEl}
  data-portal-container
  style="position: relative; width: 100%; min-height: calc({scrollDistance}px + 100vh);"
>
  <div
    bind:this={viewportEl}
    style="position: fixed; top: 0; left: 0; width: 100%; height: 100vh; overflow: hidden;"
  >
    {@render children()}
  </div>
</div>
