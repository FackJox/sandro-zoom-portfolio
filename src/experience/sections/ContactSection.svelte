<!--
  ContactSection.svelte

  Final Contact section - centered CTA with contact information.
  Minimal layout, no scroll hint (final section).

  Design: Centered, minimal
  Motion: Ken Burns effect on background - subtle camera drift
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { PORTAL_CONTEXT_KEY, type PortalSceneConfig } from '$lib/components/PortalContainer.svelte'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ContactBlock from '../components/ui/ContactBlock.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'
  import InstagramStrip from '../components/ui/InstagramStrip.svelte'

  interface Props {
    backgroundSrc?: string
  }

  let { backgroundSrc = '/pictures/EVEREST CLEAN (1 of 2).jpg' }: Props = $props()

  // Portal context for timing calculations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  // Element references
  let containerEl: HTMLElement | null = $state(null)
  let bgImageEl: HTMLImageElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  onMount(() => {
    if (!containerEl || !bgImageEl) return

    // Get portal container for scroll calculations
    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) return

    const viewport = portalContainer.querySelector('[style*="position: fixed"]')
    if (!viewport) return

    // Find this scene's index in the portal
    const allScenes = viewport.querySelectorAll('[data-scene]')
    let sceneIndex = -1
    allScenes.forEach((scene, i) => {
      if (scene === containerEl) sceneIndex = i
    })

    if (sceneIndex < 0) {
      console.warn('[ContactSection] Scene not found in portal')
      return
    }

    // Calculate scroll positions using portal context
    let sectionStart: number
    let sectionEnd: number

    if (portalConfig && portalConfig.durations.length > 0) {
      const startTimes = portalConfig.startTimes
      const durations = portalConfig.durations
      sectionStart = startTimes[sceneIndex] * portalConfig.scrollSpeed
      sectionEnd = (startTimes[sceneIndex] + durations[sceneIndex]) * portalConfig.scrollSpeed

      console.log(`[ContactSection] Using portal context: sceneIndex=${sceneIndex} sectionStart=${sectionStart}px sectionEnd=${sectionEnd}px`)
    } else {
      // Fallback to equal distribution
      const totalHeight = portalContainer.scrollHeight - window.innerHeight
      const sceneCount = allScenes.length
      const sceneHeight = totalHeight / sceneCount
      sectionStart = sceneIndex * sceneHeight
      sectionEnd = (sceneIndex + 1) * sceneHeight
    }

    ctx = gsap.context(() => {
      // ========================================================================
      // Ken Burns Effect - Scroll-linked camera movement
      // Brand Physics: Machine archetype - smooth, stabilized, like gimbal tracking
      // Final section: gentle upward drift suggesting ascent/transcendence
      // ========================================================================

      // Ken Burns direction for contact: subtle upward drift
      // Suggests looking up, aspiration, the final summit
      const direction = { x: 10, y: -25 }

      // Ken Burns parameters - subtle, cinematic ZOOM OUT
      // Scale: 1.10 → 1.0 (starts pushed in, pulls back to reveal)
      // Harmonizes with portal zoom-out transitions
      const kenBurnsScale = { from: 1.10, to: 1.0 }

      // Set initial state - start zoomed in with offset
      gsap.set(bgImageEl, {
        scale: kenBurnsScale.from,
        x: direction.x,
        y: direction.y,
        transformOrigin: '50% 50%',
      })

      // Create scroll-linked Ken Burns timeline
      // Zooms OUT as you scroll - "pulling back to reveal"
      const kenBurnsTl = gsap.timeline()

      kenBurnsTl.to(bgImageEl, {
        scale: kenBurnsScale.to,
        x: 0,
        y: 0,
        ease: 'none', // Linear for scroll-scrub
        duration: 1,
      })

      // Attach to scroll
      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `top+=${sectionEnd} top`,
        scrub: 1.5, // Smooth scrub - gimbal stabilization feel
        animation: kenBurnsTl,
      })

      console.log(`[ContactSection] Ken Burns (zoom-out): start=(${direction.x}, ${direction.y}) @ ${kenBurnsScale.from}x → end=(0, 0) @ ${kenBurnsScale.to}x`)
    }, containerEl)
  })

  onDestroy(() => {
    ctx?.revert()
  })

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

  // Contact positioned center
  const contactContainerStyles = css({
    position: 'relative',
    zIndex: '10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  })

  // Instagram strip container - positioned at bottom, above footer
  const instagramStripContainerStyles = css({
    position: 'absolute',
    bottom: '10vh',
    left: '0',
    right: '0',
    zIndex: '10',

    '@media (max-width: 767px)': {
      bottom: '12vh',
    },
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

<div bind:this={containerEl} class={containerStyles} data-scene="contact">
  <!-- Background Image with Ken Burns effect -->
  <img
    bind:this={bgImageEl}
    class={bgImageStyles}
    src={backgroundSrc}
    alt=""
    loading="eager"
  />

  <!-- Dark Overlay -->
  <div class={overlayStyles}></div>

  <!-- Contact Block (centered) -->
  <div class={contactContainerStyles}>
    <ContactBlock />
  </div>

  <!-- Instagram Feed Strip -->
  <div class={instagramStripContainerStyles}>
    <InstagramStrip />
  </div>

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <SectionLabel text="CONTACT" />
    {/snippet}
  </UIChrome>

  <!-- Footer -->
  <div class={footerStyles} data-animate="text" data-direction="down">
    <span class={footerItemStyles}>&copy; 2026 SANDRO GROMEN-HAYES</span>
    <span class={footerItemStyles}>HIGH ALTITUDE DOP</span>
  </div>
</div>
