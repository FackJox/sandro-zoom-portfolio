<!--
  HeroSection.svelte

  Hero section content for Sandro's portfolio.
  Full-bleed showreel video with name, tagline, and client logos.

  Design: Alpine Noir - "controlled fall: precise, cinematic"
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import LogoStrip from '../components/ui/LogoStrip.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  interface Props {
    videoSrc?: string
  }

  let {
    videoSrc = '/videos/showreel.mp4'
  }: Props = $props()

  // Copy from design spec
  const title = 'sandrogh'
  const tagline = 'HIGH ALTITUDE & HOSTILE ENVIRONMENT'
  const description = "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering."

  // Container - full bleed
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  // Video background layer
  const videoStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // Desaturate and increase contrast per brand spec
    filter: 'saturate(0.3) contrast(1.1)',
  })

  // Dark gradient overlay for text legibility
  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.4) 0%, rgba(15, 23, 26, 0.7) 50%, rgba(15, 23, 26, 0.9) 100%)',
    pointerEvents: 'none',
  })

  // Content wrapper - centered slab
  const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 2rem',
    zIndex: '10',
  })

  // Title - lowercase per design spec
  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(2.5rem, 15vw, 10rem)',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '0.9',
    // Lowercase per design spec
    textTransform: 'lowercase',
    color: 'brand.accent',
    margin: '0',

    '@media (min-width: 768px)': {
      fontSize: 'clamp(3rem, 10vw, 5rem)',
    },
    '@media (min-width: 1024px)': {
      fontSize: 'clamp(4rem, 12vw, 10rem)',
    },
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

    '@media (max-width: 767px)': {
      fontSize: '0.75rem',
      letterSpacing: '0.2em',
    },
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

    '@media (max-width: 767px)': {
      fontSize: '0.9rem',
    },
  })

  // Logos container - bottom positioned
  const logosContainerStyles = css({
    position: 'absolute',
    bottom: '12vh',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    zIndex: '10',

    '@media (max-width: 767px)': {
      bottom: '15vh',
    },
  })
</script>

<div class={containerStyles} data-scene="hero">
  <!-- Video Background -->
  <video
    class={videoStyles}
    src={videoSrc}
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
    data-hero-video
  ></video>

  <!-- Dark Overlay (will animate during transition) -->
  <div class={overlayStyles} data-hero-overlay></div>

  <!-- Content -->
  <div class={contentStyles} data-hero-content>
    <h1 class={titleStyles} data-animate="text">{title}</h1>
    <p class={taglineStyles} data-animate="text">{tagline}</p>
    <p class={descriptionStyles} data-animate="text">{description}</p>
  </div>

  <div class={logosContainerStyles} data-hero-logos>
    <LogoStrip />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
