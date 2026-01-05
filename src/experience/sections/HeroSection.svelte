<!--
  HeroSection.svelte

  Hero section content for Sandro's portfolio.
  Displays name, tagline, description, and client logos.

  Design: Alpine Noir - "controlled fall: precise, cinematic"
  From: docs/Brand Design System.md, docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import LogoStrip from '../components/ui/LogoStrip.svelte'
  import MetadataStrip from '../components/ui/MetadataStrip.svelte'

  interface Props {
    title?: string
    tagline?: string
    description?: string
    showLogos?: boolean
  }

  let {
    title = 'SANDRO',
    tagline = 'HIGH ALTITUDE & HOSTILE ENVIRONMENT',
    description = "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering.",
    showLogos = true
  }: Props = $props()

  // Container - full bleed with gradient overlay
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.3) 0%, rgba(15, 23, 26, 0.8) 100%)',
  })

  // Content wrapper - centered slab
  const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 2rem',
  })

  // Title - Trade Gothic Next Condensed Bold equivalent
  // "tall, compressed, aggressive—like a warning stencil"
  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(4rem, 12vw, 10rem)',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '0.9',
    textTransform: 'uppercase',
    color: 'brand.accent',
    margin: '0',
    // Egg Toast yellow - the "danger" color
  })

  // Tagline - IBM Plex Sans
  const taglineStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.75rem, 1.5vw, 1rem)',
    fontWeight: '500',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: 'brand.text',
    marginTop: '1.5rem',
    opacity: '0.8',
  })

  // Description - body copy
  const descriptionStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    color: 'brand.textMuted',
    marginTop: '1.5rem',
    maxWidth: '600px',
  })

  // Logos container - bottom positioned
  const logosContainerStyles = css({
    position: 'absolute',
    bottom: '8vh',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  })

  // Metadata - altitude, credentials
  const metadataItems = ['ALT 8,000M', 'K2 / EVEREST / NANGA PARBAT', 'HIGH ALTITUDE DOP']
</script>

<div class={containerStyles} data-scene="hero">
  <div class={contentStyles}>
    <h1 class={titleStyles} data-animate="text">{title}</h1>
    <p class={taglineStyles} data-animate="text">{tagline}</p>
    <p class={descriptionStyles} data-animate="text">{description}</p>
  </div>

  {#if showLogos}
    <div class={logosContainerStyles}>
      <LogoStrip />
      <MetadataStrip items={metadataItems} />
    </div>
  {/if}
</div>
