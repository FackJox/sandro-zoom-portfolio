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

  // Get portal context for scene durations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  interface Props {
    videoSrc?: string
  }

  let {
    videoSrc = '/videos/showreel.mp4'
  }: Props = $props()

  // Copy from design spec
  const tagline = 'HIGH ALTITUDE & HOSTILE ENVIRONMENT'
  const description = "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering."

  // State
  let containerEl: HTMLElement | null = $state(null)
  let videoEl: HTMLVideoElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

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
    ctx?.revert()
  })

  // Styles
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

  const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 2rem',
    zIndex: '10',
    transition: 'opacity 0.1s linear',
  })

  const logoStyles = css({
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    margin: '0',
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
    transition: 'opacity 0.1s linear',

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

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
    transition: 'opacity 0.1s linear',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="hero-showreel">
  <!-- Video Background (filter animates based on scroll) -->
  <video
    bind:this={videoEl}
    class={videoStyles}
    style:filter={videoFilter}
    src={videoSrc}
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
  ></video>

  <!-- Hero Overlay (fades out during transition) -->
  <div
    class={overlayStyles}
    style:opacity={overlayOpacity}
  ></div>

  <!-- Hero Content (fades and slides out during transition) -->
  <div
    class={contentStyles}
    style:opacity={contentOpacity}
    style:transform={contentTransform}
  >
    <img src="/sandro-logo.png" alt="Sandro" class={logoStyles} data-animate="text" />
    <p class={taglineStyles} data-animate="text">{tagline}</p>
    <p class={descriptionStyles} data-animate="text">{description}</p>
  </div>

  <!-- Hero Logos (fades and slides out during transition) -->
  <div
    class={logosContainerStyles}
    style:opacity={contentOpacity}
    style:transform={contentTransform}
  >
    <LogoStrip />
  </div>

  <!-- Showreel Top Gradient (fades in during transition) -->
  <div
    class={gradientStyles}
    style:opacity={showreelLabelOpacity}
  ></div>

  <!-- Showreel Label (fades in during transition) -->
  <div
    class={labelContainerStyles}
    style:opacity={showreelLabelOpacity}
  >
    <SectionLabel text="SHOWREEL" />
  </div>

  <!-- Scroll Hint (always visible) -->
  <ScrollHint />
</div>
