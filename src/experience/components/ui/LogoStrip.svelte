<!--
  LogoStrip.svelte

  Client logos strip component.
  Displays brand partner logos in a horizontal strip.

  Design: Alpine Noir - utilitarian, muted display
  From: docs/Brand Design System.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface LogoItem {
    src: string
    alt: string
  }

  interface Props {
    logos?: LogoItem[]
  }

  const defaultLogos: LogoItem[] = [
    { src: '/logos/netflix.avif', alt: 'Netflix' },
    { src: '/logos/bbc.avif', alt: 'BBC' },
    { src: '/logos/redbull.avif', alt: 'Red Bull' },
    { src: '/logos/berghaus.avif', alt: 'Berghaus' },
    { src: '/logos/osprey.avif', alt: 'Osprey' },
    { src: '/logos/northface.avif', alt: 'The North Face' },
    { src: '/logos/black-crows.avif', alt: 'Black Crows' },
    { src: '/logos/scarpa.avif', alt: 'Scarpa' },
    { src: '/logos/epic.avif', alt: 'Epic' },
    { src: '/logos/fp.avif', alt: 'FP' },
  ]

  let { logos = defaultLogos }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    padding: '1rem',
    width: '100%',
    maxWidth: '100vw',
    boxSizing: 'border-box',
    opacity: '0.6',

    '@media (min-width: 768px)': {
      gap: '2rem',
      padding: '1rem 2rem',
      flexWrap: 'nowrap',
    },
  })

  const logoStyles = css({
    height: '1.25rem',
    width: 'auto',
    maxWidth: '4.5rem',
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)',
    opacity: '0.8',
    flexShrink: '0',

    '@media (min-width: 768px)': {
      height: '1.5rem',
      maxWidth: '6rem',
    },
  })
</script>

<div class={containerStyles} data-animate="text" data-direction="down">
  {#each logos as logo}
    <img class={logoStyles} src={logo.src} alt={logo.alt} loading="lazy" />
  {/each}
</div>
