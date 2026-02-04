<!--
  StepIndicator.svelte

  Dot navigation with optional labels for Film section.
  Click to navigate between projects.

  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import { DURATION } from '$lib/animation/easing'

  interface Step {
    id: string
    label?: string
  }

  interface Props {
    steps: Step[]
    activeIndex: number
    showLabels?: boolean
    onSelect?: (index: number) => void
  }

  let {
    steps,
    activeIndex,
    showLabels = true,
    onSelect
  }: Props = $props()

  function handleClick(index: number) {
    if (onSelect) {
      onSelect(index)
    }
  }

  const containerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Fluid gap that shrinks on smaller viewports
    gap: 'clamp(0.5rem, 2vw, 1.5rem)',
    // Ensure it fits within viewport
    maxWidth: '100%',
    flexWrap: 'wrap',

    // On very narrow viewports, reduce gap further
    '@media (max-width: 480px)': {
      gap: '0.375rem',
    },
  })

  const stepStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '0.5rem',
    // Flex shrink to fit
    flexShrink: 0,

    '@media (max-width: 480px)': {
      gap: '0.375rem',
      padding: '0.25rem',
    },
  })

  const dotStyles = css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
    transition: `all ${DURATION.micro}s`,

    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
      transform: 'scale(1.25)',
    },

    '@media (max-width: 480px)': {
      width: '6px',
      height: '6px',
    },
  })

  const labelStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    // Fluid font size that scales with viewport
    fontSize: 'clamp(0.5rem, 1.2vw, 0.625rem)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
    whiteSpace: 'nowrap',
    transition: `color ${DURATION.micro}s`,
    // Truncate if needed
    maxWidth: 'clamp(60px, 15vw, 120px)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',

    '&[data-active="true"]': {
      color: 'brand.textMuted',
    },

    // Hide labels on very narrow viewports
    '@media (max-width: 400px)': {
      display: 'none',
    },
  })
</script>

<div class={containerStyles}>
  {#each steps as step, i}
    <button
      type="button"
      class={stepStyles}
      onclick={() => handleClick(i)}
      aria-label="Go to {step.label || `step ${i + 1}`}"
      aria-current={i === activeIndex ? 'step' : undefined}
    >
      <span class={dotStyles} data-active={i === activeIndex}></span>
      {#if showLabels && step.label}
        <span class={labelStyles} data-active={i === activeIndex}>{step.label}</span>
      {/if}
    </button>
  {/each}
</div>
