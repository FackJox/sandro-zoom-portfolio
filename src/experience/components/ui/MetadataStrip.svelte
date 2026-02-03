<!--
  MetadataStrip.svelte

  Persistent metadata strip showing context information.
  Morphs between states as user scrolls.

  Design: Alpine Noir - technical, precise metadata display
  From: docs/Brand Physics Archtype.md - Metadata Strip System
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    items: string[]
    variant?: 'logos' | 'metadata' | 'stats'
  }

  let { items, variant = 'metadata' }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '0.75rem 2rem',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: '400',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
  })

  const separatorStyles = css({
    color: 'brand.accent',
    opacity: '0.6',
  })
</script>

<div class={containerStyles} data-animate="text" data-direction="down">
  {#each items as item, i}
    <span>{item}</span>
    {#if i < items.length - 1}
      <span class={separatorStyles}>&bull;</span>
    {/if}
  {/each}
</div>
