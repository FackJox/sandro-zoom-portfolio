<!--
  FilmSection.svelte

  Film section content - displays major documentary work.
  Full-bleed background image with film cards overlay.
  Scroll-driven beat navigation with click-to-navigate dots.
  Horizontal carousel transitions between sub-segments.

  Design: Alpine Noir - cinematic, documentary focus
  Motion: Machine/Documentary archetype - precise, camera-like pan transitions
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import FilmCard from '../components/ui/FilmCard.svelte'

  interface FilmProject {
    id: string
    title: string
    client: string
    year: string
    description: string
    imageSrc: string
  }

  const films: FilmProject[] = [
    {
      id: '14-peaks',
      title: '14 PEAKS: NOTHING IS IMPOSSIBLE',
      client: 'NETFLIX',
      year: '2021',
      description: "I worked as lead cinematographer on the Netflix documentary following Nims Purja's historic attempt to summit all 14 eight-thousanders in under 7 months.",
      imageSrc: '/pictures/EVEREST CLEAN (1 of 2).jpg'
    },
    {
      id: 'k2-winter',
      title: 'K2: THE IMPOSSIBLE DESCENT',
      client: 'DISCOVERY',
      year: '2020',
      description: "Documenting the first winter ascent of K2, the world's second highest and most dangerous mountain. Shot at -60°C in the death zone.",
      imageSrc: '/pictures/push (17 of 22).jpg'
    },
    {
      id: 'k2-summit',
      title: 'K2 SUMMIT PUSH',
      client: 'BBC',
      year: '2019',
      description: 'The summit push that made history. Capturing the final 2000m ascent in conditions that kill most who attempt it.',
      imageSrc: '/pictures/EVEREST CLEAN (2 of 2).jpg'
    }
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let carouselTrackEl: HTMLElement | null = $state(null)
  let activeFilm = $state(0)
  let previousFilm = $state(0)
  let ctx: gsap.Context | null = $state(null)
  let isScrollDriven = $state(true)
  let isAnimating = $state(false)

  // ============================================================================
  // Carousel Animation
  // ============================================================================

  function animateToFilm(newIndex: number, oldIndex: number) {
    if (!carouselTrackEl || isAnimating) return

    isAnimating = true
    const direction = newIndex > oldIndex ? -1 : 1 // -1 = slide left, 1 = slide right

    // Animate the carousel track
    gsap.to(carouselTrackEl, {
      xPercent: -newIndex * 100,
      duration: DURATION.standard,
      ease: BRAND.lockOn,
      onComplete: () => {
        isAnimating = false
      }
    })
  }

  // Watch for activeFilm changes and trigger animation
  $effect(() => {
    if (activeFilm !== previousFilm && carouselTrackEl) {
      animateToFilm(activeFilm, previousFilm)
      previousFilm = activeFilm
    }
  })

  // ============================================================================
  // Scroll-Driven Navigation
  // ============================================================================

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

    // Calculate this section's scroll range
    const totalHeight = portalContainer.scrollHeight - window.innerHeight
    const sceneCount = allScenes.length
    const sceneHeight = totalHeight / sceneCount
    const sectionStart = sectionIndex * sceneHeight
    const sectionEnd = (sectionIndex + 1) * sceneHeight

    ctx = gsap.context(() => {
      // Set initial position
      if (carouselTrackEl) {
        gsap.set(carouselTrackEl, { xPercent: 0 })
      }

      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `top+=${sectionEnd} top`,
        onUpdate: (self) => {
          if (!isScrollDriven || isAnimating) return

          const progress = self.progress
          const beatIndex = Math.min(
            Math.floor(progress * films.length),
            films.length - 1
          )

          if (beatIndex !== activeFilm) {
            activeFilm = beatIndex
          }
        },
      })
    })
  })

  onDestroy(() => {
    ctx?.revert()
  })

  // ============================================================================
  // Click Navigation
  // ============================================================================

  function handleDotClick(index: number) {
    if (index === activeFilm || isAnimating) return

    isScrollDriven = false
    activeFilm = index

    // Re-enable scroll after transition
    setTimeout(() => {
      isScrollDriven = true
    }, DURATION.standard * 1000 + 100)
  }

  // ============================================================================
  // Styles
  // ============================================================================

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: '#0a0a0a',
  })

  const bgImageStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'saturate(0.4) contrast(1.1)',
    transition: `opacity ${DURATION.standard}s ${BRAND.lockOn}`,
  })

  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.6) 0%, rgba(10, 10, 10, 0.85) 100%)',
    pointerEvents: 'none',
    zIndex: '2',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })

  const carouselContainerStyles = css({
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: '10',
  })

  const carouselTrackStyles = css({
    display: 'flex',
    width: '100%',
    height: '100%',
  })

  const carouselSlideStyles = css({
    flex: '0 0 100%',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const progressStyles = css({
    position: 'absolute',
    bottom: '8vh',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    zIndex: '10',
  })

  const dotStyles = css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    transition: `all ${DURATION.micro}s`,
    '&:hover': {
      backgroundColor: 'brand.textMuted',
    },
    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
      transform: 'scale(1.25)',
    },
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film">
  <!-- Background Images (crossfade with brand easing) -->
  {#each films as film, i}
    <img
      class={bgImageStyles}
      src={film.imageSrc}
      alt=""
      loading="eager"
      style="opacity: {i === activeFilm ? 1 : 0}; z-index: {i === activeFilm ? 1 : 0};"
    />
  {/each}

  <!-- Dark Overlay -->
  <div class={overlayStyles}></div>

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="FILM -- HIGH ALTITUDE FEATURES" />
  </div>

  <!-- Horizontal Carousel -->
  <div class={carouselContainerStyles}>
    <div bind:this={carouselTrackEl} class={carouselTrackStyles}>
      {#each films as film}
        <div class={carouselSlideStyles}>
          <FilmCard
            title={film.title}
            client={film.client}
            year={film.year}
            description={film.description}
          />
        </div>
      {/each}
    </div>
  </div>

  <!-- Progress Dots (clickable) -->
  <div class={progressStyles} data-animate="text">
    {#each films as film, i}
      <button
        type="button"
        class={dotStyles}
        data-active={i === activeFilm}
        onclick={() => handleDotClick(i)}
        aria-label="View {film.title}"
        aria-current={i === activeFilm ? 'step' : undefined}
      ></button>
    {/each}
  </div>
</div>
