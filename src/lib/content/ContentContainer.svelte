<script lang="ts">
  /**
   * ContentContainer Component
   *
   * Renders all content from a section configuration.
   * Manages content lifecycle (mount/unmount timing) and provides
   * scroll state context to children.
   */

  import type { ContentConfig, ScrollState } from '../types'
  import { css } from '$styled/css'
  import Content from './Content.svelte'
  import ContentSlot from './ContentSlot.svelte'
  import {
    createScrollStateContext,
    calculateContentProgress,
    isContentVisible,
    createScrollState,
  } from './scroll-state'

  // ============================================================================
  // Types
  // ============================================================================

  interface Props {
    /** Content configurations to render */
    content: ContentConfig[]
    /** Current section progress (0-1) */
    sectionProgress: number
    /** Section duration in seconds (for timing calculations) */
    sectionDuration: number
    /** Global scroll progress (0-1) */
    globalProgress?: number
    /** Scroll direction */
    direction?: 'up' | 'down' | null
    /** Scroll velocity */
    velocity?: number
  }

  // ============================================================================
  // Props
  // ============================================================================

  let {
    content,
    sectionProgress,
    sectionDuration,
    globalProgress = 0,
    direction = null,
    velocity = 0,
  }: Props = $props()

  // ============================================================================
  // Content State Management
  // ============================================================================

  /**
   * Calculate scroll state for a specific content item.
   */
  function getContentScrollState(contentConfig: ContentConfig): ScrollState {
    const progress = calculateContentProgress(
      sectionProgress,
      sectionDuration,
      contentConfig.at,
      contentConfig.until
    )

    const visible = isContentVisible(
      sectionProgress,
      sectionDuration,
      contentConfig.at,
      contentConfig.until
    )

    return createScrollState({
      progress: Math.max(0, Math.min(1, progress)), // Clamp to 0-1
      isVisible: visible,
      direction,
      velocity,
      sectionProgress,
      globalProgress,
    })
  }

  /**
   * Check if content should be mounted (visible in DOM).
   *
   * GSAP BEST PRACTICE: Mount ALL content immediately so GSAP can find targets.
   * Visibility is controlled via autoAlpha animations, not DOM presence.
   * The `at` and `until` properties control animation timing, not mounting.
   */
  function shouldMountContent(_contentConfig: ContentConfig): boolean {
    // Always mount - GSAP needs elements in DOM to animate them
    // Visibility is controlled by autoAlpha (opacity + visibility)
    return true
  }

  /**
   * Check if content is actually visible (for opacity).
   */
  function isContentCurrentlyVisible(contentConfig: ContentConfig): boolean {
    return isContentVisible(sectionProgress, sectionDuration, contentConfig.at, contentConfig.until)
  }

  // ============================================================================
  // Scroll State Context
  // ============================================================================

  // Map of content ID to scroll state getter
  // This allows child Content components to look up their specific scroll state
  const scrollStateMap = $derived(
    new Map(content.map((c) => [c.id, () => getContentScrollState(c)]))
  )

  // Provide scroll state context with a lookup function
  // Each Content component will use its ID to get its specific scroll state
  createScrollStateContext(() => {
    // This is a fallback - Content components should look up by ID
    return createScrollState({
      progress: 0,
      isVisible: false,
      direction,
      velocity,
      sectionProgress,
      globalProgress,
    })
  })

  // ============================================================================
  // Derived Values
  // ============================================================================

  // Filter content to only mounted items
  const mountedContent = $derived(content.filter((c) => shouldMountContent(c)))

  // DEBUG: Log content state
  $effect(() => {
    console.log('[ContentContainer]', {
      sectionProgress: (sectionProgress * 100).toFixed(1) + '%',
      sectionDuration,
      currentTime: (sectionProgress * sectionDuration).toFixed(2) + 's',
      contentCount: content.length,
      contentIds: content.map(c => c.id),
    })
  })

  // ============================================================================
  // Styles
  // ============================================================================

  const containerStyles = css({
    // Full container coverage for absolute positioning
    position: 'absolute',
    // Use explicit properties instead of inset for compatibility
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // Allow pointer events to pass through to layers below
    pointerEvents: 'none',
    // Content uses pointer-events: auto
    '& > *': {
      pointerEvents: 'auto',
    },
  })
</script>

<div class={containerStyles} data-content-container style="border: 3px dashed blue;">
  {#each mountedContent as contentConfig (contentConfig.id)}
    {@const visible = isContentCurrentlyVisible(contentConfig)}
    {@const scrollStateGetter = scrollStateMap.get(contentConfig.id)}
    <ContentSlot position={contentConfig.position}>
      <Content
        id={contentConfig.id}
        component={contentConfig.component}
        props={{
          ...contentConfig.props,
          ...(contentConfig.injectScrollState && scrollStateGetter
            ? { scrollState: scrollStateGetter() }
            : {}),
        }}
        isVisible={visible}
        injectScrollState={false}
      />
    </ContentSlot>
  {/each}
</div>
