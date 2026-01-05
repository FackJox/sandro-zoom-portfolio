<!--
  AboutSection.svelte

  About Me section - 3 beats telling the personal story.
  Each beat has its own background image.
  Scroll-driven beat navigation with click-to-navigate dots.

  Design: Alpine Noir - personal narrative with documentary restraint
  Motion: Machine/Documentary archetype - precise, camera-like
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import AboutBeat from '../components/ui/AboutBeat.svelte'

  interface Beat {
    id: string
    subtitle: string
    text: string
    imageSrc: string
  }

  const beats: Beat[] = [
    {
      id: 'frontline',
      subtitle: 'FRONT-LINE PERSPECTIVE',
      text: "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan. I filmed the first winter ascent of K2. I've been to Everest six times, and K2 three.",
      imageSrc: '/pictures/heli rescue (1 of 2).jpg'
    },
    {
      id: 'origin',
      subtitle: 'ORIGIN STORY',
      text: "A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. I joined the British Army as a combat camera operator, which led to assignments in Afghanistan, Iraq, and eventually the high peaks.",
      imageSrc: '/pictures/IMG_1101.JPG'
    },
    {
      id: 'values',
      subtitle: 'VALUES & WORK',
      text: "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe in showing the truth, even when it's uncomfortable. The camera doesn't lie, but it can reveal what we'd rather not see.",
      imageSrc: '/pictures/push (19 of 22).jpg'
    }
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let activeBeat = $state(0)
  let ctx: gsap.Context | null = $state(null)
  let isScrollDriven = $state(true)

  // Derived
  const currentBeat = $derived(beats[activeBeat])

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
            Math.floor(progress * beats.length),
            beats.length - 1
          )

          if (beatIndex !== activeBeat) {
            activeBeat = beatIndex
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
    if (index === activeBeat) return

    isScrollDriven = false
    activeBeat = index

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
    filter: 'saturate(0.3) contrast(1.1)',
    transition: `opacity ${DURATION.standard}s`,
  })

  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.7) 0%, rgba(10, 10, 10, 0.85) 100%)',
    pointerEvents: 'none',
    zIndex: '2',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })

  const beatContainerStyles = css({
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
    gap: '1rem',
    zIndex: '10',
  })

  const dotStyles = css({
    width: '8px',
    height: '2px',
    backgroundColor: 'brand.phantom',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    transition: `all ${DURATION.micro}s`,
    '&:hover': {
      backgroundColor: 'brand.textMuted',
    },
    '&[data-active="true"]': {
      width: '24px',
      backgroundColor: 'brand.accent',
    },
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="about">
  <!-- Background Images -->
  {#each beats as beat, i}
    <img
      class={bgImageStyles}
      src={beat.imageSrc}
      alt=""
      loading="eager"
      style="opacity: {i === activeBeat ? 1 : 0}; z-index: {i === activeBeat ? 1 : 0};"
    />
  {/each}

  <!-- Dark Overlay -->
  <div class={overlayStyles}></div>

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="ABOUT ME" />
  </div>

  <!-- Beat Content (conditional render) -->
  <div class={beatContainerStyles}>
    {#key activeBeat}
      <AboutBeat subtitle={currentBeat.subtitle} text={currentBeat.text} />
    {/key}
  </div>

  <!-- Progress (clickable) -->
  <div class={progressStyles} data-animate="text">
    {#each beats as beat, i}
      <button
        type="button"
        class={dotStyles}
        data-active={i === activeBeat}
        onclick={() => handleDotClick(i)}
        aria-label="View {beat.subtitle}"
        aria-current={i === activeBeat ? 'step' : undefined}
      ></button>
    {/each}
  </div>
</div>
