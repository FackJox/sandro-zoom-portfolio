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
  import ScrollHint from '../components/ui/ScrollHint.svelte'

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
        src: '/videos/grace.mp4'
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
        src: '/videos/shwab.mp4'
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
  const labelText = $derived(
    phase === 'overview' ? 'FILM' : 'FILM — HIGH ALTITUDE FEATURES'
  )
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // DIAGNOSTIC: Log phase and activeIndex changes
  $effect(() => {
    console.log(`[FilmOverview] State: phase=${phase} activeIndex=${activeIndex} currentFilm=${currentFilm?.id}`)
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
    const contentSlabContainer = container.querySelector('[data-content-slab-container]') as HTMLElement
    const contentSlab = container.querySelector('[data-content-slab]') as HTMLElement
    const overviewGrid = container.querySelector('[data-overview-grid]') as HTMLElement
    const labelTextElement = container.querySelector('[data-section-label-text]') as HTMLElement

    // DIAGNOSTIC: Log all queried elements (flat)
    console.log(`[FilmOverview] buildFilmTimeline - filmFrames=${filmFrames.length} ids=[${Array.from(filmFrames).map(f => f.dataset.film).join(',')}] contentSlabContainer=${!!contentSlabContainer} contentSlab=${!!contentSlab} overviewGrid=${!!overviewGrid} labelTextElement=${!!labelTextElement} mobile=${mobile}`)

    // DIAGNOSTIC: Log each film frame's computed position (flat)
    filmFrames.forEach((frame, i) => {
      const rect = frame.getBoundingClientRect()
      const computed = window.getComputedStyle(frame)
      console.log(`[FilmOverview] Frame ${i} (${frame.dataset.film}): top=${rect.top.toFixed(0)} left=${rect.left.toFixed(0)} w=${rect.width.toFixed(0)} h=${rect.height.toFixed(0)} visibility=${computed.visibility} opacity=${computed.opacity} display=${computed.display}`)
    })

    // DIAGNOSTIC: Log grid computed styles (flat)
    if (overviewGrid) {
      const gridComputed = window.getComputedStyle(overviewGrid)
      const gridRect = overviewGrid.getBoundingClientRect()
      console.log(`[FilmOverview] Grid: top=${gridRect.top.toFixed(0)} left=${gridRect.left.toFixed(0)} w=${gridRect.width.toFixed(0)} h=${gridRect.height.toFixed(0)} cols=${gridComputed.gridTemplateColumns} gap=${gridComputed.gap} display=${gridComputed.display}`)
    }

    // DIAGNOSTIC: Log media elements and layers inside each film frame (flat)
    filmFrames.forEach((frame, i) => {
      const borderedViewport = frame.querySelector('[data-bordered-viewport]') as HTMLElement
      const thumbnail = frame.querySelector('[data-thumbnail]') as HTMLElement
      const videoPlayer = frame.querySelector('[data-video-player]') as HTMLElement
      const overlay = frame.querySelector('[data-film-overlay]') as HTMLElement
      const iframe = videoPlayer?.querySelector('iframe')
      const vpRect = borderedViewport?.getBoundingClientRect()
      console.log(`[FilmOverview] Layers ${i} (${frame.dataset.film}): viewport=${!!borderedViewport} vpSize=${vpRect ? `${vpRect.width.toFixed(0)}x${vpRect.height.toFixed(0)}` : 'null'} thumbnail=${!!thumbnail} videoPlayer=${!!videoPlayer} overlay=${!!overlay} iframe=${!!iframe}`)
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
    console.log('[FilmOverview] Initializing element states (autoAlpha: 0, scale: 0.95)')
    filmFrames.forEach((frame, i) => {
      gsap.set(frame, { autoAlpha: 0, scale: 0.95 })
      console.log(`[FilmOverview] Set film frame ${i} to autoAlpha: 0, scale: 0.95`)
    })

    if (contentSlabContainer) {
      gsap.set(contentSlabContainer, { autoAlpha: 0, pointerEvents: 'none' })
      console.log('[FilmOverview] Set contentSlabContainer to autoAlpha: 0')
    }
    if (contentSlab) {
      gsap.set(contentSlab, {
        autoAlpha: 0,
        x: mobile ? 0 : 40,
        y: mobile ? 30 : 0
      })
      console.log('[FilmOverview] Set contentSlab to autoAlpha: 0')
    }

    // DIAGNOSTIC: Check container visibility state
    const containerComputed = window.getComputedStyle(container)
    console.log(`[FilmOverview] Container at init: visibility=${containerComputed.visibility} opacity=${containerComputed.opacity} display=${containerComputed.display} zIndex=${containerComputed.zIndex}`)

    // INITIAL FADE IN - Should complete right as portal transition finishes
    // Portal transition occupies first 5% of scroll, fadeIn should sync with it
    // Start fadeIn partway through portal so films are visible when portal completes
    const FADE_IN_START = PORTAL_BUFFER - CINEMATIC // Start early so it completes at 5%

    console.log(`[FilmOverview] Timeline config: PORTAL_BUFFER=${PORTAL_BUFFER} ACTIVE_START=${ACTIVE_START} ACTIVE_END=${ACTIVE_END} ACTIVE_RANGE=${ACTIVE_RANGE.toFixed(3)} FILM_RANGE=${FILM_RANGE.toFixed(3)} SCENE_DURATION=${SCENE_DURATION}s FADE_IN_START=${FADE_IN_START.toFixed(4)}`)

    tl.call(() => {
      console.log(`[FilmOverview] Timeline START - fadeIn beginning at ${FADE_IN_START.toFixed(4)}`)
    }, [], Math.max(0.01, FADE_IN_START)) // Ensure not negative

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

      console.log(`[FilmOverview] Film ${filmIndex} (${film.id}): cycle=${(cycleStart * 100).toFixed(1)}%-${(cycleEnd * 100).toFixed(1)}%`)

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

      // Get thumbnail, video player layers, and overlay for crossfade
      const currentThumbnail = currentFrame?.querySelector('[data-thumbnail]') as HTMLElement
      const currentVideoPlayer = currentFrame?.querySelector('[data-video-player]') as HTMLElement
      const currentOverlay = currentFrame?.querySelector('[data-film-overlay]') as HTMLElement

      console.log(`[FilmOverview] Film ${filmIndex} layers: thumbnail=${!!currentThumbnail} videoPlayer=${!!currentVideoPlayer} overlay=${!!currentOverlay}`)

      // Convert phase to absolute timeline position
      const pos = (p: number) => cycleStart + (p * FILM_RANGE)

      // Log when this film cycle starts
      tl.call(() => {
        console.log(`[FilmOverview] Film ${filmIndex} (${film.id}) CYCLE_START pos=${cycleStart.toFixed(3)}`)
      }, [], cycleStart)

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

      // PHASE 3: Label scramble text transition
      if (labelTextElement) {
        tl.to(labelTextElement, {
          text: {
            value: 'FILM — HIGH ALTITUDE FEATURES',
            delimiter: '',
            speed: 1,
          },
          duration: STANDARD * 2,
          ease: 'none',
          onStart: () => { phase = 'transition' }
        }, pos(PHASES.LABEL_SCRAMBLE))
      }

      // PHASE 4: Layout shift using Flip-style animation
      // Capture current state and animate to focus position
      if (overviewGrid) {
        // Animate grid to single-column focus layout
        tl.to(overviewGrid, {
          gridTemplateColumns: mobile ? '1fr' : '1fr',
          gap: mobile ? '1.5rem' : '2rem',
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_SHIFT))
      }

      // Animate focused frame to full width
      if (currentFrame) {
        tl.to(currentFrame, {
          gridColumn: '1 / -1',
          maxWidth: mobile ? '100%' : '60%',
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_SHIFT))
      }

      // Show content slab container
      if (contentSlabContainer) {
        tl.to(contentSlabContainer, {
          autoAlpha: 1,
          pointerEvents: 'auto',
          duration: CINEMATIC * 0.5,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_SHIFT) + CINEMATIC * 0.5)
      }

      // Update state
      tl.call(() => {
        phase = 'focus'
        activeIndex = filmIndex
      }, [], pos(PHASES.LAYOUT_SHIFT) + CINEMATIC)

      // PHASE 4b: Crossfade from thumbnail to video player
      // This creates a seamless transition as the layout expands
      if (currentThumbnail && currentVideoPlayer) {
        // First make video player visible (but still transparent)
        tl.set(currentVideoPlayer, {
          visibility: 'visible',
        }, pos(PHASES.CROSSFADE_IN))

        // Crossfade: thumbnail out, video player in
        tl.to(currentThumbnail, {
          autoAlpha: 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.CROSSFADE_IN))

        tl.to(currentVideoPlayer, {
          autoAlpha: 1,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.CROSSFADE_IN))

        console.log(`[FilmOverview] Film ${filmIndex} crossfade IN at pos=${pos(PHASES.CROSSFADE_IN).toFixed(3)}`)
      }

      // Hide overlay during focus (ContentSlab shows the info instead)
      if (currentOverlay) {
        tl.to(currentOverlay, {
          autoAlpha: 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.CROSSFADE_IN))
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

      // PHASE 6b: Crossfade from video player back to thumbnail
      // Reverse the crossfade before layout resets to overview
      if (currentThumbnail && currentVideoPlayer) {
        // Crossfade: video player out, thumbnail in
        tl.to(currentVideoPlayer, {
          autoAlpha: 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.CROSSFADE_OUT))

        tl.to(currentThumbnail, {
          autoAlpha: 1,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.CROSSFADE_OUT))

        // Hide video player after crossfade
        tl.set(currentVideoPlayer, {
          visibility: 'hidden',
        }, pos(PHASES.CROSSFADE_OUT) + STANDARD)

        console.log(`[FilmOverview] Film ${filmIndex} crossfade OUT at pos=${pos(PHASES.CROSSFADE_OUT).toFixed(3)}`)
      }

      // Show overlay again during reverse crossfade
      if (currentOverlay) {
        tl.to(currentOverlay, {
          autoAlpha: 1,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.CROSSFADE_OUT))
      }

      // PHASE 7: Layout reset
      if (contentSlabContainer) {
        tl.to(contentSlabContainer, {
          autoAlpha: 0,
          pointerEvents: 'none',
          duration: CINEMATIC * 0.5,
          ease: 'ease-release',
        }, pos(PHASES.LAYOUT_RESET))
      }

      // Reset grid to 4-column layout
      if (overviewGrid) {
        tl.to(overviewGrid, {
          gridTemplateColumns: mobile ? '1fr' : 'repeat(4, 1fr)',
          gap: mobile ? '1rem' : '1.5rem',
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_RESET))
      }

      // Reset focused frame
      if (currentFrame) {
        tl.to(currentFrame, {
          gridColumn: 'auto',
          maxWidth: '100%',
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_RESET))
      }

      // PHASE 8: Others return
      otherFrames.forEach(frame => {
        if (mobile) {
          tl.to(frame, {
            scale: 1,
            y: 0,
            autoAlpha: 1,
            duration: CINEMATIC,
            ease: 'ease-lock-on',
          }, pos(PHASES.OTHERS_RETURN))
        } else {
          tl.to(frame, {
            scale: 1,
            autoAlpha: 1,
            duration: CINEMATIC,
            ease: 'ease-lock-on',
          }, pos(PHASES.OTHERS_RETURN))
        }
      })

      // PHASE 9: Label reset back to "FILM"
      if (labelTextElement) {
        tl.to(labelTextElement, {
          text: {
            value: 'FILM',
            delimiter: '',
            speed: 1,
          },
          duration: STANDARD,
          ease: 'none',
        }, pos(PHASES.LABEL_RESET))
      }

      tl.call(() => {
        phase = 'overview'
      }, [], pos(PHASES.LABEL_RESET) + STANDARD)

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
        // Fade all borders to phantom and scale down slightly
        console.log(`[FilmOverview] Film ${filmIndex} LAST - completion at pos=${pos(PHASES.ACCENT_SHIFT).toFixed(3)}`)

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

    return tl
  }

  // Initialize and connect to ScrollTrigger
  onMount(() => {
    if (!containerEl) return

    console.log('[FilmOverview] onMount - containerEl:', containerEl)

    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) {
      console.warn('[FilmOverview] No portal container found')
      return
    }

    // DIAGNOSTIC: Log portal container dimensions
    const portalRect = portalContainer.getBoundingClientRect()
    console.log(`[FilmOverview] Portal container: scrollHeight=${portalContainer.scrollHeight} clientHeight=${portalContainer.clientHeight} offsetHeight=${portalContainer.offsetHeight} w=${portalRect.width.toFixed(0)} h=${portalRect.height.toFixed(0)} minHeight=${window.getComputedStyle(portalContainer).minHeight}`)

    const viewport = portalContainer.querySelector('[style*="position: fixed"]')
    if (!viewport) {
      console.warn('[FilmOverview] No viewport found')
      return
    }

    // DIAGNOSTIC: Log viewport
    const viewportRect = (viewport as HTMLElement).getBoundingClientRect()
    console.log(`[FilmOverview] Viewport: w=${viewportRect.width.toFixed(0)} h=${viewportRect.height.toFixed(0)}`)

    const allScenes = viewport.querySelectorAll('[data-scene]')
    let sectionIndex = -1
    allScenes.forEach((scene, i) => {
      if (scene === containerEl) sectionIndex = i
    })

    // DIAGNOSTIC: Log all scenes
    const sceneNames = Array.from(allScenes).map((s, i) => `${i}:${(s as HTMLElement).dataset.scene}${s === containerEl ? '*' : ''}`).join(' ')
    console.log(`[FilmOverview] All scenes: count=${allScenes.length} thisIndex=${sectionIndex} [${sceneNames}]`)

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

      console.log(`[FilmOverview] ScrollTrigger (context): sectionIndex=${sectionIndex} duration=${durations[sectionIndex]}s startTime=${startTimes[sectionIndex]}s sectionStart=${sectionStart}px sectionEnd=${sectionEnd}px scrollRange=${sectionEnd - sectionStart}px`)
    } else {
      // Fallback to equal distribution
      const totalHeight = portalContainer.scrollHeight - window.innerHeight
      const sceneCount = allScenes.length
      const sceneHeight = totalHeight / sceneCount
      sectionStart = sectionIndex * sceneHeight
      sectionEnd = (sectionIndex + 1) * sceneHeight

      console.log(`[FilmOverview] ScrollTrigger (fallback): sectionIndex=${sectionIndex} sceneCount=${sceneCount} totalHeight=${totalHeight}px sceneHeight=${sceneHeight}px sectionStart=${sectionStart}px sectionEnd=${sectionEnd}px`)
    }

    const isMobileNow = typeof window !== 'undefined'
      && window.matchMedia('(max-width: 767px)').matches

    ctx = gsap.context(() => {
      const tl = buildFilmTimeline(containerEl!, isMobileNow)

      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `top+=${sectionEnd} top`,
        scrub: 1,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          // Log every 10% progress
          const progress = Math.round(self.progress * 100)
          if (progress % 10 === 0) {
            console.log(`[FilmOverview] progress=${progress}% scroll=${Math.round(self.scroll())}px`)
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

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })

  const indicatorContainerStyles = css({
    position: 'absolute',
    bottom: '8vh',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10',

    '@media (max-width: 767px)': {
      bottom: '10vh',
    },
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

    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
      padding: '14vh 4vw 16vh',
      overflowY: 'auto',
      alignContent: 'start',
    },
  })

  const filmFrameStyles = css({
    position: 'relative',
    width: '100%',
    transformOrigin: 'center center',
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
    zIndex: '2',
    '& img, & video': {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })

  // Video player layer - hidden initially, fades in during focus
  // Positioned absolute behind thumbnail, becomes visible during crossfade
  const videoPlayerLayerStyles = css({
    position: 'absolute',
    inset: '0',
    zIndex: '1',
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
    padding: '1.5rem 1rem 1rem',
    background: 'linear-gradient(to top, rgba(15, 23, 26, 0.95) 0%, rgba(15, 23, 26, 0) 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  })

  const filmTitleStyles = css({
    fontFamily: 'IBM Plex Sans Condensed, sans-serif',
    fontWeight: '700',
    fontSize: '1rem',
    letterSpacing: '0.05em',
    color: 'brand.text',
    textTransform: 'uppercase',

    '@media (max-width: 767px)': {
      fontSize: '0.875rem',
    },
  })

  const filmClientStyles = css({
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontWeight: '400',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    color: 'brand.textMuted',
    textTransform: 'uppercase',
  })

  // Content slab container - overlays during focus state
  const contentSlabContainerStyles = css({
    position: 'absolute',
    top: '50%',
    right: '8vw',
    transform: 'translateY(-50%)',
    width: '35%',
    maxWidth: '400px',
    zIndex: '5',

    '@media (max-width: 1023px)': {
      width: '40%',
      right: '6vw',
    },

    '@media (max-width: 767px)': {
      position: 'absolute',
      top: 'auto',
      bottom: '16vh',
      left: '4vw',
      right: '4vw',
      transform: 'none',
      width: 'auto',
      maxWidth: 'none',
    },
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film-overview">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text={labelText} bind:textRef={labelTextEl} />
  </div>

  <!-- Overview Grid (transforms during focus) -->
  <div class={overviewGridStyles} data-overview-grid>
    {#each films as film, i}
      <div
        class={filmFrameStyles}
        data-film={film.id}
        data-index={i}
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
                src={film.media.src}
                autoplay
                loop
                muted
                playsinline
              ></video>
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
                src={film.media.src}
                autoplay
                loop
                muted
                playsinline
              ></video>
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

  <!-- Content Slab Container (slides in during focus) -->
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

  <!-- Step Indicator -->
  <div class={indicatorContainerStyles}>
    <StepIndicator
      {steps}
      {activeIndex}
      showLabels={true}
    />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
