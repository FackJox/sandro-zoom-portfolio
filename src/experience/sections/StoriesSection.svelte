<!--
  StoriesSection.svelte

  Film Stories section - field stories and shorter pieces.
  Contains cards for Sasha, Grace, Afghanistan stories.

  Design: Alpine Noir - documentary grit, personal stories
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import StoryCard from '../components/ui/StoryCard.svelte'

  interface Story {
    id: string
    title: string
    subtitle: string
    client: string
    description: string
  }

  interface Props {
    activeStory?: number
  }

  let { activeStory = 0 }: Props = $props()

  const stories: Story[] = [
    {
      id: 'sasha',
      title: 'SASHA DIGIULIAN',
      subtitle: 'NO DAYS OFF',
      client: 'REDBULL TV',
      description: "In 2022 I filmed episode 1 of No Days Off for Red Bull TV, following world champion climber Sasha DiGiulian on her quest to climb one of the hardest routes in the Alps."
    },
    {
      id: 'grace',
      title: 'GRACE',
      subtitle: 'MENTAL HEALTH IN THE MOUNTAINS',
      client: 'SELF-DIRECTED',
      description: 'I directed, shot and edited this piece on mental health in extreme environments. A deeply personal project exploring the psychological toll of high-altitude work.'
    },
    {
      id: 'afghanistan',
      title: 'AFGHANISTAN',
      subtitle: 'CHARLES SCHWAB FOUNDATION',
      client: 'CHARLES SCHWAB',
      description: 'Filmed during one of six trips to Afghanistan. Documenting the human stories amidst conflict and the resilience of a people under unimaginable pressure.'
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
    background: 'linear-gradient(180deg, rgba(20, 25, 30, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
  })

  const cardContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  })

  // Progress indicator with labels
  const progressStyles = css({
    position: 'absolute',
    bottom: '8vh',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  })

  const progressItemStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease',
    opacity: '0.4',
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
    transition: 'all 0.3s ease',
    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
    },
  })
</script>

<div class={containerStyles} data-scene="stories">
  <div class={labelContainerStyles}>
    <SectionLabel text="FILM -- FIELD STORIES" />
  </div>

  <div class={cardContainerStyles}>
    {#each stories as story, i}
      {#if i === activeStory}
        <StoryCard
          title={story.title}
          subtitle={story.subtitle}
          client={story.client}
          description={story.description}
        />
      {/if}
    {/each}
  </div>

  <div class={progressStyles} data-animate="text">
    {#each stories as story, i}
      <div class={progressItemStyles} data-active={i === activeStory}>
        <span class={progressLabelStyles}>{story.id.toUpperCase()}</span>
        <span class={progressDotStyles} data-active={i === activeStory}></span>
      </div>
    {/each}
  </div>
</div>
