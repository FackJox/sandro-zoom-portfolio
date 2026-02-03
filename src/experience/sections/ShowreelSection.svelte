<!--
  ShowreelSection.svelte

  Full-bleed showreel video with minimal chrome.
  Continues the same video from Hero, but in full color (no desaturation).

  Transition from Hero:
  - Hero content fades out
  - Overlay fades to transparent
  - Desaturation filter animates to full color

  Design: Alpine Noir - cinematic full-bleed
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  interface Props {
    videoSrc?: string
  }

  let {
    videoSrc = '/videos/showreel.mp4'
  }: Props = $props()

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  // Video background - FULL COLOR (no desaturation)
  const videoStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // No filter - full color showreel
  })

  // Subtle gradient for section label legibility
  const gradientStyles = css({
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '200px',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: '5',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })
</script>

<div class={containerStyles} data-scene="showreel">
  <!-- Video Background (full color) -->
  <video
    class={videoStyles}
    src={videoSrc}
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
  ></video>

  <!-- Top gradient for label legibility -->
  <div class={gradientStyles}></div>

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="SHOWREEL" />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
