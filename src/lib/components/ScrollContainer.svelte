<!--
  ScrollContainer.svelte

  Root container for scrollytelling experiences.
  Sets up the scroll environment, master timeline, and provides context.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { ScrollytellingConfig } from '../types'
  import type { MasterTimeline, ScrollStateStore, ScrollSmootherInstance } from '../core'

  export interface ScrollContainerProps {
    /** Scrollytelling configuration */
    config: ScrollytellingConfig
    /** Whether to enable smooth scrolling (requires ScrollSmoother) */
    smooth?: boolean
    /** Smooth scrolling intensity (default: 1) */
    smoothIntensity?: number
    /** Whether to show debug markers */
    markers?: boolean
    /** Children content */
    children: Snippet
    /** Callback when timeline is ready */
    onready?: (timeline: MasterTimeline) => void
    /** Callback when scroll updates */
    onscroll?: (state: ScrollStateStore) => void
  }
</script>

<script lang="ts">
  import { onMount, setContext, getContext } from 'svelte'
  import { registerGSAP, gsap, ScrollTrigger } from '../core/gsap'
  import {
    createMasterTimeline,
    createScrollSmoother,
    createScrollObserver,
    calculateScrollDistance,
    type ScrollObserver,
  } from '../core'
  import { createExperienceState } from '../core/experience.svelte'
  import { createFrameState } from '../core/frame.svelte'

  let {
    config,
    smooth = false,
    smoothIntensity = 1,
    markers = false,
    children,
    onready,
    onscroll,
  }: ScrollContainerProps = $props()

  // ============================================================================
  // Context Keys (use Symbol.for for cross-component access)
  // ============================================================================

  const MASTER_TIMELINE_KEY = Symbol.for('master-timeline')
  const SCROLL_STATE_KEY = Symbol.for('scroll-state')
  const EXPERIENCE_KEY = Symbol.for('experience')
  const FRAME_KEY = Symbol.for('frame')
  const CONFIG_KEY = Symbol.for('config')

  // ============================================================================
  // State
  // ============================================================================

  let container: HTMLElement | null = $state(null)
  let wrapper: HTMLElement | null = $state(null)
  let content: HTMLElement | null = $state(null)

  let masterTimeline: MasterTimeline | null = $state(null)
  let scrollSmoother: ScrollSmootherInstance | null = $state(null)
  let scrollObserver: ScrollObserver | null = $state(null)
  let isReady = $state(false)

  // Experience state (reactive) - pass config for proper detection
  const experience = createExperienceState(config.experiences)
  const frame = createFrameState(config.experiences.desktop.frame)

  // ============================================================================
  // Derived Values
  // ============================================================================

  const scrollDistance = $derived(
    calculateScrollDistance(config.totalDuration, config.scrollSpeed)
  )

  const currentExperience = $derived(
    experience.type === 'desktop' ? config.experiences.desktop : config.experiences.mobile
  )

  // ============================================================================
  // Reactive Scroll State (for context)
  // ============================================================================

  // Create scroll state that can be set synchronously and updated later
  let scrollProgress = $state(0)
  let scrollDirection = $state<'up' | 'down' | null>(null)
  let scrollVelocity = $state(0)
  let scrollY = $state(0)

  // Reactive scroll state object for context
  const scrollState: ScrollStateStore = {
    get progress() { return scrollProgress },
    set progress(v) { scrollProgress = v },
    get direction() { return scrollDirection },
    set direction(v) { scrollDirection = v },
    get velocity() { return scrollVelocity },
    set velocity(v) { scrollVelocity = v },
    get scrollY() { return scrollY },
    set scrollY(v) { scrollY = v },
    get scrollHeight() { return scrollDistance },
    set scrollHeight(_) { /* readonly */ },
    get isScrolling() { return scrollVelocity !== 0 },
    set isScrolling(_) { /* derived */ },
  }

  // ============================================================================
  // Context Setup (MUST be synchronous, before children mount)
  // ============================================================================

  // Create a context holder that provides getter functions
  // Children can call these to get current values even before onMount
  const timelineContext = {
    getTimeline: () => masterTimeline,
    get progress() { return scrollProgress },
    get currentTime() { return scrollProgress * config.totalDuration },
    get totalDuration() { return config.totalDuration },
  }

  setContext(CONFIG_KEY, config)
  setContext(EXPERIENCE_KEY, experience)
  setContext(FRAME_KEY, frame)
  setContext(MASTER_TIMELINE_KEY, timelineContext)
  setContext(SCROLL_STATE_KEY, scrollState)

  // Export context getters for child components
  export function getMasterTimeline(): MasterTimeline | null {
    return masterTimeline
  }

  export function getScrollState(): ScrollStateStore {
    return scrollState
  }

  export function getExperience() {
    return experience
  }

  export function getFrame() {
    return frame
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  onMount(() => {
    // Register GSAP plugins
    registerGSAP()

    // DEBUG: Log scroll setup
    console.log('[ScrollContainer] onMount', {
      scrollDistance,
      totalDuration: config.totalDuration,
      scrollSpeed: config.scrollSpeed,
      container: container?.getBoundingClientRect(),
    })

    // Experience and frame states are managed automatically by their respective
    // state creators (createExperienceState and createFrameState)
    // They handle media queries and resize observers internally

    // Create ScrollSmoother if enabled
    if (smooth && wrapper && content) {
      scrollSmoother = createScrollSmoother({
        wrapper: '#scroll-wrapper',
        content: '#scroll-content',
        smooth: smoothIntensity,
        effects: true,
      })
    }

    // Create master timeline
    masterTimeline = createMasterTimeline({
      totalDuration: config.totalDuration,
      scrollSpeed: config.scrollSpeed,
      trigger: container ?? 'body',
      scrub: smooth ? smoothIntensity : true,
      onUpdate: (progress, time) => {
        // DEBUG: Log progress updates
        if (Math.floor(progress * 100) % 10 === 0) {
          console.log('[ScrollContainer] progress', { progress: (progress * 100).toFixed(1) + '%', time, scrollY: window.scrollY })
        }

        // Update reactive scroll state
        scrollProgress = progress

        // Calculate direction from velocity
        if (scrollObserver) {
          scrollDirection = scrollObserver.state.direction
          scrollVelocity = scrollObserver.state.velocity
          scrollY = scrollObserver.state.scrollY
        }

        onscroll?.(scrollState)
      },
      onReady: () => {
        isReady = true
        if (masterTimeline) {
          onready?.(masterTimeline)
        }
      },
    })

    // Create scroll observer
    scrollObserver = createScrollObserver({
      scrollDistance,
      onUpdate: (state) => {
        // Sync scroll observer state to our reactive state
        scrollDirection = state.direction
        scrollVelocity = state.velocity
        scrollY = state.scrollY
        onscroll?.(scrollState)
      },
    })
    scrollObserver.start()

    // Handle resize - frame state updates automatically via createFrameState
    function handleResize() {
      // Refresh ScrollTrigger on resize
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      scrollObserver?.destroy()
      scrollSmoother?.kill()
      masterTimeline?.destroy()
    }
  })

  // ============================================================================
  // Styles
  // ============================================================================

  // Container needs to be scrollDistance + viewport height so we can actually scroll the full distance
  const containerStyles = $derived(`
    position: relative;
    width: 100%;
    min-height: calc(${scrollDistance}px + 100vh);
  `)

  const wrapperStyles = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  `

  const contentStyles = `
    width: 100%;
    height: 100%;
  `
</script>

<div
  bind:this={container}
  class="scroll-container"
  style={containerStyles}
  data-scroll-container
  data-ready={isReady}
>
  {#if smooth}
    <div
      bind:this={wrapper}
      id="scroll-wrapper"
      class="scroll-wrapper"
      style={wrapperStyles}
    >
      <div
        bind:this={content}
        id="scroll-content"
        class="scroll-content"
        style={contentStyles}
      >
        {@render children()}
      </div>
    </div>
  {:else}
    <div class="scroll-wrapper" style={wrapperStyles}>
      <div class="scroll-content" style={contentStyles}>
        {@render children()}
      </div>
    </div>
  {/if}
</div>

<style>
  .scroll-container {
    --scroll-progress: 0;
  }

  .scroll-wrapper {
    pointer-events: none;
  }

  .scroll-wrapper > :global(*) {
    pointer-events: auto;
  }
</style>
