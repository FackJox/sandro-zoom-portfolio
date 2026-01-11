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
    const focusLayout = container.querySelector('[data-focus-layout]') as HTMLElement
    const contentSlabContainer = container.querySelector('[data-content-slab-container]') as HTMLElement
    const contentSlab = container.querySelector('[data-content-slab]') as HTMLElement
    const overviewGrid = container.querySelector('[data-overview-grid]') as HTMLElement
    const labelTextElement = container.querySelector('[data-section-label-text]') as HTMLElement

    // DIAGNOSTIC: Log all queried elements (flat)
    console.log(`[FilmOverview] buildFilmTimeline - filmFrames=${filmFrames.length} ids=[${Array.from(filmFrames).map(f => f.dataset.film).join(',')}] focusLayout=${!!focusLayout} contentSlabContainer=${!!contentSlabContainer} contentSlab=${!!contentSlab} overviewGrid=${!!overviewGrid} labelTextElement=${!!labelTextElement} mobile=${mobile}`)

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
    console.log('[FilmOverview] Initializing element states (autoAlpha: 0, scale: 0.95, width: 100%)')
    filmFrames.forEach((frame, i) => {
      gsap.set(frame, { autoAlpha: 0, scale: 0.95, width: '100%' })
      console.log(`[FilmOverview] Set film frame ${i} to autoAlpha: 0, scale: 0.95, width: 100%`)
    })

    // Initialize focus layout (hidden initially, shown during focus state)
    if (focusLayout) {
      gsap.set(focusLayout, { autoAlpha: 0, pointerEvents: 'none' })
      console.log('[FilmOverview] Set focusLayout to autoAlpha: 0')
    }

    // Initialize content slab within focus layout (offset for enter animation)
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

      // Note: In the grid-based layout, we transition between overview grid and focus layout
      // rather than crossfading thumbnail/video within each frame

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
      // Note: Remove 'speed' param so GSAP uses our explicit duration, not calculated from text length
      if (labelTextElement) {
        tl.to(labelTextElement, {
          text: {
            value: 'FILM — HIGH ALTITUDE FEATURES',
            delimiter: '',
          },
          duration: CINEMATIC,
          ease: 'none',
          onStart: () => { phase = 'transition' }
        }, pos(PHASES.LABEL_SCRAMBLE))
      }

      // PHASE 4: Layout shift - transition from overview grid to focus layout
      // The focus layout is a separate CSS Grid with proper 60/40 split
      // Fade out all thumbnails and fade in the focus layout

      // Update state first so currentFilm updates in the focus layout
      tl.call(() => {
        activeIndex = filmIndex
        console.log(`[FilmOverview] Film ${filmIndex} activeIndex set, currentFilm updated`)
      }, [], pos(PHASES.LAYOUT_SHIFT))

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

        console.log(`[FilmOverview] Film ${filmIndex} focus layout IN at pos=${pos(PHASES.LAYOUT_SHIFT).toFixed(3)}`)
      }

      // Update phase state
      tl.call(() => {
        phase = 'focus'
      }, [], pos(PHASES.LAYOUT_SHIFT) + CINEMATIC)

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

        console.log(`[FilmOverview] Film ${filmIndex} focus layout OUT at pos=${pos(PHASES.LAYOUT_RESET).toFixed(3)}`)
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

      // PHASE 9: Label reset back to "FILM"
      // Note: Remove 'speed' param so GSAP uses our explicit duration
      if (labelTextElement) {
        tl.to(labelTextElement, {
          text: {
            value: 'FILM',
            delimiter: '',
          },
          duration: MICRO,
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

    // DEBUG: Log final timeline structure
    const children = tl.getChildren()
    console.log(`[FilmOverview] buildFilmTimeline complete: totalDuration=${tl.duration().toFixed(4)}s childAnimations=${children.length}`)
    children.slice(0, 10).forEach((child, i) => {
      const startTime = child.startTime?.() ?? 0
      const duration = child.duration?.() ?? 0
      console.log(`[FilmOverview] Animation ${i}: start=${startTime.toFixed(4)}s duration=${duration.toFixed(4)}s end=${(startTime + duration).toFixed(4)}s`)
    })
    if (children.length > 10) {
      console.log(`[FilmOverview] ... and ${children.length - 10} more animations`)
    }

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

      // DEBUG: Log timeline details
      console.log(`[FilmOverview] Timeline built: duration=${tl.duration().toFixed(4)}s labels=${Object.keys(tl.labels || {}).join(',')} children=${tl.getChildren().length}`)

      const scrollRange = sectionEnd - sectionStart
      const st = ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `+=${scrollRange}`,
        scrub: 1,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          // Log every 10% progress with timeline position
          const progress = Math.round(self.progress * 100)
          if (progress % 10 === 0) {
            console.log(`[FilmOverview] progress=${progress}% scroll=${Math.round(self.scroll())}px tlProgress=${(tl.progress() * 100).toFixed(1)}% tlTime=${tl.time().toFixed(4)}s`)
          }
        },
        onEnter: () => console.log(`[FilmOverview] ENTER scroll=${window.scrollY}px`),
        onLeave: () => console.log(`[FilmOverview] LEAVE scroll=${window.scrollY}px`),
        onEnterBack: () => console.log(`[FilmOverview] ENTER_BACK scroll=${window.scrollY}px`),
        onLeaveBack: () => console.log(`[FilmOverview] LEAVE_BACK scroll=${window.scrollY}px`),
      })

      // DEBUG: Log ScrollTrigger details
      console.log(`[FilmOverview] ScrollTrigger created: sectionStart=${sectionStart} sectionEnd=${sectionEnd} scrollRange=${scrollRange} st.start=${st.start} st.end=${st.end} trigger=${portalContainer?.tagName}`)
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
    padding: '1.5rem 1rem 1rem',
    background: 'linear-gradient(to top, rgba(15, 23, 26, 0.95) 0%, rgba(15, 23, 26, 0) 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    zIndex: '10', // Above thumbnail and video layers
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

  // Focus layout grid - 60/40 split on desktop, stacked on mobile
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

    '@media (max-width: 1023px)': {
      gridTemplateColumns: '1.1fr 1fr', // 52% / 48% on tablet
      gap: '1.5rem',
      padding: '12vh 6vw',
    },

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

  <!-- Focus Layout Grid (appears during focus state) -->
  <div class={focusLayoutStyles} data-focus-layout>
    <!-- Video Container -->
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
            src={currentFilm.media.src}
            autoplay
            loop
            muted
            playsinline
          ></video>
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
