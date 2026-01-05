<!--
  ServicesCredits.svelte

  Film credits style services list.
  Displays services as stacked credits on black background.

  Design: Alpine Noir - "credits on black", cinematic roll
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    services?: string[]
  }

  let {
    services = [
      'MOUNTAIN DOP',
      'EXPEDITION & PRODUCT PHOTOGRAPHY',
      'AERIAL CINEMATOGRAPHY',
      'STOCK FOOTAGE'
    ]
  }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '2rem',
    padding: '2rem',
  })

  const serviceStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(1.5rem, 4vw, 3rem)',
    fontWeight: '600',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'brand.text',
    lineHeight: '1.2',
    opacity: '0.9',
    transition: 'opacity 0.3s ease, color 0.3s ease',
    '&:hover': {
      opacity: '1',
      color: 'brand.accent',
    },
  })
</script>

<div class={containerStyles}>
  {#each services as service}
    <p class={serviceStyles} data-animate="text">{service}</p>
  {/each}
</div>
