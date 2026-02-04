<!--
  VideoLoadingSpinner.svelte

  "Egg roll" style loading spinner for video buffering states.
  Matches brand design: 1.5px stroke, Egg Toast accent color.

  Design: Alpine Noir - machine precision, camera-like
  From: docs/Brand Design System.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from '$lib/core/gsap'

  interface Props {
    /** Spinner size in pixels */
    size?: number
    /** Whether spinner is visible */
    visible?: boolean
    /** Whether to show backdrop overlay */
    showBackdrop?: boolean
  }

  let { size = 48, visible = true, showBackdrop = true }: Props = $props()

  let spinnerEl: SVGSVGElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  onMount(() => {
    if (!spinnerEl) return

    ctx = gsap.context(() => {
      // Continuous rotation - machine precision
      gsap.to(spinnerEl, {
        rotation: 360,
        duration: 1.2,
        ease: 'none',
        repeat: -1,
        transformOrigin: 'center center'
      })
    }, spinnerEl)
  })

  onDestroy(() => {
    ctx?.revert()
  })

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

  // Spinner uses brand.accent (#f6c605 - Egg Toast yellow)
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
    bind:this={spinnerEl}
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
