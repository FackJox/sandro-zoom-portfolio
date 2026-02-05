<!--
  HeroShowreelScene.svelte

  Combined Hero + Showreel scene with internal fade reveal transition.
  Appears as a SINGLE scene to PortalContainer, handles Hero → Showreel
  transition internally via scroll-driven state.

  Transition behavior:
  - 0-40% scroll: Hero state (desaturated video, content visible, overlay)
  - 40-60% scroll: Transition (content fades, overlay fades, color reveals)
  - 60-100% scroll: Showreel state (full color video, minimal chrome)

  Design: Alpine Noir - cinematic fade reveal
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { DURATION } from '$lib/animation/easing'
  import { PORTAL_CONTEXT_KEY, type PortalSceneConfig } from '$lib/components/PortalContainer.svelte'
  import LogoStrip from '../components/ui/LogoStrip.svelte'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'
  import VideoLoadingSpinner from '../components/ui/VideoLoadingSpinner.svelte'

  // Get portal context for scene durations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  interface Props {
    videoSrc?: string
    onVideoReady?: () => void
    entranceReady?: boolean
    isLoading?: boolean
  }

  let {
    videoSrc = '/videos/showreel.mp4',
    onVideoReady,
    entranceReady = false,
    isLoading = true
  }: Props = $props()

  // Copy from design spec
  const tagline = 'HIGH ALTITUDE & HOSTILE ENVIRONMENT'
  const description = "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering."

  // State
  let containerEl: HTMLElement | null = $state(null)
  let videoEl: HTMLVideoElement | null = $state(null)
  let logoEl: HTMLImageElement | null = $state(null)
  let supportingTextEl: HTMLElement | null = $state(null)
  let logosEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  // Video loading state
  let videoReady = $state(false)

  // Entrance animation state
  let hasAnimatedEntrance = $state(false)
  let entranceTimeline: gsap.core.Timeline | null = null

  // Reactive scroll progress (0-1 within this scene)
  let scrollProgress = $state(0)

  // Derived states based on scroll progress
  const isShowreelMode = $derived(scrollProgress > 0.5)
  const transitionProgress = $derived(
    scrollProgress < 0.4 ? 0 :
    scrollProgress > 0.6 ? 1 :
    (scrollProgress - 0.4) / 0.2
  )

  // Video filter interpolation
  const videoFilter = $derived(
    `saturate(${0.3 + transitionProgress * 0.7}) contrast(${1.1 - transitionProgress * 0.1})`
  )

  // Content opacity (fade out during transition)
  const contentOpacity = $derived(1 - transitionProgress)

  // Content transform (slide up during transition)
  const contentTransform = $derived(`translateY(${-transitionProgress * 30}px)`)

  // Overlay opacity (fade out during transition)
  const overlayOpacity = $derived(1 - transitionProgress)

  // Showreel label opacity (fade in during transition)
  const showreelLabelOpacity = $derived(transitionProgress)

  // Video load detection - optimized for fast loader transition
  // Uses 'canplay' instead of 'canplaythrough' since poster provides visual fallback
  // With progressive mounting, showreel now has 100% bandwidth priority
  $effect(() => {
    if (!videoEl) return

    const handleCanPlay = () => {
      videoReady = true
      onVideoReady?.()
    }

    // Check if already ready (cached video)
    // readyState 3 = HAVE_FUTURE_DATA (enough to start playing)
    if (videoEl.readyState >= 3) {
      handleCanPlay()
      return
    }

    videoEl.addEventListener('canplay', handleCanPlay)

    // Shorter timeout fallback (2.5 seconds) - poster provides seamless visual
    // Prioritize fast loader transition over waiting for full buffer
    const timeout = setTimeout(() => {
      if (!videoReady) {
        videoReady = true
        onVideoReady?.()
      }
    }, 2500)

    return () => {
      videoEl?.removeEventListener('canplay', handleCanPlay)
      clearTimeout(timeout)
    }
  })

  // Initialize hidden states via GSAP on mount
  // Set initial hidden state for supporting elements (NOT logo - it stays visible during loading)
  $effect(() => {
    if (!supportingTextEl || !logosEl) return

    // Set initial hidden state - GSAP controls everything EXCEPT logo
    // Logo stays visible for branded loading experience
    gsap.set([supportingTextEl, logosEl], { autoAlpha: 0 })
  })

  // Logo is now visible by default (no fade-in needed)
  // It shows immediately during loading for branded loader experience
  // The entrance animation for other elements still runs when entranceReady becomes true

  // Entrance animation effect
  // Robust pattern: single timeline with built-in delays for loader coordination
  $effect(() => {
    if (!entranceReady || hasAnimatedEntrance || !supportingTextEl || !logosEl) return

    // Prevent re-running
    hasAnimatedEntrance = true

    // Brand Physics: ease-lock-on for entering elements
    const easeLockOn = 'cubic-bezier(0.19, 1.0, 0.22, 1.0)'

    // Loader fade duration is 550ms
    // Start entrance at 400ms to overlap with end of loader fade
    const loaderOverlap = 0.4

    // Single timeline coordinates entire entrance
    entranceTimeline = gsap.timeline()

    // Logos fade and rise in first (starts during loader fade-out)
    entranceTimeline.fromTo(logosEl,
      { autoAlpha: 0, y: 15 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: easeLockOn },
      loaderOverlap
    )

    // Pause, then supporting text fades and rises in
    entranceTimeline.fromTo(supportingTextEl,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: easeLockOn },
      loaderOverlap + 0.8 // 400ms pause after logos finish
    )
  })

  // Scroll-based fade-out (after entrance complete)
  // GSAP controls opacity to avoid inline style conflicts
  $effect(() => {
    if (!hasAnimatedEntrance || !supportingTextEl || !logosEl) return

    // Sync opacity with scroll progress
    gsap.set([supportingTextEl, logosEl], { opacity: contentOpacity })
  })

  onMount(() => {
    if (!containerEl) return

    // Find the portal container to calculate scroll positions
    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) return

    ctx = gsap.context(() => {
      // Get all scenes to find our position
      const viewport = portalContainer.querySelector('[style*="position: fixed"]')
      if (!viewport) return

      const allScenes = viewport.querySelectorAll('[data-scene]')
      let sceneIndex = -1
      allScenes.forEach((scene, i) => {
        if (scene === containerEl) sceneIndex = i
      })

      if (sceneIndex < 0) return

      // Calculate this scene's scroll range
      let sceneStart: number
      let sceneEnd: number

      if (portalConfig && portalConfig.durations.length > 0) {
        // Use context-provided durations
        const startTimes = portalConfig.startTimes
        const durations = portalConfig.durations
        sceneStart = startTimes[sceneIndex] * portalConfig.scrollSpeed
        sceneEnd = (startTimes[sceneIndex] + durations[sceneIndex]) * portalConfig.scrollSpeed

        console.log('[HeroShowreel] ScrollTrigger setup (from context):', {
          sceneIndex,
          duration: `${durations[sceneIndex]}s`,
          startTime: `${startTimes[sceneIndex]}s`,
          sceneStart: `${sceneStart}px`,
          sceneEnd: `${sceneEnd}px`,
        })
      } else {
        // Fallback to equal distribution
        const totalHeight = portalContainer.scrollHeight - window.innerHeight
        const sceneCount = allScenes.length
        const sceneHeight = totalHeight / sceneCount
        sceneStart = sceneIndex * sceneHeight
        sceneEnd = (sceneIndex + 1) * sceneHeight

        console.log('[HeroShowreel] ScrollTrigger setup (fallback equal):', {
          sceneIndex,
          sceneCount,
          sceneStart,
          sceneEnd,
        })
      }

      // Create ScrollTrigger to track progress within this scene
      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sceneStart} top`,
        end: `top+=${sceneEnd} top`,
        scrub: true,
        onUpdate: (self) => {
          scrollProgress = self.progress
          // Log every 10%
          const progress = Math.round(self.progress * 100)
          if (progress % 10 === 0) {
            console.log(`[HeroShowreel] Progress: ${progress}%`)
          }
        },
        onEnter: () => console.log('[HeroShowreel] ScrollTrigger ENTER'),
        onLeave: () => console.log('[HeroShowreel] ScrollTrigger LEAVE'),
      })
    })
  })

  onDestroy(() => {
    entranceTimeline?.kill()
    ctx?.revert()
  })

  // Styles

  // Loader overlay - fades out when isLoading becomes false
  // z-index 150: above UIChrome (100) but below logo content wrapper (200)
  const loaderOverlayStyles = css({
    position: 'absolute',
    inset: '0',
    backgroundColor: '#0f171a', // Black Stallion
    zIndex: '150',
    transition: 'opacity 550ms cubic-bezier(0.25, 0.0, 0.35, 1.0)',
    pointerEvents: 'none',
  })

  // Spinner container - always in DOM to prevent layout shift
  // Visibility controlled via opacity/visibility, not conditional rendering
  const loaderSpinnerContainerStyles = css({
    position: 'relative',
    width: '40px',
    height: '40px',
    marginTop: '2rem',
    // Fade out transition matching loader overlay
    transition: 'opacity 550ms cubic-bezier(0.25, 0.0, 0.35, 1.0), visibility 550ms cubic-bezier(0.25, 0.0, 0.35, 1.0)',
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

  const videoStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  })

  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.4) 0%, rgba(15, 23, 26, 0.7) 50%, rgba(15, 23, 26, 0.9) 100%)',
    pointerEvents: 'none',
    transition: 'opacity 0.1s linear',
  })

  // Main content wrapper - positions both logo and supporting text
  // z-index 200 to be above loader overlay (100) so logo shows through
  const contentWrapperStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 2rem',
    zIndex: '200',
    position: 'relative',
  })

  // Logo - VISIBLE IMMEDIATELY during loading for branded loader experience
  // Shows through the loader overlay (z-index 200 > loader z-index 150)
  const logoStyles = css({
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    margin: '0',
    // Logo visible by default - shows branded loading screen
    opacity: '1',
    visibility: 'visible',
  })

  // Supporting text container - starts hidden via CSS, GSAP controls entrance
  const supportingTextStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    opacity: '0', // Prevent flash before GSAP takes over
    visibility: 'hidden',
  })

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

  // Logos container - starts hidden via CSS, GSAP controls entrance
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
    opacity: '0', // Prevent flash before GSAP takes over
    visibility: 'hidden',

    '@media (max-width: 767px)': {
      bottom: '15vh',
    },
  })

  // Showreel-specific styles
  const gradientStyles = css({
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '200px',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: '5',
    transition: 'opacity 0.1s linear',
  })

  const labelWrapperStyles = css({
    transition: 'opacity 0.1s linear',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="hero-showreel">
  <!-- Loader overlay - same stacking context guarantees pixel-perfect logo alignment -->
  <div
    class={loaderOverlayStyles}
    style:opacity={isLoading ? 1 : 0}
    aria-hidden={!isLoading}
    data-loader
  ></div>

  <!-- Video Background (filter animates based on scroll) -->
  <!-- Poster provides seamless initial display while video preloads -->
  <!-- fetchpriority="high" signals browser to prioritize this over other resources -->
  <video
    bind:this={videoEl}
    class={videoStyles}
    style:filter={videoFilter}
    src={videoSrc}
    poster="/videos/showreel-poster.webp"
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
    preload="auto"
    fetchpriority="high"
  ></video>

  <!-- Hero Overlay (fades out during transition) -->
  <div
    class={overlayStyles}
    style:opacity={overlayOpacity}
  ></div>

  <!-- Hero Content -->
  <div
    class={contentWrapperStyles}
    style:opacity={contentOpacity}
    style:transform={contentTransform}
  >
    <!-- Logo - fades in once layout stable, shows through loader overlay -->
    <img bind:this={logoEl} src="/sandro-logo.png" alt="Sandro" class={logoStyles} />

    <!-- Loading spinner - always in DOM to prevent layout shift, visibility controlled via styles -->
    <div
      class={loaderSpinnerContainerStyles}
      style:opacity={isLoading ? 1 : 0}
      style:visibility={isLoading ? 'visible' : 'hidden'}
    >
      <VideoLoadingSpinner visible={isLoading} showBackdrop={false} size={40} />
    </div>

    <!-- Supporting text - GSAP controls entrance and scroll fade-out -->
    <div
      bind:this={supportingTextEl}
      class={supportingTextStyles}
    >
      <p class={taglineStyles}>{tagline}</p>
      <p class={descriptionStyles}>{description}</p>
    </div>
  </div>

  <!-- Hero Logos - GSAP controls entrance and scroll fade-out -->
  <div
    bind:this={logosEl}
    class={logosContainerStyles}
  >
    <LogoStrip />
  </div>

  <!-- Showreel Top Gradient (fades in during transition) -->
  <div
    class={gradientStyles}
    style:opacity={showreelLabelOpacity}
  ></div>

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <div class={labelWrapperStyles} style:opacity={showreelLabelOpacity}>
        <SectionLabel text="SHOWREEL" />
      </div>
    {/snippet}

    {#snippet bottomCenter()}
      <ScrollHint />
    {/snippet}
  </UIChrome>
</div>
