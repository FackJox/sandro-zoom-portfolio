<!--
  VideoPlayer.svelte

  Full-featured video player with Alpine Noir aesthetic.
  Provides play/pause, timeline scrubbing, volume control, and fullscreen.

  Design: Alpine Noir - cinematic controls with Egg Toast (#f6c605) accents
  From: docs/Brand Design System.md

  Features:
  - Click to play/pause
  - Timeline scrubbing with hover preview
  - Volume slider with mute toggle
  - Fullscreen toggle
  - Auto-hide controls after inactivity
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import VideoLoadingSpinner from './VideoLoadingSpinner.svelte'

  interface Props {
    /** Video poster image */
    poster?: string
    /** MP4 source (fallback) */
    src: string
    /** WebM/AV1 source (preferred) */
    srcWebm?: string
    /** HEVC source (Safari) */
    srcHevc?: string
    /** Alt text for accessibility */
    alt?: string
    /** Callback when player is closed/stopped */
    onClose?: () => void
  }

  let {
    poster,
    src,
    srcWebm,
    srcHevc,
    alt = '',
    onClose
  }: Props = $props()

  // State
  let containerEl: HTMLDivElement | null = $state(null)
  let videoEl: HTMLVideoElement | null = $state(null)
  let timelineEl: HTMLDivElement | null = $state(null)

  let isPlaying = $state(false)
  let isLoading = $state(true)
  let isMuted = $state(false)
  let isFullscreen = $state(false)
  let showControls = $state(true)
  let controlsTimeout: ReturnType<typeof setTimeout> | null = null

  let currentTime = $state(0)
  let duration = $state(0)
  let volume = $state(1)
  let bufferedProgress = $state(0)

  // Derived
  const progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0)
  const formattedCurrentTime = $derived(formatTime(currentTime))
  const formattedDuration = $derived(formatTime(duration))

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Event handlers
  function handleVideoClick(e: MouseEvent) {
    // Prevent click from reaching parent elements
    e.stopPropagation()
    togglePlayPause()
  }

  function togglePlayPause() {
    if (!videoEl) return

    if (isPlaying) {
      videoEl.pause()
    } else {
      videoEl.play()
    }
  }

  function handlePlay() {
    isPlaying = true
    resetControlsTimeout()
  }

  function handlePause() {
    isPlaying = false
    showControls = true
    clearControlsTimeout()
  }

  function handleTimeUpdate() {
    if (!videoEl) return
    currentTime = videoEl.currentTime
  }

  function handleLoadedMetadata() {
    if (!videoEl) return
    duration = videoEl.duration
    isLoading = false
  }

  function handleProgress() {
    if (!videoEl) return
    if (videoEl.buffered.length > 0) {
      bufferedProgress = (videoEl.buffered.end(videoEl.buffered.length - 1) / duration) * 100
    }
  }

  function handleWaiting() {
    isLoading = true
  }

  function handleCanPlay() {
    isLoading = false
  }

  function handleEnded() {
    isPlaying = false
    showControls = true
  }

  // Timeline scrubbing
  function handleTimelineClick(e: MouseEvent) {
    if (!timelineEl || !videoEl) return
    e.stopPropagation()

    const rect = timelineEl.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    videoEl.currentTime = percent * duration
  }

  // Volume control
  function handleVolumeChange(e: Event) {
    const input = e.target as HTMLInputElement
    volume = parseFloat(input.value)
    if (videoEl) {
      videoEl.volume = volume
      isMuted = volume === 0
    }
  }

  function toggleMute() {
    if (!videoEl) return

    if (isMuted) {
      videoEl.muted = false
      isMuted = false
      if (volume === 0) {
        volume = 0.5
        videoEl.volume = volume
      }
    } else {
      videoEl.muted = true
      isMuted = true
    }
  }

  // Fullscreen
  function toggleFullscreen() {
    if (!containerEl) return

    if (isFullscreen) {
      document.exitFullscreen?.()
    } else {
      containerEl.requestFullscreen?.()
    }
  }

  function handleFullscreenChange() {
    isFullscreen = document.fullscreenElement === containerEl
  }

  // Controls visibility
  function handleMouseMove() {
    showControls = true
    resetControlsTimeout()
  }

  function handleMouseLeave() {
    if (isPlaying) {
      clearControlsTimeout()
      controlsTimeout = setTimeout(() => {
        showControls = false
      }, 1500)
    }
  }

  function resetControlsTimeout() {
    clearControlsTimeout()
    if (isPlaying) {
      controlsTimeout = setTimeout(() => {
        showControls = false
      }, 3000)
    }
  }

  function clearControlsTimeout() {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      controlsTimeout = null
    }
  }

  // Keyboard controls
  function handleKeyDown(e: KeyboardEvent) {
    if (!videoEl) return

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault()
        togglePlayPause()
        break
      case 'f':
        e.preventDefault()
        toggleFullscreen()
        break
      case 'm':
        e.preventDefault()
        toggleMute()
        break
      case 'ArrowLeft':
        e.preventDefault()
        videoEl.currentTime = Math.max(0, currentTime - 5)
        break
      case 'ArrowRight':
        e.preventDefault()
        videoEl.currentTime = Math.min(duration, currentTime + 5)
        break
      case 'ArrowUp':
        e.preventDefault()
        volume = Math.min(1, volume + 0.1)
        videoEl.volume = volume
        break
      case 'ArrowDown':
        e.preventDefault()
        volume = Math.max(0, volume - 0.1)
        videoEl.volume = volume
        break
      case 'Escape':
        if (isFullscreen) {
          document.exitFullscreen?.()
        }
        break
    }
  }

  onMount(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // Auto-play when mounted
    if (videoEl) {
      videoEl.play().catch(() => {
        // Autoplay blocked, show play button
        isPlaying = false
      })
    }
  })

  onDestroy(() => {
    clearControlsTimeout()
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })

  // Styles - Alpine Noir aesthetic
  const containerStyles = css({
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: 'brand.bg',
    cursor: 'pointer',
    overflow: 'hidden',
    outline: 'none',

    '&:focus-visible': {
      outline: '1.5px solid',
      outlineColor: 'brand.accent',
      outlineOffset: '-1.5px',
    },
  })

  const videoStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  })

  // Play button overlay - Egg roll style, visible when paused
  const playOverlayStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 26, 0.4)',
    transition: 'opacity 175ms ease-out, visibility 175ms ease-out',
    zIndex: '10',
  })

  const playButtonStyles = css({
    position: 'relative',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))',
    transition: 'transform 175ms ease-out',

    '&:hover': {
      transform: 'scale(1.08)',
    },
  })

  const playIconStyles = css({
    width: '32px',
    height: '32px',
    marginLeft: '4px',
    fill: 'brand.accent',
  })

  // Controls bar - bottom gradient with controls
  const controlsBarStyles = css({
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '32px 16px 12px',
    background: 'linear-gradient(to top, rgba(15, 23, 26, 0.95) 0%, rgba(15, 23, 26, 0.7) 50%, transparent 100%)',
    transition: 'opacity 220ms ease-out, visibility 220ms ease-out',
    zIndex: '20',
  })

  // Timeline container
  const timelineContainerStyles = css({
    position: 'relative',
    width: '100%',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginBottom: '8px',
  })

  const timelineTrackStyles = css({
    position: 'relative',
    width: '100%',
    height: '3px',
    backgroundColor: 'rgba(192, 191, 182, 0.3)', // Silverplate at 30%
    borderRadius: '0',
    overflow: 'hidden',
  })

  const timelineBufferedStyles = css({
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    backgroundColor: 'rgba(192, 191, 182, 0.5)', // Silverplate at 50%
    transition: 'width 200ms linear',
  })

  const timelineProgressStyles = css({
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    backgroundColor: 'brand.accent', // Egg Toast
  })

  const timelineThumbStyles = css({
    position: 'absolute',
    top: '50%',
    width: '12px',
    height: '12px',
    backgroundColor: 'brand.accent',
    border: '2px solid white',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 100ms ease-out, opacity 100ms ease-out',
    opacity: '0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',

    '[data-controls]:hover &': {
      opacity: '1',
    },
  })

  // Controls row
  const controlsRowStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  })

  // Control button base
  const controlButtonStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: '0',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'brand.text', // Silverplate
    transition: 'color 100ms ease-out, transform 100ms ease-out',

    '&:hover': {
      color: 'brand.accent',
      transform: 'scale(1.1)',
    },

    '&:focus-visible': {
      outline: '1.5px solid',
      outlineColor: 'brand.accent',
      outlineOffset: '2px',
    },

    '& svg': {
      width: '20px',
      height: '20px',
      fill: 'currentColor',
    },
  })

  // Time display
  const timeDisplayStyles = css({
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '0.05em',
    color: 'brand.text',
    minWidth: '80px',
    textAlign: 'center',
  })

  // Volume container
  const volumeContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  const volumeSliderStyles = css({
    width: '60px',
    height: '3px',
    appearance: 'none',
    backgroundColor: 'rgba(192, 191, 182, 0.3)',
    borderRadius: '0',
    cursor: 'pointer',
    transition: 'opacity 150ms ease-out',
    opacity: '0.7',

    '&:hover': {
      opacity: '1',
    },

    '&::-webkit-slider-thumb': {
      appearance: 'none',
      width: '10px',
      height: '10px',
      backgroundColor: 'brand.accent',
      borderRadius: '50%',
      cursor: 'pointer',
      border: 'none',
    },

    '&::-moz-range-thumb': {
      width: '10px',
      height: '10px',
      backgroundColor: '#f6c605',
      borderRadius: '50%',
      cursor: 'pointer',
      border: 'none',
    },
  })

  // Spacer
  const spacerStyles = css({
    flex: '1',
  })
