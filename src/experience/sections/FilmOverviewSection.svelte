<!--
  FilmOverviewSection.svelte

  Scroll-driven film showcase with overview → focus → overview cycle.
  Uses GSAP timeline scrubbed to scroll with Brand Physics durations.

  Timing (16s scene with 5 scenes at 80s total):
  - Portal buffer start: 0-5% (0.8s)
  - Film cycles: 5-95% (4 films × 3.6s each = 14.4s)
  - Portal buffer end: 95-100% (0.8s)

  Brand Physics:
  - brand-micro: 175ms (border changes)
  - brand-standard: 315ms (content animations)
  - brand-cinematic: 550ms (major transitions)

  Design: docs/plans/2025-01-07-film-overview-section-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import BorderedViewport from '../components/ui/BorderedViewport.svelte'
  import ContentSlab from '../components/ui/ContentSlab.svelte'
  import StepIndicator from '../components/ui/StepIndicator.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  // Film project data
  interface FilmProject {
    id: string
    title: string
    client: string
    year?: string
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
      description: 'Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m.',
      media: {
        type: 'video',
        src: '/videos/shwab.mp4'
      }
    },
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = null
  let activeIndex = $state(0)
  let phase = $state<'overview' | 'focus'>('overview')

  // Derived state
  const currentFilm = $derived(films[activeIndex])
  const labelText = $derived(
    phase === 'overview' ? 'FILM' : 'FILM — HIGH ALTITUDE FEATURES'
  )
  const steps = films.map(f => ({ id: f.id, label: f.title }))

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
   * Timeline uses proportional positioning (0-1) to work with any scroll duration.
   *
   * Brand Physics durations (as proportions of 16s scene):
   * - brand-micro: 0.175s / 16s ≈ 0.011
   * - brand-standard: 0.315s / 16s ≈ 0.02
   * - brand-cinematic: 0.55s / 16s ≈ 0.034
   *
   * Structure:
   * - 0-5%: Portal in buffer
   * - 5-95%: 4 film cycles (22.5% each)
   * - 95-100%: Portal out buffer
   */
  function buildFilmTimeline(container: HTMLElement, mobile: boolean): gsap.core.Timeline {
    const tl = gsap.timeline()

    const filmFrames = container.querySelectorAll('[data-film]')
    const focusLayout = container.querySelector('[data-focus-layout]')
    const contentSlab = container.querySelector('[data-content-slab]')
    const overviewGrid = container.querySelector('[data-overview-grid]')

    // Timeline proportions (0-1)
    const PORTAL_BUFFER = 0.05 // 5% at start and end for portal transitions
    const ACTIVE_START = PORTAL_BUFFER
    const ACTIVE_END = 1 - PORTAL_BUFFER
    const ACTIVE_RANGE = ACTIVE_END - ACTIVE_START // 90%

    // Each film gets equal share of active range
    const FILM_RANGE = ACTIVE_RANGE / films.length // 22.5% each

    // Brand Physics durations as proportions (assuming 16s scene)
    const SCENE_DURATION = 16 // seconds
    const MICRO = DURATION.micro / SCENE_DURATION
    const STANDARD = DURATION.standard / SCENE_DURATION
    const CINEMATIC = DURATION.cinematic / SCENE_DURATION

    // Initialize all elements
    if (focusLayout) gsap.set(focusLayout, { autoAlpha: 0 })
    if (contentSlab) {
      gsap.set(contentSlab, {
        autoAlpha: 0,
        x: mobile ? 0 : 40,
        y: mobile ? 30 : 0
      })
    }

    // Build animation for each film
    films.forEach((film, filmIndex) => {
      const cycleStart = ACTIVE_START + (filmIndex * FILM_RANGE)
      const currentFrame = filmFrames[filmIndex] as HTMLElement
      const otherFrames = Array.from(filmFrames).filter((_, i) => i !== filmIndex) as HTMLElement[]

      const currentBorder = currentFrame?.querySelector('[data-bordered-viewport]') as HTMLElement
      const otherBorders = otherFrames.map(f => f.querySelector('[data-bordered-viewport]') as HTMLElement)

      // Film cycle phases (relative to film's range)
      // Each film cycle: 0-100% of its FILM_RANGE
      const PHASES = {
        HOLD_START: 0.05,        // 5% hold at start
        BORDER_FADE: 0.10,       // Border accent change
        OTHERS_EXIT: 0.15,       // Others start fading
        LAYOUT_SHIFT: 0.25,      // Switch to focus layout
        CONTENT_ENTER: 0.35,     // Content slab enters
        CONTENT_HOLD: 0.60,      // Reading time
        CONTENT_EXIT: 0.65,      // Content starts leaving
        LAYOUT_RESET: 0.75,      // Return to overview
        OTHERS_RETURN: 0.80,     // Others fade back in
        ACCENT_SHIFT: 0.90,      // Prepare for next film
      }

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

      // PHASE 2: Others exit
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

      // PHASE 3: Layout shift to focus
      if (overviewGrid) {
        tl.to(overviewGrid, {
          autoAlpha: 0,
          duration: CINEMATIC,
          ease: 'ease-release',
        }, pos(PHASES.LAYOUT_SHIFT))
      }

      if (focusLayout) {
        tl.to(focusLayout, {
          autoAlpha: 1,
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_SHIFT) + CINEMATIC * 0.5)
      }

      // Update state
      tl.call(() => {
        phase = 'focus'
        activeIndex = filmIndex
      }, [], pos(PHASES.LAYOUT_SHIFT) + CINEMATIC)

      // PHASE 4: Content slab enters
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.CONTENT_ENTER))
      }

      // PHASE 5: Content slab exits
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 0,
          x: mobile ? 0 : 40,
          y: mobile ? 30 : 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.CONTENT_EXIT))
      }

      // PHASE 6: Layout reset to overview
      if (focusLayout) {
        tl.to(focusLayout, {
          autoAlpha: 0,
          duration: CINEMATIC,
          ease: 'ease-release',
        }, pos(PHASES.LAYOUT_RESET))
      }

      if (overviewGrid) {
        tl.to(overviewGrid, {
          autoAlpha: 1,
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_RESET) + CINEMATIC * 0.5)
      }

      tl.call(() => {
        phase = 'overview'
      }, [], pos(PHASES.LAYOUT_RESET) + CINEMATIC)

      // PHASE 7: Others return
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

      // PHASE 8: Accent shift to next film
      if (filmIndex < films.length - 1) {
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
      }
    })

    return tl
  }

  // Initialize and connect to ScrollTrigger
  onMount(() => {
    if (!containerEl) return

    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) return

    const viewport = portalContainer.querySelector('[style*="position: fixed"]')
    if (!viewport) return

    const allScenes = viewport.querySelectorAll('[data-scene]')
    let sectionIndex = -1
    allScenes.forEach((scene, i) => {
      if (scene === containerEl) sectionIndex = i
    })

    if (sectionIndex < 0) return

    const totalHeight = portalContainer.scrollHeight - window.innerHeight
    const sceneCount = allScenes.length
    const sceneHeight = totalHeight / sceneCount
    const sectionStart = sectionIndex * sceneHeight
    const sectionEnd = (sectionIndex + 1) * sceneHeight

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

  // Overview grid styles
  const overviewGridStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    padding: '12vh 8vw',
    alignItems: 'center',

    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
      padding: '14vh 4vw 16vh',
      overflowY: 'auto',
    },
  })

  const filmFrameStyles = css({
    position: 'relative',
    width: '100%',
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

  // Focus layout styles (60/40 split)
  const focusLayoutStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'grid',
    gridTemplateColumns: '0.6fr 0.4fr',
    gap: '2rem',
    padding: '12vh 8vw',
    boxSizing: 'border-box',
    pointerEvents: 'none',

    '@media (max-width: 1023px)': {
      gridTemplateColumns: '0.55fr 0.45fr',
      gap: '1.5rem',
      padding: '10vh 6vw',
    },

    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
      padding: '12vh 4vw 16vh',
    },
  })

  const focusViewportContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const focusSlabContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film-overview">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text={labelText} />
  </div>

  <!-- Overview Grid (all 4 films) -->
  <div class={overviewGridStyles} data-overview-grid>
    {#each films as film, i}
      <div
        class={filmFrameStyles}
        data-film={film.id}
        data-index={i}
      >
        <BorderedViewport aspectRatio={isMobile ? '16/9' : '2.39/1'}>
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
        </BorderedViewport>
        <!-- Overlay: Title + Client -->
        <div class={overlayStyles}>
          <span class={filmTitleStyles}>{film.title}</span>
          <span class={filmClientStyles}>{film.client}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Focus Layout (shown during focus state) -->
  <div class={focusLayoutStyles} data-focus-layout>
    <div class={focusViewportContainerStyles}>
      <BorderedViewport aspectRatio="2.39/1" borderColor="#f6c605">
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
            <a href={currentFilm.media.externalLink} target="_blank" rel="noopener noreferrer">
              <img src={currentFilm.media.src} alt={currentFilm.title} />
            </a>
          {:else}
            <img src={currentFilm.media.src} alt={currentFilm.title} />
          {/if}
        {/if}
      </BorderedViewport>
    </div>
    <div class={focusSlabContainerStyles} data-content-slab>
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
