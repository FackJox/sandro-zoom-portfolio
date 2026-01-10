<!--
  FilmOverviewSection.svelte

  Scroll-driven overview grid that expands each film individually.
  Replaces FilmSection with overview → focus → overview cycle.

  Design: docs/plans/2025-01-07-film-overview-section-design.md
  Patterns: docs/framework/patterns.md (gsap.context, cleanup, autoAlpha)
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

  // Film project data (same as FilmSection)
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
  let phase = $state<'overview' | 'focus' | 'transition'>('overview')

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

  // Styles using PandaCSS
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
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    padding: '12vh 8vw',
    height: '100%',
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

  /**
   * Build the scroll-driven timeline for film overview transitions.
   * Each film gets ~9s of scroll time. Total: 36s.
   */
  function buildFilmTimeline(container: HTMLElement, mobile: boolean): gsap.core.Timeline {
    const tl = gsap.timeline()
    const filmFrames = container.querySelectorAll('[data-film]')
    const focusLayout = container.querySelector('[data-focus-layout]')
    const contentSlab = container.querySelector('[data-content-slab]')
    const overviewGrid = container.querySelector('[data-overview-grid]')

    const CYCLE = 9

    films.forEach((film, filmIndex) => {
      const cycleStart = filmIndex * CYCLE
      const currentFrame = filmFrames[filmIndex] as HTMLElement
      const otherFrames = Array.from(filmFrames).filter((_, i) => i !== filmIndex) as HTMLElement[]

      const currentBorder = currentFrame?.querySelector('[data-bordered-viewport]') as HTMLElement
      const otherBorders = otherFrames.map(f => f.querySelector('[data-bordered-viewport]') as HTMLElement)

      // PHASE 1: Border fade (0.8s into cycle)
      otherBorders.forEach(border => {
        if (border) {
          tl.to(border, {
            borderColor: '#707977',
            duration: DURATION.micro,
            ease: 'ease-lock-on',
          }, cycleStart + 0.8)
        }
      })

      if (currentBorder) {
        tl.to(currentBorder, {
          borderColor: '#f6c605',
          duration: DURATION.micro,
          ease: 'ease-lock-on',
        }, cycleStart + 0.8)
      }

      // PHASE 2: Others exit (1.2s into cycle)
      otherFrames.forEach(frame => {
        if (mobile) {
          // Mobile: scale + slide up + fade
          tl.to(frame, {
            scale: 0.9,
            y: -30,
            autoAlpha: 0,
            duration: DURATION.cinematic,
            ease: 'ease-release',
          }, cycleStart + 1.2)
        } else {
          // Desktop: scale + fade
          tl.to(frame, {
            scale: 0.85,
            autoAlpha: 0,
            duration: DURATION.cinematic,
            ease: 'ease-release',
          }, cycleStart + 1.2)
        }
      })

      // PHASE 3: Layout shift (1.8s into cycle)
      if (overviewGrid) {
        tl.to(overviewGrid, {
          autoAlpha: 0,
          duration: DURATION.cinematic,
          ease: 'ease-release',
        }, cycleStart + 1.8)
      }

      if (focusLayout) {
        tl.to(focusLayout, {
          autoAlpha: 1,
          duration: DURATION.cinematic,
          ease: 'ease-lock-on',
        }, cycleStart + 2.0)
      }

      tl.call(() => {
        phase = 'focus'
        activeIndex = filmIndex
      }, [], cycleStart + 2.0)

      // PHASE 4: Content slab enters (2.6s into cycle)
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 1,
          x: 0,
          duration: DURATION.standard,
          ease: 'ease-lock-on',
        }, cycleStart + 2.6)
      }

      // PHASE 5: Content slab exits (5.6s into cycle)
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 0,
          x: 40,
          duration: DURATION.standard,
          ease: 'ease-release',
        }, cycleStart + 5.6)
      }

      // PHASE 6: Layout reset (6.0s into cycle)
      if (focusLayout) {
        tl.to(focusLayout, {
          autoAlpha: 0,
          duration: DURATION.cinematic,
          ease: 'ease-release',
        }, cycleStart + 6.0)
      }

      if (overviewGrid) {
        tl.to(overviewGrid, {
          autoAlpha: 1,
          duration: DURATION.cinematic,
          ease: 'ease-lock-on',
        }, cycleStart + 6.3)
      }

      tl.call(() => {
        phase = 'overview'
      }, [], cycleStart + 6.3)

      // PHASE 7: Others return (6.5s into cycle)
      otherFrames.forEach(frame => {
        if (mobile) {
          // Mobile: scale + slide down + fade
          tl.to(frame, {
            scale: 1,
            y: 0,
            autoAlpha: 1,
            duration: DURATION.cinematic,
            ease: 'ease-lock-on',
          }, cycleStart + 6.5)
        } else {
          // Desktop: scale + fade
          tl.to(frame, {
            scale: 1,
            autoAlpha: 1,
            duration: DURATION.cinematic,
            ease: 'ease-lock-on',
          }, cycleStart + 6.5)
        }
      })

      // PHASE 8: Accent shift to next film (7.2s into cycle)
      if (filmIndex < films.length - 1) {
        const nextIndex = filmIndex + 1
        const nextFrame = filmFrames[nextIndex] as HTMLElement
        const nextBorder = nextFrame?.querySelector('[data-bordered-viewport]') as HTMLElement

        if (currentBorder) {
          tl.to(currentBorder, {
            borderColor: '#707977',
            duration: DURATION.micro,
            ease: 'ease-release',
          }, cycleStart + 7.2)
        }

        if (nextBorder) {
          tl.to(nextBorder, {
            borderColor: '#f6c605',
            duration: DURATION.micro,
            ease: 'ease-lock-on',
          }, cycleStart + 7.2)
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
      const focusLayout = containerEl!.querySelector('[data-focus-layout]')
      const contentSlab = containerEl!.querySelector('[data-content-slab]')

      if (focusLayout) gsap.set(focusLayout, { autoAlpha: 0 })
      if (contentSlab) {
        gsap.set(contentSlab, {
          autoAlpha: 0,
          x: isMobileNow ? 0 : 40,
          y: isMobileNow ? 30 : 0
        })
      }

      const tl = buildFilmTimeline(containerEl!, isMobileNow)

      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `top+=${sectionEnd} top`,
        scrub: 1,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          const progress = self.progress
          const filmIndex = Math.min(Math.floor(progress * films.length), films.length - 1)
          if (filmIndex !== activeIndex && phase === 'overview') {
            activeIndex = filmIndex
          }
        },
      })
    }, containerEl)
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
        data-border
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
      <BorderedViewport aspectRatio="2.39/1">
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
