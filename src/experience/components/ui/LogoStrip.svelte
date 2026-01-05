<!--
  LogoStrip.svelte

  Client logos strip component.
  Displays brand partner logos in a horizontal strip.

  Design: Alpine Noir - utilitarian, muted display
  From: docs/Brand Design System.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    logos?: string[]
  }

  let { logos = ['NETFLIX', 'BBC', 'REDBULL', 'BERGHAUS', 'OSPREY', 'TNF'] }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    padding: '1rem 2rem',
    opacity: '0.5',
    // IBM Plex Sans - body font
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: '500',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'brand.textMuted',
  })

  const separatorStyles = css({
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
  })
</script>

<div class={containerStyles} data-animate="text">
  {#each logos as logo, i}
    <span>{logo}</span>
    {#if i < logos.length - 1}
      <span class={separatorStyles}></span>
    {/if}
  {/each}
</div>
