<!--
  FilmSection.svelte

  Film section with two-column layout.
  Left: Bordered viewport with video/image/embed
  Right: Content slab with project details

  Design: Two-column grid, scroll-driven beats
  Motion: Machine archetype - precise pan transitions
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import BorderedViewport from '../components/ui/BorderedViewport.svelte'
  import ContentSlab from '../components/ui/ContentSlab.svelte'
  import StepIndicator from '../components/ui/StepIndicator.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  // Film project data structure
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

  // 4 projects per design spec
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
  let activeIndex = $state(0)
  let ctx: gsap.Context | null = $state(null)
  let isScrollDriven = $state(true)
  let isAnimating = $state(false)

  // Step indicator data
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // Handle step selection (click navigation)
  function handleStepSelect(index: number) {
    if (index === activeIndex || isAnimating) return
    isScrollDriven = false
    activeIndex = index
    setTimeout(() => { isScrollDriven = true }, DURATION.standard * 1000 + 100)
  }

  // Scroll-driven navigation
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
        onUpdate: (self) => {
          if (!isScrollDriven || isAnimating) return
          const progress = self.progress
          const beatIndex = Math.min(Math.floor(progress * films.length), films.length - 1)
          if (beatIndex !== activeIndex) {
            activeIndex = beatIndex
          }
        },
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

  const gridStyles = css({
    display: 'grid',
    gridTemplateColumns: '0.6fr 0.4fr',
    gap: '2rem',
    width: '100%',
    height: '100%',
    padding: '12vh 8vw',
    boxSizing: 'border-box',

    '@media (max-width: 1023px)': {
      gridTemplateColumns: '0.55fr 0.45fr',
      gap: '1.5rem',
      padding: '10vh 6vw',
    },
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
      padding: '12vh 4vw 16vh',
    },
  })

  const viewportContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const slabContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
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

  const playOverlayStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
  })

  // Get current film
  const currentFilm = $derived(films[activeIndex])
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="FILM -- HIGH ALTITUDE FEATURES" />
  </div>

  <!-- Two-Column Grid -->
  <div class={gridStyles}>
    <!-- Left: Bordered Viewport -->
    <div class={viewportContainerStyles}>
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
              <!-- Play button overlay -->
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

    <!-- Right: Content Slab -->
    <div class={slabContainerStyles}>
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
      activeIndex={activeIndex}
      showLabels={true}
      onSelect={handleStepSelect}
    />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
