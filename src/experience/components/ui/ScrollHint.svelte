<!--
  ScrollHint.svelte

  Persistent scroll indicator showing users they can scroll.
  Subtle pulsing chevron, positioned bottom-center.
  Fades during active scroll, reappears on pause.

  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from '$lib/core/gsap'
  import { DURATION } from '$lib/animation/easing'

  interface Props {
    show?: boolean
  }

  let { show = true }: Props = $props()

  let chevronEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  onMount(() => {
    if (!chevronEl) return

    ctx = gsap.context(() => {
      // Gentle pulse animation
      gsap.to(chevronEl, {
        y: 4,
        opacity: 0.6,
        duration: 1,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, chevronEl)
  })

  onDestroy(() => {
    ctx?.revert()
  })

  const containerStyles = css({
    position: 'absolute',
    bottom: 'env(safe-area-inset-bottom, 40px)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    zIndex: '20',
    pointerEvents: 'none',
    transition: `opacity ${DURATION.standard}s`,

    '@media (max-width: 767px)': {
      bottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
    },
  })

  const chevronStyles = css({
    width: '24px',
    height: '24px',
    color: 'brand.accent',
    opacity: '0.8',

    '@media (max-width: 767px)': {
      width: '18px',
      height: '18px',
    },
  })

  const labelStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.625rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.accent',
  })
</script>

{#if show}
  <div class={containerStyles} style:opacity={show ? 1 : 0}>
    <svg
      bind:this={chevronEl}
      class={chevronStyles}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class={labelStyles}>Scroll</span>
  </div>
{/if}
