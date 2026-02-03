<!--
  AboutSection.svelte

  About section with two-column layout matching Film section.
  Left: Bordered viewport with static images
  Right: Content slab with beat text

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
  import ScrollHint from '../components/ui/ScrollHint.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'

  // About beat data structure
  interface AboutBeat {
    id: string
    subtitle: string
    text: string
    imageSrc: string
  }

  // 3 beats per design spec with correct copy
  const beats: AboutBeat[] = [
    {
      id: 'frontline',
      subtitle: 'FRONT-LINE PERSPECTIVE',
      text: "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan, Mt Noshaq as the first Afghan woman summited and the highest peak in Pakistan, K2 as the first Pakistani woman summited. I filmed Nirmal Purja as he set a blazing speed record on the 14 8,000ers and filmed Kristin Harila as she smashed it.",
      imageSrc: '/pictures/heli rescue (1 of 2).jpg'
    },
    {
      id: 'origin',
      subtitle: 'ORIGIN STORY',
      text: "A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. Wanting to see more of the world I joined the British army reserve and soon the commando training combined with my passion for story telling provided opportunities to do just that. I filmed army expeds to Dhaulagiri in 2016 and Everest in 2017, began building a basecamp network and haven't really stopped carrying cameras up mountains since.",
      imageSrc: '/pictures/IMG_1101.JPG'
    },
    {
      id: 'values',
      subtitle: 'VALUES + ONGOING WORK',
      text: "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe deeply in representation and hope the projects I've worked on show people what's possible when you look up and believe. Stories from the mountains and the people in between are slowly being collected on my Youtube channel.",
      imageSrc: '/pictures/push (19 of 22).jpg'
    }
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let activeIndex = $state(0)
  let ctx: gsap.Context | null = $state(null)
  let isScrollDriven = $state(true)
  let isAnimating = $state(false)

  // Handle bar selection (click navigation)
  function handleBarSelect(index: number) {
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
          const beatIndex = Math.min(Math.floor(progress * beats.length), beats.length - 1)
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

  const barContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  })

  const barStyles = css({
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
      backgroundColor: 'brand.accent',
    },
  })

  // Get current beat
  const currentBeat = $derived(beats[activeIndex])
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="about">
  <!-- Two-Column Grid -->
  <div class={gridStyles}>
    <!-- Left: Bordered Viewport with Image -->
    <div class={viewportContainerStyles}>
      <BorderedViewport aspectRatio="16/9">
        <img
          src={currentBeat.imageSrc}
          alt={currentBeat.subtitle}
          style="width: 100%; height: 100%; object-fit: cover;"
        />
      </BorderedViewport>
    </div>

    <!-- Right: Content Slab -->
    <div class={slabContainerStyles}>
      <ContentSlab
        eyebrow={currentBeat.subtitle}
        description={currentBeat.text}
      />
    </div>
  </div>

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <SectionLabel text="ABOUT ME" />
    {/snippet}

    {#snippet bottomCenter()}
      <div class={barContainerStyles}>
        {#each beats as beat, i}
          <button
            type="button"
            class={barStyles}
            style="width: {i === activeIndex ? '32px' : '12px'};"
            data-active={i === activeIndex}
            onclick={() => handleBarSelect(i)}
            aria-label="View {beat.subtitle}"
            aria-current={i === activeIndex ? 'step' : undefined}
          ></button>
        {/each}
      </div>
      <ScrollHint />
    {/snippet}
  </UIChrome>
</div>
