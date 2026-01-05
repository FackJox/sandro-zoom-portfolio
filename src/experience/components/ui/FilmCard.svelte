<!--
  FilmCard.svelte

  Film project card component.
  Displays film title, description, and metadata with optional video/image.

  Design: Alpine Noir - "hard-edged, no drop shadows—separation via contrast only"
  From: docs/Brand Design System.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    title: string
    description?: string
    metadata?: string
    year?: string
    client?: string
    imageSrc?: string
    videoSrc?: string
  }

  let {
    title,
    description = '',
    metadata = '',
    year = '',
    client = '',
    imageSrc = '',
    videoSrc = ''
  }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    maxWidth: '700px',
    padding: '2rem',
  })

  // Title - condensed, aggressive
  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(2rem, 5vw, 4rem)',
    fontWeight: '700',
    letterSpacing: '-0.01em',
    lineHeight: '1',
    textTransform: 'uppercase',
    color: 'white',
    margin: '0',
  })

  // Metadata line - client, year
  const metaStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: '500',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  })

  const separatorStyles = css({
    width: '20px',
    height: '1.5px',
    backgroundColor: 'brand.accent',
    opacity: '0.5',
  })

  // Description
  const descriptionStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
    fontWeight: '400',
    lineHeight: '1.7',
    color: 'brand.text',
    marginTop: '1.5rem',
    maxWidth: '550px',
  })

  // Frame aspect ratio indicator
  const frameStyles = css({
    marginTop: '2rem',
    padding: '0.25rem 0.75rem',
    border: '1px solid',
    borderColor: 'brand.phantom',
    fontSize: '0.6rem',
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: '0.1em',
    color: 'brand.phantom',
    opacity: '0.6',
  })
</script>

<div class={containerStyles}>
  <h2 class={titleStyles} data-animate="text">{title}</h2>

  {#if client || year}
    <div class={metaStyles} data-animate="text">
      {#if client}
        <span>{client}</span>
      {/if}
      {#if client && year}
        <span class={separatorStyles}></span>
      {/if}
      {#if year}
        <span>{year}</span>
      {/if}
    </div>
  {/if}

  {#if description}
    <p class={descriptionStyles} data-animate="text">{description}</p>
  {/if}

  <div class={frameStyles} data-animate="text">2.39:1</div>
</div>
