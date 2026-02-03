<!--
  AboutBeat.svelte

  About section beat component.
  Displays subtitle and text block for each "beat" of the about story.

  Design: Alpine Noir - controlled, documentary narration
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    subtitle: string
    text: string
  }

  let { subtitle, text }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    maxWidth: '700px',
    padding: '2rem',
  })

  // Subtitle - section identifier
  const subtitleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    margin: '0',
    paddingBottom: '1rem',
    borderBottom: '1.5px solid',
    borderColor: 'brand.surface',
  })

  // Main text - readable body copy
  const textStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
    fontWeight: '400',
    lineHeight: '1.8',
    color: 'brand.text',
    marginTop: '2rem',
  })
</script>

<div class={containerStyles}>
  <h3 class={subtitleStyles} data-animate="text">{subtitle}</h3>
  <p class={textStyles} data-animate="text">{text}</p>
</div>
