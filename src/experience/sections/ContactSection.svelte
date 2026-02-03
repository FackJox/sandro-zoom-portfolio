<!--
  ContactSection.svelte

  Final Contact section - centered CTA with contact information.
  Minimal layout, no scroll hint (final section).

  Design: Centered, minimal
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ContactBlock from '../components/ui/ContactBlock.svelte'

  interface Props {
    backgroundSrc?: string
  }

  let { backgroundSrc = '/pictures/Film Himal Sicker 01.jpg' }: Props = $props()

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

  // Background image
  const bgImageStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'saturate(0.3) contrast(1.1)',
  })

  // Dark overlay - centered gradient
  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.7) 0%, rgba(15, 23, 26, 0.85) 50%, rgba(15, 23, 26, 0.7) 100%)',
    pointerEvents: 'none',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })

  // Contact positioned center
  const contactContainerStyles = css({
    position: 'relative',
    zIndex: '10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  })

  // Footer info
  const footerStyles = css({
    position: 'absolute',
    bottom: '4vh',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    zIndex: '10',

    '@media (max-width: 767px)': {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
    },
  })

  const footerItemStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.6rem',
    fontWeight: '400',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
    opacity: '0.5',
  })
</script>

<div class={containerStyles} data-scene="contact">
  <!-- Background Image -->
  <img
    class={bgImageStyles}
    src={backgroundSrc}
    alt=""
    loading="eager"
  />

  <!-- Dark Overlay -->
  <div class={overlayStyles}></div>

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="CONTACT" />
  </div>

  <!-- Contact Block (centered) -->
  <div class={contactContainerStyles}>
    <ContactBlock />
  </div>

  <!-- Footer -->
  <div class={footerStyles} data-animate="text">
    <span class={footerItemStyles}>&copy; 2026 SANDRO GROMEN-HAYES</span>
    <span class={footerItemStyles}>HIGH ALTITUDE DOP</span>
  </div>
</div>
