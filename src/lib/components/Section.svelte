<!--
  Section.svelte

  A scrollytelling section that renders layers, content, and animations.
  Automatically registers itself with the master timeline.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte'
  import type { SectionConfig } from '../types'

  export interface SectionProps {
    /** Section configuration */
    config: SectionConfig
    /** Optional custom children (overrides config.content rendering) */
    children?: Snippet
    /** Additional CSS class */
    class?: string
  }
</script>

<script lang="ts">
  import { getContext, setContext, onMount } from 'svelte'
  import { gsap } from '../core/gsap'
  import type { MasterTimeline } from '../core/timeline.svelte'
  import type { ExperienceType } from '../types'
  import type { ExperienceState } from '../core/experience.svelte'
  import type { ScrollStateStore } from '../core/scroll.svelte'
  import LayerStack from '../layers/LayerStack.svelte'
  import ContentContainer from '../content/ContentContainer.svelte'

  let { config, children, class: className = '' }: SectionProps = $props()

  // ============================================================================
  // Context
  // ============================================================================

  const MASTER_TIMELINE_KEY = Symbol.for('master-timeline')
  const EXPERIENCE_KEY = Symbol.for('experience')
  const SCROLL_STATE_KEY = Symbol.for('scroll-state')
  const CONFIG_KEY = Symbol.for('config')
  const SECTION_KEY = Symbol('section')

  // Get timeline context (provides getter functions and reactive progress)
  const timelineContext = getContext<{
    getTimeline: () => MasterTimeline | null
    progress: number
    currentTime: number
    totalDuration: number
  } | undefined>(MASTER_TIMELINE_KEY)

  const experience = getContext<ExperienceState | undefined>(EXPERIENCE_KEY)
  const scrollState = getContext<ScrollStateStore | undefined>(SCROLL_STATE_KEY)
  const globalConfig = getContext<{ totalDuration: number } | undefined>(CONFIG_KEY)

  // ============================================================================
  // State
  // ============================================================================

  let sectionElement: HTMLElement | null = $state(null)
  let sectionTimeline: gsap.core.Timeline | null = $state(null)

  // ============================================================================
  // Derived Config (mobile variant support)
  // ============================================================================

  const effectiveConfig = $derived.by(() => {
    const isMobile = experience?.type === 'mobile'

    if (isMobile && config.mobile) {
      // Merge mobile variant with base config
      return {
        ...config,
        layers: config.mobile.layers ?? config.layers,
        content: config.mobile.content ?? config.content,
        animations: config.mobile.animations ?? config.animations,
      }
    }

    return config
  })

  // ============================================================================
  // Section Progress Calculation
  // ============================================================================

  // Calculate section duration from animations (max end time)
  const sectionDuration = $derived.by(() => {
    let maxEnd = 0
    for (const anim of effectiveConfig.animations) {
      if (typeof anim.at === 'number') {
        const animEnd = anim.at + (anim.duration ?? 0.6)
        maxEnd = Math.max(maxEnd, animEnd)
      }
    }
    return maxEnd || 10 // Default to 10 seconds if no animations
  })

  // Get global progress from context
  const globalProgress = $derived(scrollState?.progress ?? 0)
  const totalDuration = $derived(globalConfig?.totalDuration ?? 30)

  // Calculate section progress (0-1 within this section)
  // For now, use global progress - in a multi-section setup, this would need section boundaries
  const sectionProgress = $derived(globalProgress)

  // DEBUG: Log section state on mount
  $effect(() => {
    console.log(`[Section ${config.id}]`, {
      sectionDuration,
      globalProgress: (globalProgress * 100).toFixed(1) + '%',
      sectionProgress: (sectionProgress * 100).toFixed(1) + '%',
      contentCount: effectiveConfig.content?.length ?? 0,
      hasScrollState: !!scrollState,
    })
  })

  // ============================================================================
  // Section Context
  // ============================================================================

  const sectionContext = {
    id: config.id,
    getElement: () => sectionElement,
    getTimeline: () => sectionTimeline,
  }

  setContext(SECTION_KEY, sectionContext)

  // ============================================================================
  // Animation Setup
  // ============================================================================

  onMount(() => {
    if (!sectionElement) return

    // Create section timeline
    sectionTimeline = gsap.timeline({ paused: true })

    // Process animations
    for (const anim of effectiveConfig.animations) {
      const target = sectionElement.querySelector(`[data-layer="${anim.target}"], [data-content="${anim.target}"]`)

      if (!target) {
        console.warn(`[Section ${config.id}] Target not found: ${anim.target}`)
        continue
      }

      // Build GSAP tween config based on animation action
      const tweenConfig = buildTweenConfig(anim)

      // Calculate position in section timeline
      const position = resolvePosition(anim.at)

      // Add to section timeline
      sectionTimeline.to(target, tweenConfig, position)
    }

    // Add section timeline to master timeline
    const masterTimeline = timelineContext?.getTimeline()
    if (masterTimeline) {
      // Calculate section's start position in master timeline
      // For now, sections are added sequentially
      masterTimeline.add(sectionTimeline)
    }

    // Cleanup
    return () => {
      sectionTimeline?.kill()
    }
  })

  // ============================================================================
  // Animation Helpers
  // ============================================================================

  function buildTweenConfig(anim: SectionConfig['animations'][0]): gsap.TweenVars {
    const config: gsap.TweenVars = {
      duration: anim.duration ?? 0.6,
      ease: anim.ease ?? 'power2.out',
    }

    switch (anim.action) {
      case 'fadeIn':
        config.opacity = 1
        config.startAt = { opacity: 0 }
        break

      case 'fadeOut':
        config.opacity = 0
        break

      case 'slideIn':
        config.x = 0
        config.y = 0
        config.opacity = 1
        const slideOffset = getSlideOffset(anim.direction ?? 'up', anim.distance ?? 50)
        config.startAt = { ...slideOffset, opacity: 0 }
        break

      case 'slideOut':
        const outOffset = getSlideOffset(anim.direction ?? 'up', anim.distance ?? 50)
        Object.assign(config, outOffset)
        config.opacity = 0
        break

      case 'pan':
        config.x = anim.pan?.x ?? 0
        config.y = anim.pan?.y ?? 0
        break

      case 'zoom':
        if (anim.scale) {
          config.scale = anim.scale[1]
          config.startAt = { scale: anim.scale[0] }
        }
        if (anim.pan) {
          config.x = anim.pan.x ?? 0
          config.y = anim.pan.y ?? 0
        }
        if (anim.rotate) {
          config.rotation = anim.rotate
        }
        break

      case 'scale':
        if (anim.scale) {
          config.scale = anim.scale[1]
          config.startAt = { scale: anim.scale[0] }
        }
        break

      case 'parallax':
        // Parallax is handled differently via ScrollTrigger
        config.y = `${(anim.speed ?? 0.5) * 100}%`
        break

      case 'gsap':
        // GSAP escape hatch - merge raw config
        if (anim.gsap) {
          Object.assign(config, anim.gsap)
        }
        break

      default:
        // Handle other actions or custom configs
        break
    }

    return config
  }

  function getSlideOffset(
    direction: 'up' | 'down' | 'left' | 'right',
    distance: number
  ): { x?: number; y?: number } {
    switch (direction) {
      case 'up':
        return { y: distance }
      case 'down':
        return { y: -distance }
      case 'left':
        return { x: distance }
      case 'right':
        return { x: -distance }
    }
  }

  function resolvePosition(at: number | string): number | string {
    if (typeof at === 'number') {
      return at
    }

    // Handle relative positions like '+=0.5', '<', '>'
    return at
  }

  // ============================================================================
  // Styles
  // ============================================================================

  const sectionStyles = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 4px solid yellow;
  `
</script>

<section
  bind:this={sectionElement}
  class="section {className}"
  style={sectionStyles}
  data-section={config.id}
>
  <!-- Layer Stack -->
  <LayerStack layers={effectiveConfig.layers} />

  <!-- Content -->
  {#if children}
    {@render children()}
  {:else}
    <ContentContainer
      content={effectiveConfig.content}
      sectionProgress={sectionProgress}
      sectionDuration={sectionDuration}
      globalProgress={globalProgress}
      direction={scrollState?.direction}
      velocity={scrollState?.velocity ?? 0}
    />
  {/if}
</section>

<style>
  .section {
    /* Section-specific styles */
  }
</style>
