<!--
  AboutScene.svelte

  Full-screen About scene with background image and ContentSlab overlay.
  Each About "beat" is its own portal scene for immersive transitions.

  Design: Full-bleed image with ContentSlab sliding in
  Motion: Portal zoom (2.0→1.0), then ContentSlab slides in (100px, 550ms)
  From: docs/plans/2025-01-12-about-section-fullscreen-design.md
-->
<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import { PORTAL_CONTEXT_KEY, type PortalSceneConfig } from '$lib/components/PortalContainer.svelte'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ContentSlab from '../components/ui/ContentSlab.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'

  interface Props {
    /** Unique scene identifier */
    id: string
    /** Beat index (0, 1, 2) for indicator display */
    beatIndex: number
    /** Total number of beats */
    totalBeats: number
    /** Eyebrow/subtitle text */
    subtitle: string
    /** Main description text */
    text: string
    /** Full-bleed background image source */
    imageSrc: string
    /** Image alt text */
    imageAlt?: string
  }

  let {
    id,
    beatIndex,
    totalBeats,
    subtitle,
    text,
    imageSrc,
    imageAlt = subtitle
  }: Props = $props()

  // Portal context for timing calculations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  // Element references
  let containerEl: HTMLElement | null = $state(null)
  let contentSlabWrapperEl: HTMLElement | null = $state(null)
  let bgImageEl: HTMLImageElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  // Responsive check
  let isMobile = $state(false)

  onMount(() => {
    if (!containerEl || !contentSlabWrapperEl) return

    // Check viewport for responsive behavior
    const checkMobile = () => {
      isMobile = window.innerWidth < 768
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

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
      console.warn(`[AboutScene ${id}] Scene not found in portal`)
      return
    }

    // Calculate scroll positions using portal context (accurate variable durations)
    let sectionStart: number
    let sectionEnd: number

    if (portalConfig && portalConfig.durations.length > 0) {
      const startTimes = portalConfig.startTimes
      const durations = portalConfig.durations
      sectionStart = startTimes[sceneIndex] * portalConfig.scrollSpeed
      sectionEnd = (startTimes[sceneIndex] + durations[sceneIndex]) * portalConfig.scrollSpeed

      console.log(`[AboutScene ${id}] Using portal context: sceneIndex=${sceneIndex} duration=${durations[sceneIndex]}s startTime=${startTimes[sceneIndex]}s sectionStart=${sectionStart}px sectionEnd=${sectionEnd}px`)
    } else {
      // Fallback to equal distribution
      const totalHeight = portalContainer.scrollHeight - window.innerHeight
      const sceneCount = allScenes.length
      const sceneHeight = totalHeight / sceneCount
      sectionStart = sceneIndex * sceneHeight
      sectionEnd = (sceneIndex + 1) * sceneHeight

      console.log(`[AboutScene ${id}] Using fallback: sceneIndex=${sceneIndex} sectionStart=${sectionStart}px sectionEnd=${sectionEnd}px`)
    }

    const scrollRange = sectionEnd - sectionStart

    ctx = gsap.context(() => {
      // ========================================================================
      // Ken Burns Effect - Scroll-linked camera movement
      // Brand Physics: Machine archetype - smooth, stabilized, like gimbal tracking
      // ========================================================================

      // Directional variation based on beat index for visual interest
      // Each beat gets a different pan direction, mimicking varied camera angles
      const kenBurnsDirections = [
        { x: -20, y: -15 },   // Beat 0: drift up-left (frontline perspective)
        { x: 25, y: -10 },    // Beat 1: drift up-right (origin story)
        { x: -15, y: 20 },    // Beat 2: drift down-left (values)
      ]
      const direction = kenBurnsDirections[beatIndex % kenBurnsDirections.length]

      // Ken Burns parameters - subtle, cinematic ZOOM OUT
      // Scale: 1.12 → 1.0 (starts pushed in, pulls back to reveal)
      // Harmonizes with portal zoom-out transitions
      const kenBurnsScale = { from: 1.12, to: 1.0 }

      if (bgImageEl) {
        // Set initial state for Ken Burns - start zoomed in with offset
        gsap.set(bgImageEl, {
          scale: kenBurnsScale.from,
          x: direction.x,
          y: direction.y,
          transformOrigin: '50% 50%',
        })

        // Create scroll-linked Ken Burns timeline
        // Zooms OUT as you scroll - "pulling back to reveal the full picture"
        const kenBurnsTl = gsap.timeline()

        kenBurnsTl.to(bgImageEl, {
          scale: kenBurnsScale.to,
          x: 0,
          y: 0,
          ease: 'none', // Linear for scroll-scrub (no easing - scrub handles smoothness)
          duration: 1, // Normalized - ScrollTrigger scrub controls actual timing
        })

        // Attach to scroll - scrub creates the smooth, mechanical feel
        ScrollTrigger.create({
          trigger: portalContainer,
          start: `top+=${sectionStart} top`,
          end: `top+=${sectionEnd} top`,
          scrub: 1.5, // Smooth scrub - mimics gimbal stabilization lag
          animation: kenBurnsTl,
        })

        console.log(`[AboutScene ${id}] Ken Burns (zoom-out): start=(${direction.x}, ${direction.y}) @ ${kenBurnsScale.from}x → end=(0, 0) @ ${kenBurnsScale.to}x`)
      }

      // ========================================================================
      // ContentSlab Animation
      // ========================================================================

      // Set initial state - ContentSlab hidden and offset
      const xOffset = isMobile ? 0 : 100
      const yOffset = isMobile ? 100 : 0

      gsap.set(contentSlabWrapperEl, {
        autoAlpha: 0,
        x: xOffset,
        y: yOffset,
      })

      // Helper to check if ContentSlab needs animation
      const needsReveal = () => {
        const computedStyle = window.getComputedStyle(contentSlabWrapperEl!)
        const opacity = parseFloat(computedStyle.opacity || '0')
        return opacity < 0.5
      }

      // Helper to reveal ContentSlab with animation
      const revealContentSlab = () => {
        if (!needsReveal()) {
          console.log(`[AboutScene ${id}] ContentSlab already visible, skipping animation`)
          return
        }
        console.log(`[AboutScene ${id}] ContentSlab animation START`)
        gsap.to(contentSlabWrapperEl, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: DURATION.standard, // ~0.55s
          ease: BRAND.lockOn,
          onComplete: () => console.log(`[AboutScene ${id}] ContentSlab animation COMPLETE`),
        })
      }

      // ContentSlab entry animation - ONE-SHOT, does NOT reverse on scroll-up
      // This prevents the issue where scrolling backward after card-flip causes
      // the ContentSlab to fade out and slide back in.
      //
      // Timing: triggers at 40% of scene (after portal zoom completes)
      const triggerScrollPosition = sectionStart + scrollRange * 0.4

      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${triggerScrollPosition} top`,
        end: `top+=${triggerScrollPosition + 1} top`, // Minimal range
        onEnter: revealContentSlab,
        // Also reveal when entering from below (e.g., after card-flip reverse)
        onEnterBack: revealContentSlab,
      })

      console.log(`[AboutScene ${id}] ScrollTrigger created: triggerAt=${triggerScrollPosition}px (40% of ${sectionStart}px-${sectionEnd}px)`)
    }, containerEl)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  })

  onDestroy(() => {
    ctx?.revert()
  })

  // Styles
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  const imageStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  })

  const contentSlabWrapperStyles = css({
    position: 'absolute',
    zIndex: '20',

    // Desktop/Tablet: right side
    right: '8vw',
    top: '50%',
    transform: 'translateY(-50%)',
    maxWidth: '400px',

    '@media (max-width: 1023px)': {
      right: '6vw',
      maxWidth: '360px',
    },

    // Mobile: centered vertically
    '@media (max-width: 767px)': {
      right: '4vw',
      left: '4vw',
      top: '50%',
      bottom: 'auto',
      transform: 'translateY(-50%)',
      maxWidth: 'none',
    },
  })

  const beatIndicatorStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  })

  const beatDotStyles = css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
    transition: 'all 0.3s ease',

    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
      transform: 'scale(1.25)',
    },
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="about-{id}">
  <!-- Full-bleed background image with Ken Burns effect -->
  <img
    bind:this={bgImageEl}
    src={imageSrc}
    alt={imageAlt}
    class={imageStyles}
  />

  <!-- ContentSlab - slides in after portal zoom -->
  <div bind:this={contentSlabWrapperEl} class={contentSlabWrapperStyles} data-content-slab>
    <ContentSlab
      eyebrow={subtitle}
      description={text}
    />
  </div>

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <SectionLabel text="ABOUT ME" />
    {/snippet}

    {#snippet bottomCenter()}
      <div class={beatIndicatorStyles}>
        {#each Array(totalBeats) as _, i}
          <div
            class={beatDotStyles}
            data-active={i === beatIndex}
            aria-label="About section {i + 1} of {totalBeats}"
          ></div>
        {/each}
      </div>
    {/snippet}
  </UIChrome>
</div>