</script>

<div
  bind:this={containerEl}
  class={containerStyles}
  data-video-player
  data-controls
  tabindex="0"
  role="application"
  aria-label="Video player"
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  onkeydown={handleKeyDown}
>
  <!-- Video element -->
  <video
    bind:this={videoEl}
    class={videoStyles}
    {poster}
    preload="auto"
    playsinline
    onclick={handleVideoClick}
    onplay={handlePlay}
    onpause={handlePause}
    ontimeupdate={handleTimeUpdate}
    onloadedmetadata={handleLoadedMetadata}
    onprogress={handleProgress}
    onwaiting={handleWaiting}
    oncanplay={handleCanPlay}
    onended={handleEnded}
  >
    {#if srcWebm}
      <source src={srcWebm} type="video/webm; codecs=av01.0.08M.08" />
    {/if}
    {#if srcHevc}
      <source src={srcHevc} type="video/mp4; codecs=hvc1" />
    {/if}
    {#if src}
      <source src={src} type="video/mp4" />
    {/if}
  </video>

  <!-- Loading spinner -->
  <VideoLoadingSpinner visible={isLoading} />

  <!-- Play button overlay (when paused) -->
  <div
    class={playOverlayStyles}
    style:opacity={!isPlaying && !isLoading ? 1 : 0}
    style:visibility={!isPlaying && !isLoading ? 'visible' : 'hidden'}
    style:pointer-events={!isPlaying && !isLoading ? 'auto' : 'none'}
    onclick={handleVideoClick}
  >
    <div class={playButtonStyles}>
      <svg class={playIconStyles} viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>
  </div>

  <!-- Controls bar -->
  <div
    class={controlsBarStyles}
    style:opacity={showControls ? 1 : 0}
    style:visibility={showControls ? 'visible' : 'hidden'}
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Timeline -->
    <div
      bind:this={timelineEl}
      class={timelineContainerStyles}
      onclick={handleTimelineClick}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
    >
      <div class={timelineTrackStyles}>
        <div class={timelineBufferedStyles} style:width="{bufferedProgress}%"></div>
        <div class={timelineProgressStyles} style:width="{progress}%"></div>
      </div>
      <div class={timelineThumbStyles} style:left="{progress}%"></div>
    </div>

    <!-- Controls row -->
    <div class={controlsRowStyles}>
      <!-- Play/Pause button -->
      <button
        class={controlButtonStyles}
        onclick={togglePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        type="button"
      >
        {#if isPlaying}
          <svg viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        {/if}
      </button>

      <!-- Volume -->
      <div class={volumeContainerStyles}>
        <button
          class={controlButtonStyles}
          onclick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          type="button"
        >
          {#if isMuted || volume === 0}
            <svg viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          {:else if volume < 0.5}
            <svg viewBox="0 0 24 24">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
          {:else}
            <svg viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          {/if}
        </button>
        <input
          type="range"
          class={volumeSliderStyles}
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          oninput={handleVolumeChange}
          aria-label="Volume"
        />
      </div>

      <!-- Time display -->
      <span class={timeDisplayStyles}>
        {formattedCurrentTime} / {formattedDuration}
      </span>

      <!-- Spacer -->
      <div class={spacerStyles}></div>

      <!-- Fullscreen button -->
      <button
        class={controlButtonStyles}
        onclick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        type="button"
      >
        {#if isFullscreen}
          <svg viewBox="0 0 24 24">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>
