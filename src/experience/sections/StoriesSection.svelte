<!--
  StoriesSection.svelte

  Film Stories section - field stories and shorter pieces.
  Full-bleed background with story cards overlay.
  Scroll-driven beat navigation with click-to-navigate dots.

  Design: Alpine Noir - documentary grit, personal stories
  Motion: Machine/Documentary archetype - precise, camera-like
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import StoryCard from '../components/ui/StoryCard.svelte'

  interface Story {
    id: string
    title: string
    subtitle: string
    client: string
    description: string
    imageSrc: string
  }

  const stories: Story[] = [
    {
      id: 'sasha',
      title: 'SASHA DIGIULIAN',
      subtitle: 'NO DAYS OFF',
      client: 'REDBULL TV',
      description: "In 2022 I filmed episode 1 of No Days Off for Red Bull TV, following world champion climber Sasha DiGiulian on her quest to climb one of the hardest routes in the Alps.",
      imageSrc: '/pictures/alpine-lakes.avif'
    },
    {
      id: 'grace',
      title: 'GRACE',
      subtitle: 'MENTAL HEALTH IN THE MOUNTAINS',
      client: 'SELF-DIRECTED',
      description: 'I directed, shot and edited this piece on mental health in extreme environments. A deeply personal project exploring the psychological toll of high-altitude work.',
      imageSrc: '/pictures/trek in 2 (4 of 87).jpg'
    },
    {
      id: 'afghanistan',
      title: 'AFGHANISTAN',
      subtitle: 'CHARLES SCHWAB FOUNDATION',
      client: 'CHARLES SCHWAB',
      description: 'Filmed during one of six trips to Afghanistan. Documenting the human stories amidst conflict and the resilience of a people under unimaginable pressure.',
      imageSrc: '/pictures/freshta promo (6 of 23).JPG'
    }
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let activeStory = $state(0)
  let ctx: gsap.Context | null = $state(null)
  let isScrollDriven = $state(true)

  // Derived
  const currentStory = $derived(stories[activeStory])

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
          if (!isScrollDriven) return

          const progress = self.progress
          const beatIndex = Math.min(
            Math.floor(progress * stories.length),
            stories.length - 1
          )

          if (beatIndex !== activeStory) {
            activeStory = beatIndex
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
    if (index === activeStory) return

    isScrollDriven = false
    activeStory = index

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
    transition: `opacity ${DURATION.standard}s`,
  })

  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.5) 0%, rgba(10, 10, 10, 0.8) 100%)',
    pointerEvents: 'none',
    zIndex: '2',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })

  const cardContainerStyles = css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    zIndex: '10',
  })

  const progressStyles = css({
    position: 'absolute',
    bottom: '8vh',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    zIndex: '10',
  })

  const progressItemStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '0.5rem',
    transition: `opacity ${DURATION.micro}s`,
    opacity: '0.4',
    '&:hover': {
      opacity: '0.7',
    },
    '&[data-active="true"]': {
      opacity: '1',
    },
  })

  const progressLabelStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.6rem',
    fontWeight: '500',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.textMuted',
  })

  const progressDotStyles = css({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
    transition: `all ${DURATION.micro}s`,
    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
    },
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="stories">
  <!-- Background Images -->
  {#each stories as story, i}
    <img
      class={bgImageStyles}
      src={story.imageSrc}
      alt=""
      loading="eager"
      style="opacity: {i === activeStory ? 1 : 0}; z-index: {i === activeStory ? 1 : 0};"
    />
  {/each}

  <!-- Dark Overlay -->
  <div class={overlayStyles}></div>

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="FILM -- FIELD STORIES" />
  </div>

  <!-- Story Card (conditional render) -->
  <div class={cardContainerStyles}>
    {#key activeStory}
      <StoryCard
        title={currentStory.title}
        subtitle={currentStory.subtitle}
        client={currentStory.client}
        description={currentStory.description}
      />
    {/key}
  </div>

  <!-- Progress with Labels (clickable) -->
  <div class={progressStyles} data-animate="text">
    {#each stories as story, i}
      <button
        type="button"
        class={progressItemStyles}
        data-active={i === activeStory}
        onclick={() => handleDotClick(i)}
        aria-label="View {story.title}"
        aria-current={i === activeStory ? 'step' : undefined}
      >
        <span class={progressLabelStyles}>{story.id.toUpperCase()}</span>
        <span class={progressDotStyles} data-active={i === activeStory}></span>
      </button>
    {/each}
  </div>
</div>
