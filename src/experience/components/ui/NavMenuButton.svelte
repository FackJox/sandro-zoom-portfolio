<!--
  NavMenuButton.svelte

  Hamburger / X toggle button for the navigation menu.
  Two lines that rotate to form an X when open.

  Design: Alpine Noir - Egg Toast lines, mechanical rotation
  From: docs/plans/2025-02-04-nav-menu-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    isOpen: boolean
    onClick: () => void
  }

  let { isOpen, onClick }: Props = $props()

  const buttonStyles = css({
    // Reset
    background: 'none',
    border: 'none',
    cursor: 'pointer',

    // Touch target - minimum 44px for accessibility
    padding: '12px',
    margin: '-12px',

    // Layout
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '8px',

    // Size
    width: '56px',
    height: '48px',

    // IMPORTANT: Keep above backdrop blur
    position: 'relative',
    zIndex: '1010',

    // Interaction
    '&:focus-visible': {
      outline: '1.5px solid',
      outlineColor: 'brand.accent',
      outlineOffset: '4px',
    },
  })

  const lineStyles = css({
    display: 'block',
    width: '40px',
    height: '1.5px',
    backgroundColor: 'brand.accent',
    transformOrigin: 'center',
    transition: 'transform 175ms cubic-bezier(0.19, 1, 0.22, 1)',
  })

  // Line-specific transforms for X formation
  const topLineTransform = $derived(
    isOpen ? 'translateY(4.75px) rotate(45deg)' : 'none'
  )
  const bottomLineTransform = $derived(
    isOpen ? 'translateY(-4.75px) rotate(-45deg)' : 'none'
  )
</script>

<button
  class={buttonStyles}
  onclick={onClick}
  aria-expanded={isOpen}
  aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
>
  <span
    class={lineStyles}
    style:transform={topLineTransform}
  ></span>
  <span
    class={lineStyles}
    style:transform={bottomLineTransform}
  ></span>
</button>
