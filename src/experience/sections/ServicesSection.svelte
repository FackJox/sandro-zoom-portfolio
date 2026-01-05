<!--
  ServicesSection.svelte

  Services section - credits roll style on black.
  Lists available services with CTA to continue.

  Design: Alpine Noir - stark, cinematic credits
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ServicesCredits from '../components/ui/ServicesCredits.svelte'

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    // Pure black background - stark credits
    background: '#0a0a0a',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
  })

  const creditsContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  })

  // Scroll CTA at bottom
  const ctaStyles = css({
    position: 'absolute',
    bottom: '8vh',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: '500',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
    '&:hover': {
      opacity: '0.8',
    },
  })

  const arrowStyles = css({
    fontSize: '1rem',
    animation: 'bounce 1.5s ease infinite',
  })
</script>

<div class={containerStyles} data-scene="services">
  <div class={labelContainerStyles}>
    <SectionLabel text="SERVICES" variant="accent" />
  </div>

  <div class={creditsContainerStyles}>
    <ServicesCredits />
  </div>

  <div class={ctaStyles} data-animate="text">
    <span>ONE MORE SHOT</span>
    <span class={arrowStyles}>&#8595;</span>
  </div>
</div>

<style>
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(5px);
    }
    60% {
      transform: translateY(3px);
    }
  }
</style>
