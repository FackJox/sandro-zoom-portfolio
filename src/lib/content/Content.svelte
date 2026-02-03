<script lang="ts">
  /**
   * Content Component
   *
   * Renders a Svelte component with props inside a wrapper div for GSAP animation.
   * Supports optional scroll state injection for scroll-driven component behavior.
   */

  import type { Component } from 'svelte'
  import { css } from '$styled/css'
  import { getScrollState } from './scroll-state'

  // ============================================================================
  // Types
  // ============================================================================

  interface Props {
    /** Unique content identifier */
    id: string
    /** Svelte component to render */
    component: Component<any>
    /** Props to pass to the component */
    props?: Record<string, any>
    /** Whether content is currently visible */
    isVisible?: boolean
    /** Whether to inject scroll state into the component (via context) */
    injectScrollState?: boolean
  }

  // ============================================================================
  // Props
  // ============================================================================

  let {
    id,
    component,
    props = {},
    isVisible = true,
    injectScrollState = false,
  }: Props = $props()

  // ============================================================================
  // Scroll State (via context)
  // ============================================================================

  // Get scroll state getter from context if available and requested
  const getScrollStateFromContext = injectScrollState ? getScrollState() : undefined

  // Derive current scroll state from context
  const scrollStateFromContext = $derived(
    getScrollStateFromContext ? getScrollStateFromContext() : undefined
  )

  // Combine props with scroll state if using context injection
  const combinedProps = $derived({
    ...props,
    ...(scrollStateFromContext ? { scrollState: scrollStateFromContext } : {}),
  })

  // ============================================================================
  // Styles
  // ============================================================================

  // Animation wrapper - the actual target for GSAP autoAlpha
  const animationWrapperStyles = css({
    // Default position in flow
    position: 'relative',
    // Will be positioned by ContentSlot parent
    width: 'fit-content',
    height: 'fit-content',
    // GSAP autoAlpha pattern: start hidden, GSAP reveals via autoAlpha animation
    // autoAlpha: 0 sets both opacity: 0 AND visibility: hidden
    // autoAlpha: 1 sets opacity: 1 AND visibility: inherit
    visibility: 'hidden',
    opacity: 0,
  })
</script>

<!--
  Content wrapper with data attribute for GSAP targeting.

  GSAP BEST PRACTICE: Always render content so GSAP can find targets.
  Starts with visibility:hidden + opacity:0 (equivalent to autoAlpha:0).
  GSAP animations control visibility via autoAlpha property.
-->
<div
  class={animationWrapperStyles}
  data-content={id}
>
  <svelte:component this={component} {...combinedProps} />
</div>
