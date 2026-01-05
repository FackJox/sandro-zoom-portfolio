<!--
  ContactSection.svelte

  Final Contact section - CTA with contact information.
  Background scene with contact block positioned left.
  Space for 3D camera reveal (deferred feature).

  Design: Alpine Noir - final frame, call to action
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ContactBlock from '../components/ui/ContactBlock.svelte'

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    // Subtle gradient suggesting depth/scene
    background: 'linear-gradient(135deg, rgba(15, 23, 26, 0.95) 0%, rgba(10, 10, 10, 1) 100%)',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
  })

  // Contact positioned center-left
  const contactContainerStyles = css({
    position: 'absolute',
    left: '8vw',
    top: '50%',
    transform: 'translateY(-50%)',
  })

  // Placeholder for 3D camera (deferred feature)
  const cameraPlaceholderStyles = css({
    position: 'absolute',
    right: '8vw',
    bottom: '15vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    opacity: '0.3',
  })

  // Camera icon placeholder
  const cameraIconStyles = css({
    width: '120px',
    height: '80px',
    border: '1.5px solid',
    borderColor: 'brand.phantom',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6rem',
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: '0.1em',
    color: 'brand.phantom',
  })

  const cameraLabelStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.6rem',
    fontWeight: '400',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
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
  <div class={labelContainerStyles}>
    <SectionLabel text="GET IN TOUCH" variant="accent" />
  </div>

  <div class={contactContainerStyles}>
    <ContactBlock />
  </div>

  <!-- 3D Camera placeholder - will be replaced with actual 3D model -->
  <div class={cameraPlaceholderStyles} data-animate="text">
    <div class={cameraIconStyles}>
      [3D CAMERA]
    </div>
    <span class={cameraLabelStyles}>RED KOMODO 6K</span>
  </div>

  <div class={footerStyles} data-animate="text">
    <span class={footerItemStyles}>&copy; 2024 SANDRO GROMEN-HAYES</span>
    <span class={footerItemStyles}>HIGH ALTITUDE DOP</span>
  </div>
</div>
