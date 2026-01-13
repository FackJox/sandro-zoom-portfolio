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
      // Set initial state - ContentSlab hidden and offset
      const xOffset = isMobile ? 0 : 100
      const yOffset = isMobile ? 100 : 0

      gsap.set(contentSlabWrapperEl, {
        autoAlpha: 0,
        x: xOffset,
        y: yOffset,
      })

      // Build timeline for ContentSlab entry
      // Phase 1 (0-40%): Portal zoom completes, image visible
      // Phase 2 (40-70%): ContentSlab slides in
      // Phase 3 (70-100%): Hold for reading
      //
      // IMPORTANT: Timeline must have total duration of 1.0 for proper scroll mapping
      const tl = gsap.timeline()

      // Dummy tween at start to establish timeline from 0
      tl.set({}, {}, 0)

      // ContentSlab entry animation at 40-70% of scene
      tl.to(contentSlabWrapperEl, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        duration: 0.3, // 30% of timeline (40% to 70%)
        ease: BRAND.lockOn,
        onStart: () => console.log(`[AboutScene ${id}] ContentSlab animation START`),
        onComplete: () => console.log(`[AboutScene ${id}] ContentSlab animation COMPLETE`),
      }, 0.4) // Start at 40%

      // Dummy tween at end to ensure timeline duration is exactly 1.0
      tl.set({}, {}, 1.0)

      // Create ScrollTrigger for this scene's internal animations
      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `+=${scrollRange}`,
        scrub: 1,
        animation: tl,
        onUpdate: (self) => {
          const progress = Math.round(self.progress * 100)
          if (progress % 25 === 0) {
            console.log(`[AboutScene ${id}] progress=${progress}% scroll=${Math.round(self.scroll())}px tlProgress=${(tl.progress() * 100).toFixed(1)}%`)
          }
        },
      })

      console.log(`[AboutScene ${id}] ScrollTrigger created: start=${sectionStart}px end=${sectionEnd}px range=${scrollRange}px tlDuration=${tl.duration()}`)
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

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
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

  const beatIndicatorContainerStyles = css({
    position: 'absolute',
    bottom: '8vh',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    zIndex: '10',

    '@media (max-width: 767px)': {
      bottom: '4vh',
    },
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
  <!-- Full-bleed background image -->
  <img
    src={imageSrc}
    alt={imageAlt}
    class={imageStyles}
  />

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="ABOUT ME" />
  </div>

  <!-- ContentSlab - slides in after portal zoom -->
  <div bind:this={contentSlabWrapperEl} class={contentSlabWrapperStyles} data-content-slab>
    <ContentSlab
      eyebrow={subtitle}
      description={text}
    />
  </div>

  <!-- Beat Indicators -->
  <div class={beatIndicatorContainerStyles}>
    {#each Array(totalBeats) as _, i}
      <div
        class={beatDotStyles}
        data-active={i === beatIndex}
        aria-label="About section {i + 1} of {totalBeats}"
      ></div>
    {/each}
  </div>
</div>
