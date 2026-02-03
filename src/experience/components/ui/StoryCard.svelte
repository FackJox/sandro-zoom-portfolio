<!--
  StoryCard.svelte

  Story/short film card component.
  Similar to FilmCard but for shorter field stories.

  Design: Alpine Noir - documentary grit
  From: docs/Brand Design System.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    title: string
    subtitle?: string
    description?: string
    client?: string
  }

  let {
    title,
    subtitle = '',
    description = '',
    client = ''
  }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    maxWidth: '650px',
    padding: '2rem',
  })

  // Title - smaller than FilmCard, still condensed
  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(1.75rem, 4vw, 3rem)',
    fontWeight: '700',
    letterSpacing: '0',
    lineHeight: '1.1',
    textTransform: 'uppercase',
    color: 'white',
    margin: '0',
  })

  // Subtitle - series name
  const subtitleStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.8rem',
    fontWeight: '500',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    marginTop: '0.75rem',
  })

  // Client
  const clientStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: '400',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
    marginTop: '0.5rem',
  })

  // Description
  const descriptionStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
    fontWeight: '400',
    lineHeight: '1.7',
    color: 'brand.text',
    marginTop: '1.25rem',
    maxWidth: '500px',
  })
</script>

<div class={containerStyles}>
  <h2 class={titleStyles} data-animate="text">{title}</h2>

  {#if subtitle}
    <p class={subtitleStyles} data-animate="text">{subtitle}</p>
  {/if}

  {#if client}
    <p class={clientStyles} data-animate="text">{client}</p>
  {/if}

  {#if description}
    <p class={descriptionStyles} data-animate="text">{description}</p>
  {/if}
</div>
