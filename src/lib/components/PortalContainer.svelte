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
-->
<script lang="ts" module>
  export interface PortalContainerProps {
    /** Total scroll duration in seconds */
    totalDuration: number
    /** Scroll speed in px/s (default: 65) */
    scrollSpeed?: number
    /** Duration of each portal transition in seconds (default: 0.8) */
    transitionDuration?: number
    /** Show debug markers */
    markers?: boolean
  }
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap, ScrollTrigger } from '../core/gsap'
  import { createPortalTransition, setupOutgoingScene, setupIncomingScene } from '../animation/primitives/portal'

  let {
    totalDuration,
    scrollSpeed = 65,
    transitionDuration = 1.6,  // Doubled for smoother scroll-linked animation
    markers = false,
    children,
  }: PortalContainerProps & { children: any } = $props()

  // ============================================================================
  // State
  // ============================================================================

  let containerEl: HTMLElement | null = $state(null)
  let viewportEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  // Calculate scroll distance
  const scrollDistance = $derived(totalDuration * scrollSpeed)

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

      console.log('[PortalContainer] Setup', {
        sceneCount,
        totalDuration: `${totalDuration}s`,
        scrollDistance: `${scrollDistance}px`,
        transitionDuration: `${transitionDuration}s`,
      })

      if (sceneCount < 2) {
        console.warn('[PortalContainer] Need at least 2 scenes for transitions')
        return
      }

      // Duration per scene
      const sceneDuration = totalDuration / sceneCount

      // Set up initial states
      sceneElements.forEach((el, i) => {
        const sceneEl = el as HTMLElement
        if (i === 0) {
          // First scene is active
          setupOutgoingScene(sceneEl)
          sceneEl.style.zIndex = '20'
        } else {
          // Other scenes are incoming (hidden behind)
          setupIncomingScene(sceneEl)
          sceneEl.style.visibility = 'hidden'
          sceneEl.style.zIndex = '10'
        }
      })

      // Create transitions between each pair of scenes
      for (let i = 0; i < sceneCount - 1; i++) {
        const outgoing = sceneElements[i] as HTMLElement
        const incoming = sceneElements[i + 1] as HTMLElement

        // Calculate trigger points
        const transitionStart = (i + 1) * sceneDuration - transitionDuration / 2
        const scrollStart = transitionStart * scrollSpeed

        console.log(`[PortalContainer] Transition ${i} -> ${i + 1}`, {
          start: `${transitionStart.toFixed(2)}s`,
          scrollStart: `${scrollStart.toFixed(0)}px`,
        })

        // Create the portal transition
        const { timeline } = createPortalTransition(
          outgoing,
          incoming,
          { duration: transitionDuration }
        )

        // Create ScrollTrigger for this transition
        ScrollTrigger.create({
          trigger: containerEl,
          start: `top+=${scrollStart} top`,
          end: `+=${transitionDuration * scrollSpeed}`,
          scrub: true,
          markers: markers,
          animation: timeline,
          onEnter: () => {
            console.log(`[Portal] Enter: ${i} -> ${i + 1}`)
            incoming.style.visibility = 'visible'
          },
          onLeave: () => {
            console.log(`[Portal] Leave: ${i} -> ${i + 1}`)
            outgoing.style.visibility = 'hidden'
            outgoing.style.zIndex = '0'
            incoming.style.zIndex = '20'
          },
          onEnterBack: () => {
            console.log(`[Portal] EnterBack: ${i + 1} -> ${i}`)
            outgoing.style.visibility = 'visible'
            outgoing.style.zIndex = '20'
            incoming.style.zIndex = '10'
          },
          onLeaveBack: () => {
            console.log(`[Portal] LeaveBack: ${i + 1} -> ${i}`)
            incoming.style.visibility = 'hidden'
          },
        })
      }

    }, containerEl)

    // Refresh ScrollTrigger after setup
    ScrollTrigger.refresh()
  })

  onDestroy(() => {
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
