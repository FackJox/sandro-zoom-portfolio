<!--
  VideoThumbnail.svelte

  Smart video thumbnail with three-tier loading:
  1. Poster image (immediate) - Shows instantly, seamless transition base
  2. Preview clip (lazy) - Loads when visible via IntersectionObserver
  3. Full video (on-demand) - Streams when user explicitly requests

  Uses IntersectionObserver for performance - preview only loads when scrolled into view.

  Design: Alpine Noir - cinematic media handling
  From: docs/plans/sunny-dancing-wave.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import VideoLoadingSpinner from './VideoLoadingSpinner.svelte'

  interface Props {
    /** Poster image (WebP, immediate load) */
    poster?: string
    /** Preview clip sources (lazy loaded when visible) */
    previewSrc?: string
    previewSrcWebm?: string
    previewSrcHevc?: string
    /** Full video sources (on-demand streaming) */
    fullSrc?: string
    fullSrcWebm?: string
    fullSrcHevc?: string
    /** Alt text for accessibility */
    alt?: string
    /** Current playback mode */
    mode?: 'preview' | 'full'
    /** Callback when full video is requested */
    onRequestFullVideo?: () => void
  }

  let {
    poster,
    previewSrc,
    previewSrcWebm,
    previewSrcHevc,
    fullSrc,
    fullSrcWebm,
    fullSrcHevc,
    alt = '',
    mode = 'preview',
    onRequestFullVideo
  }: Props = $props()

  // State
  let containerEl: HTMLDivElement | null = $state(null)
  let previewVideoEl: HTMLVideoElement | null = $state(null)
  let fullVideoEl: HTMLVideoElement | null = $state(null)

  let isVisible = $state(false)
  let previewLoaded = $state(false)
  let previewLoading = $state(false)
  let fullVideoLoading = $state(false)
  let fullVideoReady = $state(false)

  let observer: IntersectionObserver | null = null

  // Determine what to show based on state
  const showPoster = $derived(!previewLoaded || (mode === 'full' && !fullVideoReady))
  const showPreview = $derived(previewLoaded && mode === 'preview')
  const showFullVideo = $derived(mode === 'full' && fullVideoReady)
  const showSpinner = $derived(previewLoading || (mode === 'full' && fullVideoLoading && !fullVideoReady))

  // Has preview sources?
  const hasPreview = $derived(!!previewSrc || !!previewSrcWebm || !!previewSrcHevc)
  // Has full video sources?
  const hasFullVideo = $derived(!!fullSrc || !!fullSrcWebm || !!fullSrcHevc)

  // IntersectionObserver for lazy loading preview
  onMount(() => {
    if (!containerEl) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            isVisible = true
            // Preview will start loading automatically via Svelte reactivity
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Start loading 200px before visible
      }
    )

    observer.observe(containerEl)
  })

  onDestroy(() => {
    observer?.disconnect()
  })

  // Handle preview video loading
  function handlePreviewLoadStart() {
    previewLoading = true
  }

  function handlePreviewCanPlay() {
    previewLoading = false
    previewLoaded = true
  }

  // Handle full video loading
  function handleFullVideoLoadStart() {
    fullVideoLoading = true
  }

  function handleFullVideoCanPlay() {
    fullVideoLoading = false
    fullVideoReady = true
  }

  // Request full video (triggered by play button click)
  function requestFullVideo() {
    if (mode === 'full' || !hasFullVideo) return
    fullVideoLoading = true
    onRequestFullVideo?.()
  }

  // Reset full video state when mode changes back to preview
  $effect(() => {
    if (mode === 'preview') {
      fullVideoReady = false
      fullVideoLoading = false
    }
  })

  // Styles
  const containerStyles = css({
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  })

  const mediaStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // Fade transition with brand-standard timing
    transition: 'opacity 315ms cubic-bezier(0.19, 1.0, 0.22, 1.0)',
  })

  // Play button overlay (appears on hover when full video available)
  const playButtonStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    opacity: '0',
    transition: 'opacity 175ms, background-color 175ms',
    zIndex: '20',
    '&:hover': {
      opacity: '1',
      backgroundColor: 'rgba(15, 23, 26, 0.4)',
    },
    '&:focus-visible': {
      opacity: '1',
      backgroundColor: 'rgba(15, 23, 26, 0.4)',
      outline: '2px solid',
      outlineColor: 'brand.accent',
      outlineOffset: '-2px',
    },
  })

  const playIconStyles = css({
    width: '64px',
    height: '64px',
    color: 'white',
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-video-thumbnail>
  <!-- Layer 1: Poster (always rendered, fades out when video ready) -->
  {#if poster}
    <img
      src={poster}
      {alt}
      class={mediaStyles}
      style:opacity={showPoster ? 1 : 0}
      style:z-index="1"
      loading="eager"
    />
  {/if}

  <!-- Layer 2: Preview video (lazy loaded when visible) -->
  {#if isVisible && hasPreview}
    <video
      bind:this={previewVideoEl}
      class={mediaStyles}
      style:opacity={showPreview ? 1 : 0}
      style:z-index="2"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      poster={poster}
      onloadstart={handlePreviewLoadStart}
      oncanplaythrough={handlePreviewCanPlay}
    >
      {#if previewSrcWebm}
        <source src={previewSrcWebm} type="video/webm; codecs=av01.0.08M.08" />
      {/if}
      {#if previewSrcHevc}
        <source src={previewSrcHevc} type="video/mp4; codecs=hvc1" />
      {/if}
      {#if previewSrc}
        <source src={previewSrc} type="video/mp4" />
      {/if}
    </video>
  {/if}

  <!-- Layer 3: Full video (on-demand when mode='full') -->
  {#if mode === 'full' && hasFullVideo}
    <video
      bind:this={fullVideoEl}
      class={mediaStyles}
      style:opacity={showFullVideo ? 1 : 0}
      style:z-index="3"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      onloadstart={handleFullVideoLoadStart}
      oncanplaythrough={handleFullVideoCanPlay}
    >
      {#if fullSrcWebm}
        <source src={fullSrcWebm} type="video/webm; codecs=av01.0.08M.08" />
      {/if}
      {#if fullSrcHevc}
        <source src={fullSrcHevc} type="video/mp4; codecs=hvc1" />
      {/if}
      {#if fullSrc}
        <source src={fullSrc} type="video/mp4" />
      {/if}
    </video>
  {/if}

  <!-- Loading spinner overlay -->
  <VideoLoadingSpinner visible={showSpinner} />

  <!-- Play button overlay for requesting full video -->
  {#if mode === 'preview' && hasFullVideo}
    <button
      class={playButtonStyles}
      onclick={requestFullVideo}
      aria-label="Play full video"
      type="button"
    >
      <svg class={playIconStyles} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </button>
  {/if}
</div>
