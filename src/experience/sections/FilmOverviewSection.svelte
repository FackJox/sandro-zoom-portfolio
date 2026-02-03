<!--
  FilmOverviewSection.svelte

  Scroll-driven film showcase with overview → focus → overview cycle.
  Uses GSAP Flip for seamless layout transitions and TextPlugin for label scramble.

  Timing (36s scene per spec):
  - Portal buffer start: 0-5% (1.8s)
  - Film cycles: 5-95% (4 films × 8.1s each = 32.4s)
  - Portal buffer end: 95-100% (1.8s)

  Brand Physics:
  - brand-micro: 175ms (border changes)
  - brand-standard: 315ms (content animations)
  - brand-cinematic: 550ms (major transitions)

  Design: docs/plans/2025-01-07-film-overview-section-design.md
-->
<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger, Flip } from '$lib/core/gsap'
  import { DURATION } from '$lib/animation/easing'
  import { PORTAL_CONTEXT_KEY, type PortalSceneConfig } from '$lib/components/PortalContainer.svelte'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import BorderedViewport from '../components/ui/BorderedViewport.svelte'
  import ContentSlab from '../components/ui/ContentSlab.svelte'
  import StepIndicator from '../components/ui/StepIndicator.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'

  // Get portal context for scene durations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  // Film project data
  interface FilmProject {
    id: string
    title: string
    client: string
    year: string
    description: string
    media: {
      type: 'youtube' | 'video' | 'image'
      src: string
      srcWebm?: string    // AV1/WebM optimized version
      srcHevc?: string    // HEVC/MP4 optimized version
      poster?: string
      externalLink?: string
    }
  }

  const films: FilmProject[] = [
    {
      id: '14-peaks',
      title: '14 PEAKS',
      client: 'NETFLIX',
      year: '2021',
      description: "I worked as lead cinematographer on Netflix's smash hit 14 Peaks. I shot most of the drone footage along with key scenes including the intro, Nims visiting his family and the K2 drama. I then worked as DOP on the first successful K2 winter expedition.",
      media: {
        type: 'youtube',
        src: 'https://www.youtube.com/embed/8QH5hBOoz08'
      }
    },
    {
      id: 'no-days-off',
      title: 'NO DAYS OFF',
      client: 'REDBULL TV',
      year: '2022',
      description: "In 2022 I filmed episode 1 of Sasha DiGiulian's 'No Days Off' series for RedBull TV. During preparation for Petzl's RocTrip Sasha, Alex Megos, Steve McClure & Neil Gresham developed new routes in a remote and undeveloped corner of Greece's mainland.",
      media: {
        type: 'image',
        src: 'https://static.wixstatic.com/media/37d07c_5ed3218453264242ab5e39b7c013c723~mv2.jpg',
        externalLink: 'https://www.redbull.com/us-en/episodes/no-days-off-s1-e1'
      }
    },
    {
      id: 'grace',
      title: 'GRACE',
      client: 'MONTANE',
      year: '2023',
      description: 'I directed, shot and edited the story of Grace, a recovering climber searching for a bigger life. Focusing on mental health and community the film was supported by Montane and played at film festivals world wide.',
      media: {
        type: 'video',
        src: '/videos/grace.mp4',
        srcWebm: '/videos/grace.av1.webm',
        srcHevc: '/videos/grace.hevc.mp4'
      }
    },
    {
      id: 'afghanistan',
      title: 'AFGHANISTAN',
      client: 'CHARLES SCHWAB',
      year: '2019',
      description: 'Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m.',
      media: {
        type: 'video',
        src: '/videos/shwab.mp4',
        srcWebm: '/videos/shwab.av1.webm',
        srcHevc: '/videos/shwab.hevc.mp4'
      }
    },
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let labelTextEl: HTMLSpanElement | null = $state(null)
  let ctx: gsap.Context | null = null
  let activeIndex = $state(0)
  let phase = $state<'overview' | 'focus' | 'transition'>('overview')

  // Derived state
  const currentFilm = $derived(films[activeIndex])
  const labelText = 'FILM'
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // Timeline proportions (component-level for access in onUpdate)
  const PORTAL_BUFFER = 0.05
  const ACTIVE_START = PORTAL_BUFFER
  const ACTIVE_END = 1 - PORTAL_BUFFER
  const ACTIVE_RANGE = ACTIVE_END - ACTIVE_START // 90%
  const FILM_RANGE = ACTIVE_RANGE / films.length // 22.5% each

  // Phase thresholds within each film's cycle (relative to FILM_RANGE)
  const PHASE_LAYOUT_SHIFT = 0.222
  const PHASE_LAYOUT_RESET = 0.667

  // DIAGNOSTIC: Log phase and activeIndex changes with video sources
  $effect(() => {
    const videoSrc = currentFilm?.media?.src || 'none'
    console.log(`[FilmOverview] STATE_CHANGE: phase=${phase} activeIndex=${activeIndex} currentFilm=${currentFilm?.id} videoSrc=${videoSrc}`)
  })

  // Mobile detection
  let isMobile = $state(false)

  $effect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(max-width: 767px)')
    isMobile = mql.matches

    const handler = (e: MediaQueryListEvent) => {
      isMobile = e.matches
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  })

  // Cleanup
  onDestroy(() => {
    ctx?.revert()
  })

  /**
   * Build the scroll-driven timeline for film overview transitions.
   * Uses GSAP Flip for seamless layout transitions between overview and focus states.
   *
   * Brand Physics durations (as proportions of 36s scene):
   * - brand-micro: 0.175s / 36s ≈ 0.0049
   * - brand-standard: 0.315s / 36s ≈ 0.0088
   * - brand-cinematic: 0.55s / 36s ≈ 0.0153
   *
   * Structure:
   * - 0-5%: Portal in buffer + initial fadeIn
   * - 5-95%: 4 film cycles (22.5% each)
   * - 95-100%: Portal out buffer
   */
  function buildFilmTimeline(container: HTMLElement, mobile: boolean): gsap.core.Timeline {
    const tl = gsap.timeline()

    const filmFrames = container.querySelectorAll('[data-film]') as NodeListOf<HTMLElement>
    const focusLayout = container.querySelector('[data-focus-layout]') as HTMLElement
    const contentSlabContainer = container.querySelector('[data-content-slab-container]') as HTMLElement
    const contentSlab = container.querySelector('[data-content-slab]') as HTMLElement
    const overviewGrid = container.querySelector('[data-overview-grid]') as HTMLElement
    const labelTextElement = container.querySelector('[data-section-label-text]') as HTMLElement

    // Log film data for video source verification
    console.log(`[FilmOverview] buildFilmTimeline - filmCount=${filmFrames.length} mobile=${mobile}`)
    films.forEach((film, i) => {
      console.log(`[FilmOverview] Film data ${i}: id=${film.id} video=${film.media.src}`)
    })

    // Timeline proportions (0-1)
    const PORTAL_BUFFER = 0.05 // 5% at start and end for portal transitions
    const ACTIVE_START = PORTAL_BUFFER
    const ACTIVE_END = 1 - PORTAL_BUFFER
    const ACTIVE_RANGE = ACTIVE_END - ACTIVE_START // 90%

    // Each film gets equal share of active range
    const FILM_RANGE = ACTIVE_RANGE / films.length // 22.5% each

    // Brand Physics durations as proportions (36s scene per spec)
    const SCENE_DURATION = 36 // seconds
    const MICRO = DURATION.micro / SCENE_DURATION
    const STANDARD = DURATION.standard / SCENE_DURATION
    const CINEMATIC = DURATION.cinematic / SCENE_DURATION

    // Initialize all elements - start with opacity 0 for fadeIn
    filmFrames.forEach((frame, i) => {
      gsap.set(frame, { autoAlpha: 0, scale: 0.95, width: '100%' })
    })

    // Initialize focus layout (hidden initially, shown during focus state)
    if (focusLayout) {
      gsap.set(focusLayout, { autoAlpha: 0, pointerEvents: 'none' })
    }

    // Initialize content slab within focus layout (offset for enter animation)
    if (contentSlab) {
      gsap.set(contentSlab, {
        autoAlpha: 0,
        x: mobile ? 0 : 40,
        y: mobile ? 30 : 0
      })
    }

    // INITIAL FADE IN - Should complete right as portal transition finishes
    // Portal transition occupies first 5% of scroll, fadeIn should sync with it
    // Start fadeIn partway through portal so films are visible when portal completes
    const FADE_IN_START = PORTAL_BUFFER - CINEMATIC // Start early so it completes at 5%

    // Film cycle phases (relative to film's range)
    // Based on spec: 9s cycle with specific timings
    // See: docs/plans/2025-01-07-film-overview-section-design.md
    const PHASES = {
      HOLD_START: 0.03,        // Brief hold before animations start
      BORDER_FADE: 0.089,      // 0.8s/9s - Border accent change
      OTHERS_EXIT: 0.133,      // 1.2s/9s - Others start fading
      LABEL_SCRAMBLE: 0.200,   // 1.8s/9s - Label text scramble
      LAYOUT_SHIFT: 0.222,     // 2.0s/9s - Layout transition begins
      CROSSFADE_IN: 0.260,     // 2.3s/9s - Crossfade thumbnail → video player
      CONTENT_ENTER: 0.289,    // 2.6s/9s - Content slab enters
      // HOLD for reading: 2.6s - 5.6s = 3s reading time
      CONTENT_EXIT: 0.622,     // 5.6s/9s - Content starts leaving
      CROSSFADE_OUT: 0.640,    // 5.8s/9s - Crossfade video player → thumbnail
      LAYOUT_RESET: 0.667,     // 6.0s/9s - Return to overview
      OTHERS_RETURN: 0.722,    // 6.5s/9s - Others fade back in
      LABEL_RESET: 0.778,      // 7.0s/9s - Label back to "FILM"
      ACCENT_SHIFT: 0.800,     // 7.2s/9s - Prepare for next film
    }


    filmFrames.forEach((frame, i) => {
      tl.to(frame, {
        autoAlpha: 1,
        scale: 1,
        duration: CINEMATIC,
        ease: 'ease-lock-on',
      }, Math.max(0.01, FADE_IN_START) + (i * 0.002)) // Slight stagger
    })

    // Build animation for each film
    films.forEach((film, filmIndex) => {
      const cycleStart = ACTIVE_START + (filmIndex * FILM_RANGE)
      const cycleEnd = cycleStart + FILM_RANGE
      const currentFrame = filmFrames[filmIndex] as HTMLElement
      const otherFrames = Array.from(filmFrames).filter((_, i) => i !== filmIndex) as HTMLElement[]

      const currentBorder = currentFrame?.querySelector('[data-bordered-viewport]') as HTMLElement
      const otherBorders = otherFrames.map(f => f.querySelector('[data-bordered-viewport]') as HTMLElement)

      // Convert phase to absolute timeline position
      const pos = (p: number) => cycleStart + (p * FILM_RANGE)

      // PHASE 1: Border accent to current film
      if (currentBorder) {
        tl.to(currentBorder, {
          borderColor: '#f6c605',
          duration: MICRO,
          ease: 'ease-lock-on',
        }, pos(PHASES.BORDER_FADE))
      }

      // Dim other borders
      otherBorders.forEach(border => {
        if (border) {
          tl.to(border, {
            borderColor: '#707977',
            duration: MICRO,
            ease: 'ease-lock-on',
          }, pos(PHASES.BORDER_FADE))
        }
      })

      // PHASE 2: Others exit with scale and fade
      otherFrames.forEach(frame => {
        if (mobile) {
          tl.to(frame, {
            scale: 0.9,
            y: -30,
            autoAlpha: 0,
            duration: CINEMATIC,
            ease: 'ease-release',
          }, pos(PHASES.OTHERS_EXIT))
        } else {
          tl.to(frame, {
            scale: 0.85,
            autoAlpha: 0,
            duration: CINEMATIC,
            ease: 'ease-release',
          }, pos(PHASES.OTHERS_EXIT))
        }
      })

      // PHASE 4: Layout shift - transition from overview grid to focus layout
      // The focus layout is a separate CSS Grid with proper 60/40 split
      // Fade out all thumbnails and fade in the focus layout
      // NOTE: activeIndex and phase are now derived from scroll progress in onUpdate

      // Fade out all film frames (overview thumbnails)
      filmFrames.forEach((frame, i) => {
        tl.to(frame, {
          autoAlpha: 0,
          scale: 0.95,
          duration: CINEMATIC,
          ease: 'ease-release',
        }, pos(PHASES.LAYOUT_SHIFT))
      })

      // Fade in the focus layout (contains video + ContentSlab in grid)
      if (focusLayout) {
        tl.to(focusLayout, {
          autoAlpha: 1,
          pointerEvents: 'auto',
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_SHIFT) + CINEMATIC * 0.3)
      }

      // PHASE 5: Content slab enters
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.CONTENT_ENTER))
      }

      // PHASE 6: Content slab exits
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 0,
          x: mobile ? 0 : 40,
          y: mobile ? 30 : 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.CONTENT_EXIT))
      }

      // PHASE 7: Layout reset - transition from focus layout back to overview grid
      // Fade out focus layout and fade in all film frames

      // Fade out the focus layout
      if (focusLayout) {
        tl.to(focusLayout, {
          autoAlpha: 0,
          pointerEvents: 'none',
          duration: CINEMATIC,
          ease: 'ease-release',
        }, pos(PHASES.LAYOUT_RESET))
      }

      // Fade in all film frames (overview thumbnails)
      filmFrames.forEach((frame, i) => {
        tl.to(frame, {
          autoAlpha: 1,
          scale: 1,
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.OTHERS_RETURN))
      })

      // PHASE 10: Accent shift to next film OR completion for last film
      if (filmIndex < films.length - 1) {
        // Not last film: shift accent to next
        const nextFrame = filmFrames[filmIndex + 1] as HTMLElement
        const nextBorder = nextFrame?.querySelector('[data-bordered-viewport]') as HTMLElement

        if (currentBorder) {
          tl.to(currentBorder, {
            borderColor: '#707977',
            duration: MICRO,
            ease: 'ease-release',
          }, pos(PHASES.ACCENT_SHIFT))
        }

        if (nextBorder) {
          tl.to(nextBorder, {
            borderColor: '#f6c605',
            duration: MICRO,
            ease: 'ease-lock-on',
          }, pos(PHASES.ACCENT_SHIFT))
        }
      } else {
        // Last film: completion animation - prepare for portal exit

        // Fade current border to phantom
        if (currentBorder) {
          tl.to(currentBorder, {
            borderColor: '#707977',
            duration: STANDARD,
            ease: 'ease-release',
          }, pos(PHASES.ACCENT_SHIFT))
        }

        // Slight scale down on all films to hint section ending
        filmFrames.forEach(frame => {
          tl.to(frame, {
            scale: 0.98,
            duration: CINEMATIC,
            ease: 'ease-release',
          }, pos(PHASES.ACCENT_SHIFT))
        })
      }
    })

    // DEBUG: Log film cycle timeline positions summary
    console.log(`[FilmOverview] ═══════════════════════════════════════════════════════════════════`)
    console.log(`[FilmOverview] TIMELINE SUMMARY (totalDuration=${tl.duration().toFixed(4)}s)`)
    console.log(`[FilmOverview] ───────────────────────────────────────────────────────────────────`)
    films.forEach((film, i) => {
      const cycleStart = ACTIVE_START + (i * FILM_RANGE)
      const cycleEnd = cycleStart + FILM_RANGE
      const pos = (p: number) => cycleStart + (p * FILM_RANGE)
      console.log(`[FilmOverview] Film ${i} (${film.id.padEnd(12)}): cycle=${(cycleStart * 100).toFixed(1).padStart(5)}%-${(cycleEnd * 100).toFixed(1).padStart(5)}% | focus_at=${(pos(PHASES.LAYOUT_SHIFT) * 100).toFixed(1)}% | overview_at=${(pos(PHASES.LABEL_RESET) * 100).toFixed(1)}%`)
    })
    console.log(`[FilmOverview] ═══════════════════════════════════════════════════════════════════`)

    return tl
  }

  // Initialize and connect to ScrollTrigger
  onMount(() => {
    if (!containerEl) return

    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) {
      console.warn('[FilmOverview] No portal container found')
      return
    }

    const viewport = portalContainer.querySelector('[style*="position: fixed"]')
    if (!viewport) {
      console.warn('[FilmOverview] No viewport found')
      return
    }

    const allScenes = viewport.querySelectorAll('[data-scene]')
    let sectionIndex = -1
    allScenes.forEach((scene, i) => {
      if (scene === containerEl) sectionIndex = i
    })

    if (sectionIndex < 0) {
      console.warn('[FilmOverview] Section not found in scenes')
      return
    }

    // Use portal context for variable scene durations if available
    let sectionStart: number
    let sectionEnd: number

    if (portalConfig && portalConfig.durations.length > 0) {
      // Use context-provided durations
      const startTimes = portalConfig.startTimes
      const durations = portalConfig.durations
      sectionStart = startTimes[sectionIndex] * portalConfig.scrollSpeed
      sectionEnd = (startTimes[sectionIndex] + durations[sectionIndex]) * portalConfig.scrollSpeed
    } else {
      // Fallback to equal distribution
      const totalHeight = portalContainer.scrollHeight - window.innerHeight
      const sceneCount = allScenes.length
      const sceneHeight = totalHeight / sceneCount
      sectionStart = sectionIndex * sceneHeight
      sectionEnd = (sectionIndex + 1) * sceneHeight
    }

    console.log(`[FilmOverview] INIT: scrollRange=${sectionStart.toFixed(0)}px-${sectionEnd.toFixed(0)}px (${(sectionEnd - sectionStart).toFixed(0)}px)`)

    const isMobileNow = typeof window !== 'undefined'
      && window.matchMedia('(max-width: 767px)').matches

    ctx = gsap.context(() => {
      const tl = buildFilmTimeline(containerEl!, isMobileNow)


      const scrollRange = sectionEnd - sectionStart
      const st = ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `+=${scrollRange}`,
        scrub: 1,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          const progress = self.progress

          // Derive activeIndex from scroll position (direction-agnostic)
          if (progress >= ACTIVE_START && progress < ACTIVE_END) {
            const newIndex = Math.min(
              films.length - 1,
              Math.floor((progress - ACTIVE_START) / FILM_RANGE)
            )
            if (newIndex !== activeIndex) {
              const prevIndex = activeIndex
              activeIndex = newIndex
              console.log(`[FilmOverview] ACTIVE_INDEX_DERIVED: ${prevIndex} → ${newIndex} at progress=${(progress * 100).toFixed(1)}%`)
            }
          }

          // Derive phase from position within film's cycle
          const cycleOffset = (progress - ACTIVE_START) % FILM_RANGE
          const cycleProgress = cycleOffset / FILM_RANGE
          const newPhase = (cycleProgress >= PHASE_LAYOUT_SHIFT && cycleProgress < PHASE_LAYOUT_RESET)
            ? 'focus'
            : 'overview'
          if (newPhase !== phase) {
            const prevPhase = phase
            phase = newPhase
            console.log(`[FilmOverview] PHASE_DERIVED: ${prevPhase} → ${newPhase} at progress=${(progress * 100).toFixed(1)}% cycleProgress=${(cycleProgress * 100).toFixed(1)}%`)
          }

          // Log every 5% progress
          const progressPct = Math.round(progress * 100)
          const direction = self.direction === 1 ? 'FWD' : 'BWD'
          if (progressPct % 5 === 0) {
            console.log(`[FilmOverview] SCROLL: ${direction} progress=${progressPct}% activeIndex=${activeIndex} phase=${phase}`)
          }
        },
        onEnter: () => console.log(`[FilmOverview] ENTER scroll=${window.scrollY}px`),
        onLeave: () => console.log(`[FilmOverview] LEAVE scroll=${window.scrollY}px`),
        onEnterBack: () => console.log(`[FilmOverview] ENTER_BACK scroll=${window.scrollY}px`),
        onLeaveBack: () => console.log(`[FilmOverview] LEAVE_BACK scroll=${window.scrollY}px`),
      })
    }, containerEl)
  })

  // Styles
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  // Overview grid styles - transforms during focus
  const overviewGridStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    padding: '12vh 8vw',
    alignItems: 'center',
    alignContent: 'center',

    // Tablet (768-1023px) - 2x2 grid for better visibility
    '@media (max-width: 1023px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.25rem',
      padding: '12vh 6vw',
    },

    // Mobile (<768px) - single column stack
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
      padding: '14vh 4vw 16vh',
      alignContent: 'start',
    },
  })

  const filmFrameStyles = css({
    position: 'relative',
    width: '100%',
    transformOrigin: 'left center',
  })

  // Layered media container - holds both thumbnail and video player
  const mediaLayerContainerStyles = css({
    position: 'relative',
    width: '100%',
  })

  // Thumbnail layer - visible in overview, fades out in focus
  // Positioned absolute to fill the BorderedViewport
  const thumbnailLayerStyles = css({
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    '& img, & video': {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })

  // Video player layer - hidden initially, fades in during focus
  // Positioned absolute above thumbnail for proper crossfade
  const videoPlayerLayerStyles = css({
    position: 'absolute',
    inset: '0',
    zIndex: '2',
    opacity: '0',
    visibility: 'hidden',
    '& iframe, & video, & a': {
      display: 'block',
      width: '100%',
      height: '100%',
      border: 'none',
    },
    '& a img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })

  // Play overlay for external links (images with external video)
  const playOverlayStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
  })

  const externalLinkStyles = css({
    display: 'block',
    position: 'relative',
    width: '100%',
    height: '100%',
  })

  const overlayStyles = css({
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '1.25rem 1rem 0.875rem',
    // Enhanced gradient: stronger vignette for reliable text legibility
    background: `linear-gradient(
      to top,
      rgba(15, 23, 26, 0.98) 0%,
      rgba(15, 23, 26, 0.85) 40%,
      rgba(15, 23, 26, 0.4) 70%,
      rgba(15, 23, 26, 0) 100%
    )`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    zIndex: '10', // Above thumbnail and video layers
  })

  const filmTitleStyles = css({
    fontFamily: 'IBM Plex Sans Condensed, sans-serif',
    fontWeight: '700',
    fontSize: '1rem',
    letterSpacing: '0.05em',
    // Egg Toast yellow - the "danger" accent that slices through imagery
    color: '#f6c605',
    textTransform: 'uppercase',

    '@media (max-width: 767px)': {
      fontSize: '0.875rem',
    },
  })

  const filmClientStyles = css({
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontWeight: '500',
    fontSize: '0.6875rem',
    letterSpacing: '0.12em',
    // Tradewind - lighter support tone for visibility while staying subordinate
    color: '#b7c6cc',
    textTransform: 'uppercase',
  })

  // Focus layout grid - 60/40 split on desktop, stacked on tablet/mobile
  const focusLayoutStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'grid',
    gridTemplateColumns: '3fr 2fr', // 60% / 40% split
    gap: '2rem',
    padding: '12vh 8vw',
    alignItems: 'center',
    opacity: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    zIndex: '20',
    overflow: 'visible', // Ensure content doesn't get clipped

    // Large tablet (1024-1279px) - slightly adjusted proportions
    '@media (max-width: 1279px)': {
      gridTemplateColumns: '1.2fr 1fr', // 55% / 45% on large tablet
      gap: '1.5rem',
      padding: '12vh 6vw',
    },

    // Small tablet (768-1023px) - stack vertically for better readability
    '@media (max-width: 1023px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto',
      gap: '1.5rem',
      padding: '12vh 6vw 16vh',
      alignContent: 'center',
    },

    // Mobile (<768px) - stacked with adjusted padding
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto',
      gap: '1.5rem',
      padding: '14vh 4vw 20vh',
      alignContent: 'center',
    },
  })

  // Focus video container - holds the video in focus state
  const focusVideoContainerStyles = css({
    position: 'relative',
    width: '100%',
  })

  // Content slab container - inside focus layout grid
  const contentSlabContainerStyles = css({
    position: 'relative',
    width: '100%',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film-overview">
  <!-- Overview Grid (transforms during focus) -->
  <div class={overviewGridStyles} data-overview-grid data-slide-group="nearest-edge" data-slide-group-mobile="alternating-h">
    {#each films as film, i}
      <div
        class={filmFrameStyles}
        data-film={film.id}
        data-index={i}
        data-animate="slide"
      >
        <BorderedViewport aspectRatio={isMobile ? '16/9' : '2.39/1'}>
          <!-- Thumbnail Layer - visible in overview, crossfades out in focus -->
          <div class={thumbnailLayerStyles} data-thumbnail>
            {#if film.media.type === 'youtube'}
              <img
                src={`https://img.youtube.com/vi/${film.media.src.split('/').pop()}/maxresdefault.jpg`}
                alt={film.title}
              />
            {:else if film.media.type === 'video'}
              <video
                autoplay
                loop
                muted
                playsinline
                preload="auto"
              >
                {#if film.media.srcWebm}
                  <source src={film.media.srcWebm} type="video/webm; codecs=av01.0.08M.08" />
                {/if}
                {#if film.media.srcHevc}
                  <source src={film.media.srcHevc} type="video/mp4; codecs=hvc1" />
                {/if}
                <source src={film.media.src} type="video/mp4" />
              </video>
            {:else if film.media.type === 'image'}
              <img src={film.media.src} alt={film.title} />
            {/if}
          </div>

          <!-- Video Player Layer - hidden initially, crossfades in during focus -->
          <div class={videoPlayerLayerStyles} data-video-player>
            {#if film.media.type === 'youtube'}
              <iframe
                src={film.media.src}
                title={film.title}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            {:else if film.media.type === 'video'}
              <video
                autoplay
                loop
                muted
                playsinline
                preload="auto"
              >
                {#if film.media.srcWebm}
                  <source src={film.media.srcWebm} type="video/webm; codecs=av01.0.08M.08" />
                {/if}
                {#if film.media.srcHevc}
                  <source src={film.media.srcHevc} type="video/mp4; codecs=hvc1" />
                {/if}
                <source src={film.media.src} type="video/mp4" />
              </video>
            {:else if film.media.type === 'image'}
              {#if film.media.externalLink}
                <a href={film.media.externalLink} target="_blank" rel="noopener noreferrer" class={externalLinkStyles}>
                  <img src={film.media.src} alt={film.title} />
                  <div class={playOverlayStyles}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </a>
              {:else}
                <img src={film.media.src} alt={film.title} />
              {/if}
            {/if}
          </div>
        </BorderedViewport>
        <!-- Overlay: Title + Client (hidden during focus, ContentSlab shows info) -->
        <div class={overlayStyles} data-film-overlay>
          <span class={filmTitleStyles}>{film.title}</span>
          <span class={filmClientStyles}>{film.client}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Focus Layout Grid (appears during focus state) -->
  <div class={focusLayoutStyles} data-focus-layout>
    <!-- Video Container - keyed by activeIndex to force video element recreation -->
    {#key activeIndex}
    <div class={focusVideoContainerStyles} data-focus-video>
      <BorderedViewport aspectRatio={isMobile ? '16/9' : '2.39/1'}>
        <!-- Render current film's video content -->
        {#if currentFilm.media.type === 'youtube'}
          <iframe
            src={currentFilm.media.src}
            title={currentFilm.title}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else if currentFilm.media.type === 'video'}
          <video
            autoplay
            loop
            muted
            playsinline
            preload="auto"
          >
            {#if currentFilm.media.srcWebm}
              <source src={currentFilm.media.srcWebm} type="video/webm; codecs=av01.0.08M.08" />
            {/if}
            {#if currentFilm.media.srcHevc}
              <source src={currentFilm.media.srcHevc} type="video/mp4; codecs=hvc1" />
            {/if}
            <source src={currentFilm.media.src} type="video/mp4" />
          </video>
        {:else if currentFilm.media.type === 'image'}
          {#if currentFilm.media.externalLink}
            <a href={currentFilm.media.externalLink} target="_blank" rel="noopener noreferrer" class={externalLinkStyles}>
              <img src={currentFilm.media.src} alt={currentFilm.title} />
              <div class={playOverlayStyles}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </a>
          {:else}
            <img src={currentFilm.media.src} alt={currentFilm.title} />
          {/if}
        {/if}
      </BorderedViewport>
    </div>

    <!-- Content Slab Container -->
    <div class={contentSlabContainerStyles} data-content-slab-container>
      <div data-content-slab>
        <ContentSlab
          eyebrow={currentFilm.client}
          title={currentFilm.title}
          description={currentFilm.description}
          year={currentFilm.year}
        />
      </div>
    </div>
    {/key}
  </div>

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <SectionLabel text={labelText} bind:textRef={labelTextEl} />
    {/snippet}

    {#snippet bottomCenter()}
      <StepIndicator
        {steps}
        {activeIndex}
        showLabels={true}
      />
    {/snippet}
  </UIChrome>
</div>
