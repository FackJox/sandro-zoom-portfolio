<!--
  ServicesSection.svelte

  Services section with staggered card reveal.
  4 service cards with accent borders, staggered animation on scroll.

  Design: Staggered card reveal on dark background
  Motion: Machine archetype - precise staggered reveals
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import { DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'

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

  // Note: Previous staggered reveal animation removed.
  // The card flip transition now handles the scene reveal, so
  // content should be visible immediately for proper cloning.

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

<div class={containerStyles} data-scene="services">
  <!-- Service Cards -->
  <div class={cardsContainerStyles}>
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

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <SectionLabel text="SERVICES" />
    {/snippet}

    {#snippet bottomCenter()}
      <ScrollHint />
    {/snippet}
  </UIChrome>
</div>
