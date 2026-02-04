<!--
  NavMenuItem.svelte

  Brutalist menu item - solid Egg Toast slab with black block text.
  Current section: fully transparent with yellow text (shows website through).

  Design: Alpine Noir Brutalist
  From: docs/plans/2025-02-04-nav-menu-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    label: string
    isCurrent: boolean
    onClick: () => void
  }

  let { label, isCurrent, onClick }: Props = $props()
</script>

<button
  class="nav-item"
  class:current={isCurrent}
  onclick={onClick}
>
  <span class="nav-text">{label}</span>
</button>

<style>
  /* Base button - aggressive reset */
  .nav-item {
    /* Reset */
    -webkit-appearance: none;
    appearance: none;
    border: none;
    border-radius: 0;
    margin: 0;
    margin-top: -1px; /* Overlap to prevent subpixel gaps */
    font: inherit;

    /* Layout */
    display: block;
    width: 100%;
    text-align: left;
    cursor: pointer;
    position: relative; /* For stacking */

    /* Sizing */
    padding: 16px 24px;
    min-height: 52px;

    /* Default: solid yellow slab */
    background-color: #f6c605;
  }

  .nav-item:first-child {
    margin-top: 0;
  }

  .nav-item:focus {
    outline: none;
  }

  .nav-item:focus-visible {
    outline: 2px solid #0f171a;
    outline-offset: -4px;
  }

  /* Current section: fully transparent */
  .nav-item.current {
    background: transparent;
  }

  /* Text styling */
  .nav-text {
    font-family: 'IBM Plex Sans Condensed', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    line-height: 1.1;

    /* Default: black text */
    color: #0f171a;
  }

  /* Current section: yellow text */
  .nav-item.current .nav-text {
    color: #f6c605;
  }

  /* Mobile */
  @media (max-width: 767px) {
    .nav-item {
      padding: 18px 28px;
      min-height: 56px;
    }

    .nav-text {
      font-size: 1.75rem;
    }
  }
</style>
