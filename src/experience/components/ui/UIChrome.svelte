<!--
  UIChrome.svelte

  Consistent UI chrome overlay for section screens.
  Uses CSS Grid to position UI elements (labels, hints, indicators)
  reliably across all device sizes and aspect ratios.

  Regions:
  - topLeft: Section labels
  - topRight: (reserved)
  - bottomLeft: (reserved)
  - bottomCenter: Scroll hints, beat/step indicators
  - bottomRight: (reserved)

  Design: Uses clamp() for spacing to ensure elements never get
  too close to edges (min) or too far (max), regardless of aspect ratio.
-->
<script lang="ts">
  import { css } from '$styled/css'
  import type { Snippet } from 'svelte'

  interface Props {
    /** Content for top-left region (e.g., SectionLabel) */
    topLeft?: Snippet
    /** Content for top-right region */
    topRight?: Snippet
    /** Content for bottom-left region */
    bottomLeft?: Snippet
    /** Content for bottom-center region (e.g., ScrollHint, indicators) */
    bottomCenter?: Snippet
    /** Content for bottom-right region */
    bottomRight?: Snippet
    /** Z-index for the chrome layer */
    zIndex?: number
  }

  let {
    topLeft,
    topRight,
    bottomLeft,
    bottomCenter,
    bottomRight,
    zIndex = 100
  }: Props = $props()

  // Chrome overlay - covers viewport but doesn't block interactions
  const chromeStyles = css({
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gridTemplateRows: 'auto 1fr auto',
    gridTemplateAreas: `
      "top-left    top-center    top-right"
      "left        center        right"
      "bottom-left bottom-center bottom-right"
    `,

    // Fluid padding with min/max bounds
    // Ensures consistent spacing across all aspect ratios
    // Mobile: tighter spacing, Desktop: more generous
    padding: `
      clamp(24px, 6vh, 56px)
      clamp(16px, 5vw, 64px)
      clamp(32px, 8vh, 72px)
      clamp(16px, 5vw, 64px)
    `,

    // Tablet adjustments - landscape tablets need special care
    '@media (min-width: 768px) and (max-width: 1023px)': {
      padding: `
        clamp(24px, 5vh, 48px)
        clamp(24px, 4vw, 56px)
        clamp(32px, 6vh, 56px)
        clamp(24px, 4vw, 56px)
      `,
    },

    // Mobile - tighter but still safe
    '@media (max-width: 767px)': {
      padding: `
        clamp(16px, 5vh, 40px)
        clamp(12px, 4vw, 24px)
        clamp(24px, 8vh, 56px)
        clamp(12px, 4vw, 24px)
      `,
    },

    // Landscape mobile/tablet - very short viewport height
    '@media (max-height: 500px)': {
      padding: `
        16px
        clamp(16px, 4vw, 48px)
        24px
        clamp(16px, 4vw, 48px)
      `,
    },
  })

  // Region styles - each region is a flex container for easy alignment
  const topLeftStyles = css({
    gridArea: 'top-left',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    pointerEvents: 'auto',
  })

  const topRightStyles = css({
    gridArea: 'top-right',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    pointerEvents: 'auto',
  })

  const bottomLeftStyles = css({
    gridArea: 'bottom-left',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    pointerEvents: 'auto',
  })

  const bottomCenterStyles = css({
    gridArea: 'bottom-center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    pointerEvents: 'auto',
  })

  const bottomRightStyles = css({
    gridArea: 'bottom-right',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    pointerEvents: 'auto',
  })
</script>

<div class={chromeStyles} style:z-index={zIndex} data-ui-chrome>
  {#if topLeft}
    <div class={topLeftStyles}>
      {@render topLeft()}
    </div>
  {/if}

  {#if topRight}
    <div class={topRightStyles}>
      {@render topRight()}
    </div>
  {/if}

  {#if bottomLeft}
    <div class={bottomLeftStyles}>
      {@render bottomLeft()}
    </div>
  {/if}

  {#if bottomCenter}
    <div class={bottomCenterStyles}>
      {@render bottomCenter()}
    </div>
  {/if}

  {#if bottomRight}
    <div class={bottomRightStyles}>
      {@render bottomRight()}
    </div>
  {/if}
</div>
