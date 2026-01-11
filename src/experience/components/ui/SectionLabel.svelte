<!--
  SectionLabel.svelte

  Section header label component.
  Displays section identifier in top-left corner with keyline.

  Design: Alpine Noir - condensed, flanked by thin line
  From: docs/Brand Design System.md - "Section titles in condensed display, flanked by a thin line"

  Props:
  - text: The label text to display
  - variant: 'default' | 'accent' (color variant)
  - textRef: Bindable reference to the text element for external animation
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    text: string
    variant?: 'default' | 'accent'
    textRef?: HTMLSpanElement | null
  }

  let { text, variant = 'default', textRef = $bindable(null) }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  })

  const lineStyles = css({
    width: '40px',
    height: '1.5px',
    backgroundColor: 'brand.accent',
  })

  const baseTextStyles = css({
    // Trade Gothic Next Condensed Bold equivalent
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  })

  const accentTextStyles = css({ color: 'brand.accent' })
  const defaultTextStyles = css({ color: 'brand.accent' })

  // Reactive style computation
  const textStyles = $derived(
    `${baseTextStyles} ${variant === 'accent' ? accentTextStyles : defaultTextStyles}`
  )
</script>

<div class={containerStyles} data-animate="text">
  <span class={lineStyles}></span>
  <span bind:this={textRef} class={textStyles} data-section-label-text>{text}</span>
</div>
