<!--
  ServicesSection.svelte

  Services section with staggered card reveal.
  4 service cards with accent borders, staggered animation on scroll.

  Design: Staggered card reveal on dark background
  Motion: Machine archetype - precise staggered reveals
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  // Service card data
  interface ServiceCard {
    id: string
    title: string
    externalLink?: string
  }

  const services: ServiceCard[] = [
    {
      id: 'dop',
      title: 'MOUNTAIN DOP'
    },
    {
      id: 'photography',
      title: 'EXPED & PRODUCT PHOTOGRAPHY'
    },
    {
      id: 'aerial',
      title: 'AERIAL CINEMATOGRAPHY'
    },
    {
      id: 'stock',
      title: 'STOCK FOOTAGE AVAILABLE ON',
      externalLink: 'https://www.shutterstock.com/g/Sandro+Gromen-Hayes'
    }
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let cardsContainerEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  // Staggered reveal animation on mount
  onMount(() => {
    if (!containerEl || !cardsContainerEl) return

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

    ctx = gsap.context(() => {
      const cards = cardsContainerEl!.querySelectorAll('[data-service-card]')

      // Set initial state - cards hidden
      gsap.set(cards, {
        autoAlpha: 0,
        y: 30,
      })

      // Staggered reveal on scroll
      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        onEnter: () => {
          gsap.to(cards, {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.standard,
            ease: BRAND.lockOn,
            stagger: 0.15,
          })
        },
        once: true,
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
    alignItems: 'center',
    justifyContent: 'center',
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

  const cardsContainerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '600px',
    padding: '0 2rem',

    '@media (max-width: 1023px)': {
      maxWidth: '500px',
      gap: '1.25rem',
    },
    '@media (max-width: 767px)': {
      maxWidth: '100%',
      gap: '1rem',
      padding: '0 1.5rem',
    },
  })

  const cardStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '1.5rem 2rem',
    border: '1px solid',
    borderColor: 'brand.accent',
    backgroundColor: 'transparent',
    textAlign: 'center',

    '@media (max-width: 1023px)': {
      padding: '1.25rem 1.5rem',
    },
    '@media (max-width: 767px)': {
      padding: '1rem 1.25rem',
    },
  })

  const cardTextStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', sans-serif",
    fontSize: '1rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.text',

    '@media (max-width: 1023px)': {
      fontSize: '0.9rem',
    },
    '@media (max-width: 767px)': {
      fontSize: '0.85rem',
      letterSpacing: '0.12em',
    },
  })

  const linkStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', sans-serif",
    fontSize: '1rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    textDecoration: 'none',
    transition: `opacity ${DURATION.micro}s`,

    '&:hover': {
      opacity: '0.8',
    },

    '@media (max-width: 1023px)': {
      fontSize: '0.9rem',
    },
    '@media (max-width: 767px)': {
      fontSize: '0.85rem',
      letterSpacing: '0.12em',
    },
  })

  const externalIconStyles = css({
    marginLeft: '0.5rem',
    fontSize: '0.8em',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="services">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="SERVICES" />
  </div>

  <!-- Service Cards -->
  <div bind:this={cardsContainerEl} class={cardsContainerStyles}>
    {#each services as service}
      <div class={cardStyles} data-service-card>
        {#if service.externalLink}
          <span class={cardTextStyles}>
            {service.title}{' '}
            <a
              href={service.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              class={linkStyles}
            >
              Shutterstock<span class={externalIconStyles}>↗</span>
            </a>
          </span>
        {:else}
          <span class={cardTextStyles}>{service.title}</span>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
