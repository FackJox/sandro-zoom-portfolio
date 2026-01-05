<!--
  FilmSection.svelte

  Film section content - displays major documentary work.
  Contains cards for 14 Peaks, K2 Winter, K2 Summit.

  Design: Alpine Noir - cinematic, documentary focus
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import FilmCard from '../components/ui/FilmCard.svelte'

  interface FilmProject {
    id: string
    title: string
    client: string
    year: string
    description: string
  }

  interface Props {
    activeFilm?: number
  }

  let { activeFilm = 0 }: Props = $props()

  const films: FilmProject[] = [
    {
      id: '14-peaks',
      title: '14 PEAKS: NOTHING IS IMPOSSIBLE',
      client: 'NETFLIX',
      year: '2021',
      description: "I worked as lead cinematographer on the Netflix documentary following Nims Purja's historic attempt to summit all 14 eight-thousanders in under 7 months."
    },
    {
      id: 'k2-winter',
      title: 'K2: THE IMPOSSIBLE DESCENT',
      client: 'DISCOVERY',
      year: '2020',
      description: "Documenting the first winter ascent of K2, the world's second highest and most dangerous mountain. Shot at -60°C in the death zone."
    },
    {
      id: 'k2-summit',
      title: 'K2 SUMMIT PUSH',
      client: 'BBC',
      year: '2019',
      description: 'The summit push that made history. Capturing the final 2000m ascent in conditions that kill most who attempt it.'
    }
  ]

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)',
  })

  // Section label positioned top-left
  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
  })

  // Card container
  const cardContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  })

  // Progress indicator
  const progressStyles = css({
    position: 'absolute',
    bottom: '8vh',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  })

  const dotStyles = css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
    transition: 'all 0.3s ease',
    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
      transform: 'scale(1.25)',
    },
  })
</script>

<div class={containerStyles} data-scene="film">
  <div class={labelContainerStyles}>
    <SectionLabel text="FILM -- HIGH ALTITUDE FEATURES" />
  </div>

  <div class={cardContainerStyles}>
    {#each films as film, i}
      {#if i === activeFilm}
        <FilmCard
          title={film.title}
          client={film.client}
          year={film.year}
          description={film.description}
        />
      {/if}
    {/each}
  </div>

  <div class={progressStyles} data-animate="text">
    {#each films as _, i}
      <span class={dotStyles} data-active={i === activeFilm}></span>
    {/each}
  </div>
</div>
