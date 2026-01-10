<!--
  FilmOverviewSection.svelte

  Scroll-driven film showcase with overview → focus → overview cycle.
  Uses reactive scroll progress pattern (like AboutSection/HeroShowreelScene).

  Design: docs/plans/2025-01-07-film-overview-section-design.md
  Pattern: Reactive state from scroll progress, CSS-driven transitions
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

  // Reactive scroll progress (0-1 within this scene)
  let scrollProgress = $state(0)

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

  // Derived states from scroll progress
  // Each film gets 25% of the scroll (4 films)
  const FILM_COUNT = films.length
  const FILM_RANGE = 1 / FILM_COUNT // 0.25

  // Which film is active (0-3)
  const activeFilmIndex = $derived(
    Math.min(Math.floor(scrollProgress * FILM_COUNT), FILM_COUNT - 1)
  )

  // Phase thresholds within each film's scroll range
  // These define when transitions happen
  const PHASE = {
    OVERVIEW_START: 0,      // 0%
    FOCUS_ENTER: 0.15,      // 15% - start transitioning to focus
    FOCUS_ACTIVE: 0.30,     // 30% - fully in focus
    FOCUS_EXIT: 0.70,       // 70% - start transitioning out
    OVERVIEW_END: 0.85,     // 85% - back to overview
  }

  // Progress within the current film's range (0-1)
  const filmProgress = $derived.by(() => {
    const filmStart = activeFilmIndex * FILM_RANGE
    const localProgress = (scrollProgress - filmStart) / FILM_RANGE
    return Math.max(0, Math.min(1, localProgress))
  })

  // Current phase based on film progress
  const phase = $derived.by((): 'overview' | 'focus' | 'transitioning' => {
    if (filmProgress < PHASE.FOCUS_ENTER || filmProgress > PHASE.OVERVIEW_END) {
      return 'overview'
    } else if (filmProgress >= PHASE.FOCUS_ACTIVE && filmProgress <= PHASE.FOCUS_EXIT) {
      return 'focus'
    }
    return 'transitioning'
  })

  // Transition progress (0 = overview, 1 = focus)
  // Smooth interpolation between phases
  const focusTransition = $derived.by(() => {
    if (filmProgress <= PHASE.OVERVIEW_START) return 0
    if (filmProgress >= PHASE.FOCUS_ACTIVE && filmProgress <= PHASE.FOCUS_EXIT) return 1
    if (filmProgress >= PHASE.OVERVIEW_END) return 0

    // Transitioning in (FOCUS_ENTER to FOCUS_ACTIVE)
    if (filmProgress < PHASE.FOCUS_ACTIVE) {
      return (filmProgress - PHASE.FOCUS_ENTER) / (PHASE.FOCUS_ACTIVE - PHASE.FOCUS_ENTER)
    }

    // Transitioning out (FOCUS_EXIT to OVERVIEW_END)
    return 1 - (filmProgress - PHASE.FOCUS_EXIT) / (PHASE.OVERVIEW_END - PHASE.FOCUS_EXIT)
  })

  // Derived CSS values
  const overviewOpacity = $derived(1 - focusTransition)
  const focusOpacity = $derived(focusTransition)
  const contentSlabOpacity = $derived.by(() => {
    // Content slab appears slightly after focus, exits slightly before
    const enterStart = PHASE.FOCUS_ACTIVE
    const enterEnd = PHASE.FOCUS_ACTIVE + 0.10
    const exitStart = PHASE.FOCUS_EXIT - 0.10
    const exitEnd = PHASE.FOCUS_EXIT

    if (filmProgress < enterStart) return 0
    if (filmProgress >= enterEnd && filmProgress <= exitStart) return 1
    if (filmProgress > exitEnd) return 0

    // Entering
    if (filmProgress < enterEnd) {
      return (filmProgress - enterStart) / (enterEnd - enterStart)
    }

    // Exiting
    return 1 - (filmProgress - exitStart) / (exitEnd - exitStart)
  })

  const contentSlabTransform = $derived(
    `translateX(${(1 - contentSlabOpacity) * 30}px)`
  )

  // Current film data
  const currentFilm = $derived(films[activeFilmIndex])

  // Section label
  const labelText = $derived(
    phase === 'overview' ? 'FILM' : 'FILM — HIGH ALTITUDE FEATURES'
  )

  // Step indicator data
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // Cleanup
  onDestroy(() => {
    ctx?.revert()
  })

  // Initialize ScrollTrigger
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

    ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `top+=${sectionEnd} top`,
        scrub: true,
        onUpdate: (self) => {
          scrollProgress = self.progress
        },
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
    transition: `opacity ${DURATION.cinematic}s cubic-bezier(0.25, 0, 0.35, 1)`,

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
    transition: `all ${DURATION.cinematic}s cubic-bezier(0.19, 1, 0.22, 1)`,
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
    transition: `opacity ${DURATION.cinematic}s cubic-bezier(0.19, 1, 0.22, 1)`,

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
    transition: `opacity ${DURATION.standard}s cubic-bezier(0.19, 1, 0.22, 1), transform ${DURATION.standard}s cubic-bezier(0.19, 1, 0.22, 1)`,
  })

  // Helper to get border color based on active state
  function getBorderStyle(index: number): string {
    return index === activeFilmIndex ? '#f6c605' : '#707977'
  }

  // Helper to get frame scale/opacity for non-active films during transition
  function getFrameStyle(index: number): { opacity: number; scale: number } {
    if (index === activeFilmIndex) {
      return { opacity: 1, scale: 1 }
    }
    // Other frames fade and scale down during focus transition
    return {
      opacity: 1 - focusTransition * 0.7,
      scale: 1 - focusTransition * 0.1,
    }
  }
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film-overview">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text={labelText} />
  </div>

  <!-- Overview Grid (all 4 films) -->
  <div
    class={overviewGridStyles}
    style:opacity={overviewOpacity}
    style:pointer-events={overviewOpacity < 0.5 ? 'none' : 'auto'}
    data-overview-grid
  >
    {#each films as film, i}
      {@const frameStyle = getFrameStyle(i)}
      <div
        class={filmFrameStyles}
        style:opacity={frameStyle.opacity}
        style:transform="scale({frameStyle.scale})"
        data-film={film.id}
        data-index={i}
      >
        <BorderedViewport
          aspectRatio={isMobile ? '16/9' : '2.39/1'}
          borderColor={getBorderStyle(i)}
        >
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
  <div
    class={focusLayoutStyles}
    style:opacity={focusOpacity}
    style:pointer-events={focusOpacity < 0.5 ? 'none' : 'auto'}
    data-focus-layout
  >
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
    <div
      class={focusSlabContainerStyles}
      style:opacity={contentSlabOpacity}
      style:transform={contentSlabTransform}
      data-content-slab
    >
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
      activeIndex={activeFilmIndex}
      showLabels={true}
    />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
