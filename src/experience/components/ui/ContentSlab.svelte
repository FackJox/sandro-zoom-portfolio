<!--
  ContentSlab.svelte

  Right-side text panel for two-column layouts.
  Contains eyebrow, title, description, metadata.

  Design: Solid dark panel with text hierarchy
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    eyebrow?: string
    title: string
    description: string
    metadata?: string
    year?: string
  }

  let {
    eyebrow,
    title,
    description,
    metadata,
    year
  }: Props = $props()

  const slabStyles = css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '320px',
    backgroundColor: 'brand.surface',

    '@media (max-width: 1023px)': {
      padding: '1.5rem',
      minHeight: '280px',
    },
    '@media (max-width: 767px)': {
      padding: '1.25rem',
      minHeight: 'auto',
    },
  })

  const eyebrowStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: '500',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    marginBottom: '0.75rem',
  })

  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', sans-serif",
    fontSize: 'clamp(1.25rem, 2vw, 1.85rem)',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'brand.text',
    marginBottom: '1rem',
    lineHeight: '1.1',
  })

  const dividerStyles = css({
    width: '60px',
    height: '1px',
    backgroundColor: 'brand.phantom',
    marginBottom: '1rem',
  })

  const descriptionStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.9rem, 1.1vw, 1rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    color: 'brand.textMuted',
    marginBottom: '1.5rem',
  })

  const metadataStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.75rem',
    fontWeight: '400',
    letterSpacing: '0.1em',
    color: 'brand.phantom',
    textTransform: 'uppercase',
  })
</script>

<div class={slabStyles}>
  {#if eyebrow}
    <span class={eyebrowStyles}>{eyebrow}</span>
  {/if}

  <h3 class={titleStyles}>{title}</h3>

  <div class={dividerStyles}></div>

  <p class={descriptionStyles}>{description}</p>

  {#if metadata || year}
    <span class={metadataStyles}>
      {#if metadata}{metadata}{/if}
      {#if metadata && year} · {/if}
      {#if year}{year}{/if}
    </span>
  {/if}
</div>
