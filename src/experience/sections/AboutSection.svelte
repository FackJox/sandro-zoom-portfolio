<!--
  AboutSection.svelte

  About Me section - 3 beats telling the personal story.
  Beat 1: Front-line perspective
  Beat 2: Origin story
  Beat 3: Values & work

  Design: Alpine Noir - personal narrative with documentary restraint
  From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import AboutBeat from '../components/ui/AboutBeat.svelte'

  interface Beat {
    id: string
    subtitle: string
    text: string
  }

  interface Props {
    activeBeat?: number
  }

  let { activeBeat = 0 }: Props = $props()

  const beats: Beat[] = [
    {
      id: 'frontline',
      subtitle: 'FRONT-LINE PERSPECTIVE',
      text: "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan. I filmed the first winter ascent of K2. I've been to Everest six times, and K2 three."
    },
    {
      id: 'origin',
      subtitle: 'ORIGIN STORY',
      text: "A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. I joined the British Army as a combat camera operator, which led to assignments in Afghanistan, Iraq, and eventually the high peaks."
    },
    {
      id: 'values',
      subtitle: 'VALUES & WORK',
      text: "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe in showing the truth, even when it's uncomfortable. The camera doesn't lie, but it can reveal what we'd rather not see."
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
    background: 'linear-gradient(180deg, rgba(15, 20, 25, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
  })

  const beatContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  })

  // Progress dots at bottom
  const progressStyles = css({
    position: 'absolute',
    bottom: '8vh',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  })

  const dotStyles = css({
    width: '8px',
    height: '2px',
    backgroundColor: 'brand.phantom',
    transition: 'all 0.3s ease',
    '&[data-active="true"]': {
      width: '24px',
      backgroundColor: 'brand.accent',
    },
  })
</script>

<div class={containerStyles} data-scene="about">
  <div class={labelContainerStyles}>
    <SectionLabel text="ABOUT ME" />
  </div>

  <div class={beatContainerStyles}>
    {#each beats as beat, i}
      {#if i === activeBeat}
        <AboutBeat subtitle={beat.subtitle} text={beat.text} />
      {/if}
    {/each}
  </div>

  <div class={progressStyles} data-animate="text">
    {#each beats as _, i}
      <span class={dotStyles} data-active={i === activeBeat}></span>
    {/each}
  </div>
</div>
