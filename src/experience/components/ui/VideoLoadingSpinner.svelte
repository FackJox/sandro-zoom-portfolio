<!--
  VideoLoadingSpinner.svelte

  "Egg roll" style loading spinner for video buffering states.
  Matches brand design: 1.5px stroke, Egg Toast accent color.

  Design: Alpine Noir - machine precision, camera-like
  From: docs/Brand Design System.md

  Uses CSS animation for reliable spinning from first render (no GSAP timing issues).
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    /** Spinner size in pixels */
    size?: number
    /** Whether spinner is visible */
    visible?: boolean
    /** Whether to show backdrop overlay */
    showBackdrop?: boolean
  }

  let { size = 48, visible = true, showBackdrop = true }: Props = $props()

  // Container with optional backdrop
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '50',
    // Fade transition with brand-standard timing (315ms) and lockOn easing
    transition: 'opacity 315ms cubic-bezier(0.19, 1.0, 0.22, 1.0), visibility 315ms cubic-bezier(0.19, 1.0, 0.22, 1.0)',
    pointerEvents: 'none',
  })

  // Backdrop overlay styles
  const backdropStyles = css({
    position: 'absolute',
    inset: '0',
    backgroundColor: 'rgba(15, 23, 26, 0.6)',
    backdropFilter: 'blur(2px)',
  })

  // Spinner base styles - color only, animation in CSS
  const spinnerStyles = css({
    position: 'relative',
    zIndex: '1',
    color: 'brand.accent',
  })
</script>

<div
  class={containerStyles}
  style:opacity={visible ? 1 : 0}
  style:visibility={visible ? 'visible' : 'hidden'}
  aria-hidden={!visible}
  data-video-spinner
>
  {#if showBackdrop}
    <div class={backdropStyles}></div>
  {/if}

  <svg
    class={spinnerStyles}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Loading"
    role="img"
  >
    <!-- Background track - faint circle -->
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="1.5"
      opacity="0.2"
    />
    <!-- Egg roll: partial arc with 1.5px stroke matching brand.keyline -->
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-dasharray="47 16"
    />
  </svg>
</div>

<style>
  /* CSS animation for spinner - runs immediately without JS */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  svg {
    animation: spin 1.2s linear infinite;
  }
</style>
