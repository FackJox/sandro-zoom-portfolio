<!--
  FilmOverviewSection.svelte

  Scroll-driven film showcase with overview → focus → overview cycle.
  Uses GSAP Flip for seamless layout transitions and TextPlugin for label scramble.

  Timing (36s scene per spec):
  - Portal buffer start: 0-5% (1.8s)
  - Film cycles: 5-95% (4 films × 8.1s each = 32.4s)
  - Portal buffer end: 95-100% (1.8s)

  Brand Physics:
  - brand-micro: 175ms (border changes)
  - brand-standard: 315ms (content animations)
  - brand-cinematic: 550ms (major transitions)

  Design: docs/plans/2025-01-07-film-overview-section-design.md
-->
<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger, Flip, ScrollToPlugin } from '$lib/core/gsap'
  import { DURATION } from '$lib/animation/easing'
  import { PORTAL_CONTEXT_KEY, type PortalSceneConfig } from '$lib/components/PortalContainer.svelte'
  import { VIDEOS } from '$lib/config/cdn'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import BorderedViewport from '../components/ui/BorderedViewport.svelte'
  import ContentSlab from '../components/ui/ContentSlab.svelte'
  import StepIndicator from '../components/ui/StepIndicator.svelte'
  import UIChrome from '../components/ui/UIChrome.svelte'
  import VideoThumbnail from '../components/ui/VideoThumbnail.svelte'
  import VideoPlayer from '../components/ui/VideoPlayer.svelte'

  // Get portal context for scene durations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  // Film project data
  interface FilmProject {
    id: string
    title: string
    client: string
    year: string
    description: string
    media: {
      type: 'youtube' | 'video' | 'image'
      // Full video sources (streamed on demand)
      src: string
      srcWebm?: string    // AV1/WebM optimized version
      srcHevc?: string    // HEVC/MP4 optimized version
      // Preview clip sources (auto-preloaded for thumbnails)
      previewSrc?: string
      previewSrcWebm?: string
      previewSrcHevc?: string
      // Poster image (first frame, immediate load)
      poster?: string
      // External link - opens in new tab when clicked in focus mode
      externalLink?: string
      // YouTube embed URL - shown in focus mode instead of video player
      youtubeEmbed?: string
    }
  }

  const films: FilmProject[] = [
    {
      id: '14-peaks',
      title: '14 PEAKS',
      client: 'NETFLIX',
      year: '2021',
      description: "I worked as lead cinematographer on Netflix's smash hit 14 Peaks. I shot most of the drone footage along with key scenes including the intro, Nims visiting his family and the K2 drama. I then worked as DOP on the first successful K2 winter expedition.",
      media: {
        type: 'video',
        src: '', // No full video - YouTube embed shown in focus mode
        poster: VIDEOS.netflix.poster,
        previewSrc: VIDEOS.netflix.preview.mp4,
        previewSrcWebm: VIDEOS.netflix.preview.webm,
        previewSrcHevc: VIDEOS.netflix.preview.hevc,
        youtubeEmbed: 'https://www.youtube.com/embed/8QH5hBOoz08'
      }
    },
    {
      id: 'no-days-off',
      title: 'NO DAYS OFF',
      client: 'REDBULL TV',
      year: '2022',
      description: "In 2022 I filmed episode 1 of Sasha DiGiulian's 'No Days Off' series for RedBull TV. During preparation for Petzl's RocTrip Sasha, Alex Megos, Steve McClure & Neil Gresham developed new routes in a remote and undeveloped corner of Greece's mainland.",
      media: {
        type: 'video',
        src: '', // No full video - external link shown in focus mode
        poster: VIDEOS.redbull.poster,
        previewSrc: VIDEOS.redbull.preview.mp4,
        previewSrcWebm: VIDEOS.redbull.preview.webm,
        previewSrcHevc: VIDEOS.redbull.preview.hevc,
        externalLink: 'https://www.redbull.com/us-en/episodes/no-days-off-s1-e1'
      }
    },
    {
      id: 'grace',
      title: 'GRACE',
      client: 'MONTANE',
      year: '2023',
      description: 'I directed, shot and edited the story of Grace, a recovering climber searching for a bigger life. Focusing on mental health and community the film was supported by Montane and played at film festivals world wide.',
      media: {
        type: 'video',
        // Full videos (streamed on demand)
        src: VIDEOS.grace.mp4,
        srcWebm: VIDEOS.grace.webm,
        srcHevc: VIDEOS.grace.hevc,
        // Preview clips (auto-preloaded)
        previewSrc: VIDEOS.grace.preview.mp4,
        previewSrcWebm: VIDEOS.grace.preview.webm,
        previewSrcHevc: VIDEOS.grace.preview.hevc,
        // Poster (immediate)
        poster: VIDEOS.grace.poster
      }
    },
    {
      id: 'afghanistan',
      title: 'AFGHANISTAN',
      client: 'CHARLES SCHWAB',
      year: '2019',
      description: 'Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m.',
      media: {
        type: 'video',
        // Full videos (streamed on demand)
        src: VIDEOS.shwab.mp4,
        srcWebm: VIDEOS.shwab.webm,
        srcHevc: VIDEOS.shwab.hevc,
        // Preview clips (auto-preloaded)
        previewSrc: VIDEOS.shwab.preview.mp4,
        previewSrcWebm: VIDEOS.shwab.preview.webm,
        previewSrcHevc: VIDEOS.shwab.preview.hevc,
        // Poster (immediate)
        poster: VIDEOS.shwab.poster
      }
    },
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let labelTextEl: HTMLSpanElement | null = $state(null)
  let ctx: gsap.Context | null = null
  let activeIndex = $state(0)
  let phase = $state<'overview' | 'focus' | 'transition'>('overview')

  // Store scroll range and ScrollTrigger reference for click-to-navigate
  let scrollRange = $state<{ start: number; end: number } | null>(null)
  let filmScrollTrigger: ScrollTrigger | null = null

  // Playback mode state - tracks which films are showing full video vs preview
  // 'preview' = showing preview clip, 'full' = showing full video player
  let filmPlaybackMode = $state<('preview' | 'full')[]>(films.map(() => 'preview'))

  // YouTube embed visibility state - tracks which films with youtubeEmbed are showing the embed
  let youtubeEmbedVisible = $state<boolean[]>(films.map(() => false))

  // Handler for full video requests from VideoThumbnail
  function handleRequestFullVideo(index: number) {
    filmPlaybackMode[index] = 'full'
  }

  // Handler for closing video player (return to preview)
  function handleCloseVideoPlayer(index: number) {
    filmPlaybackMode[index] = 'preview'
  }

  // Handler for YouTube embed play requests
  function handleShowYoutubeEmbed(index: number) {
    youtubeEmbedVisible[index] = true
  }

  // Handler for external link navigation (Redbull)
  function handleExternalLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Reset to preview mode when returning to overview state
  $effect(() => {
    if (phase === 'overview') {
      filmPlaybackMode = films.map(() => 'preview')
      youtubeEmbedVisible = films.map(() => false)
    }
  })

  // Derived state
  const currentFilm = $derived(films[activeIndex])
  const labelText = 'FILM'
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // Timeline proportions (component-level for access in onUpdate)
  const PORTAL_BUFFER = 0.05
  const ACTIVE_START = PORTAL_BUFFER
  const ACTIVE_END = 1 - PORTAL_BUFFER
  const ACTIVE_RANGE = ACTIVE_END - ACTIVE_START // 90%
  const FILM_RANGE = ACTIVE_RANGE / films.length // 22.5% each

  // Phase thresholds within each film's cycle (relative to FILM_RANGE)
  const PHASE_LAYOUT_SHIFT = 0.333
  const PHASE_LAYOUT_RESET = 0.667


  /**
   * Navigate to a specific film's details view by scrolling to its focus phase.
   *
   * ROBUST PATTERN: Use GSAP to animate the scroll position smoothly.
   * This allows the scrubbed ScrollTrigger to update properly as scroll changes,
   * avoiding issues with instant jumps that can confuse overlapping animations.
   *
   * Target: Middle of "reading time" (between CONTENT_ENTER and CONTENT_EXIT)
   * This ensures all focus animations have completed and ContentSlab is visible.
   */
  function navigateToFilm(index: number) {
    if (!scrollRange || index < 0 || index >= films.length) return

    // Calculate the scroll position for this film's focus/details phase
    // Film cycle starts at: ACTIVE_START + (index * FILM_RANGE)
    const filmCycleStart = ACTIVE_START + (index * FILM_RANGE)

    // Target the middle of "reading time" - when ContentSlab is fully visible
    // CONTENT_ENTER = 0.400, CONTENT_EXIT = 0.622
    // Middle = (0.400 + 0.622) / 2 = 0.511
    const CONTENT_ENTER = 0.400
    const CONTENT_EXIT = 0.622
    const readingTimeMidpoint = (CONTENT_ENTER + CONTENT_EXIT) / 2
    const targetProgress = filmCycleStart + (FILM_RANGE * readingTimeMidpoint)

    // Convert progress to absolute scroll position
    const sectionScrollRange = scrollRange.end - scrollRange.start
    const targetScroll = scrollRange.start + (targetProgress * sectionScrollRange)

    console.log(`[FilmOverview] NAVIGATE: to film ${index} details at scroll=${targetScroll.toFixed(0)}px (progress=${(targetProgress * 100).toFixed(1)}%)`)

    // Update state immediately for UI consistency
    activeIndex = index
    phase = 'focus'

    // Use GSAP to smoothly scroll to the target position
    // This allows the scrubbed timeline to update properly as scroll changes
    // Duration is short (0.5s) to feel responsive while being smooth enough for GSAP
    gsap.to(window, {
      scrollTo: { y: targetScroll, autoKill: false },
      duration: 0.5,
      ease: 'power2.out'
    })
  }

  // DIAGNOSTIC: Log phase and activeIndex changes with video sources
  $effect(() => {
    const videoSrc = currentFilm?.media?.src || 'none'
    console.log(`[FilmOverview] STATE_CHANGE: phase=${phase} activeIndex=${activeIndex} currentFilm=${currentFilm?.id} videoSrc=${videoSrc}`)
  })

  // Mobile detection
  let isMobile = $state(false)

  $effect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(max-width: 767px)')
    isMobile = mql.matches

    const handler = (e: MediaQueryListEvent) => {
      isMobile = e.matches
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  })

  // Cleanup
  onDestroy(() => {
    filmScrollTrigger?.kill()
    filmScrollTrigger = null
    ctx?.revert()
  })

  /**
   * Build the scroll-driven timeline for film overview transitions.
   * Uses GSAP Flip for seamless layout transitions between overview and focus states.
   *
   * Brand Physics durations (as proportions of 36s scene):
   * - brand-micro: 0.175s / 36s ≈ 0.0049
   * - brand-standard: 0.315s / 36s ≈ 0.0088
   * - brand-cinematic: 0.55s / 36s ≈ 0.0153
   *
   * Structure:
   * - 0-5%: Portal in buffer + initial fadeIn
   * - 5-95%: 4 film cycles (22.5% each)
   * - 95-100%: Portal out buffer
   */
  function buildFilmTimeline(container: HTMLElement, mobile: boolean): gsap.core.Timeline {
    const tl = gsap.timeline()

    const filmFrames = container.querySelectorAll('[data-film]') as NodeListOf<HTMLElement>
    const focusLayout = container.querySelector('[data-focus-layout]') as HTMLElement
    const contentSlabContainer = container.querySelector('[data-content-slab-container]') as HTMLElement
    const contentSlab = container.querySelector('[data-content-slab]') as HTMLElement
    const overviewGrid = container.querySelector('[data-overview-grid]') as HTMLElement
    const labelTextElement = container.querySelector('[data-section-label-text]') as HTMLElement

    // Log film data for video source verification
    console.log(`[FilmOverview] buildFilmTimeline - filmCount=${filmFrames.length} mobile=${mobile}`)
    films.forEach((film, i) => {
      console.log(`[FilmOverview] Film data ${i}: id=${film.id} video=${film.media.src}`)
    })

    // --- FLIP TRANSFORM CALCULATION ---
    // Measure target position (focus video viewport) for the flip animation.
    // Focus layout uses visibility:hidden (not display:none), so it's laid out and measurable.
    const focusVideoEl = container.querySelector('[data-focus-video]') as HTMLElement
    const targetViewport = focusVideoEl?.querySelector('[data-bordered-viewport]') as HTMLElement
    const targetRect = targetViewport?.getBoundingClientRect()

    const flipData: { x: number; y: number; scaleX: number; scaleY: number }[] = []
    filmFrames.forEach((frame) => {
      const srcViewport = frame.querySelector('[data-bordered-viewport]') as HTMLElement
      if (srcViewport && targetRect) {
        const srcRect = srcViewport.getBoundingClientRect()
        flipData.push({
          x: targetRect.left - srcRect.left,
          y: targetRect.top - srcRect.top,
          scaleX: targetRect.width / srcRect.width,
          scaleY: targetRect.height / srcRect.height,
        })
      } else {
        flipData.push({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
      }
    })
    console.log('[FilmOverview] FLIP_DATA:', flipData.map((d, i) =>
      `film${i}: x=${d.x.toFixed(0)} y=${d.y.toFixed(0)} scaleX=${d.scaleX.toFixed(2)} scaleY=${d.scaleY.toFixed(2)}`
    ).join(' | '))

    // Timeline proportions (0-1)
    const PORTAL_BUFFER = 0.05 // 5% at start and end for portal transitions
    const ACTIVE_START = PORTAL_BUFFER
    const ACTIVE_END = 1 - PORTAL_BUFFER
    const ACTIVE_RANGE = ACTIVE_END - ACTIVE_START // 90%

    // Each film gets equal share of active range
    const FILM_RANGE = ACTIVE_RANGE / films.length // 22.5% each

    // Brand Physics durations as proportions (36s scene per spec)
    const SCENE_DURATION = 36 // seconds
    const MICRO = DURATION.micro / SCENE_DURATION
    const STANDARD = DURATION.standard / SCENE_DURATION
    const CINEMATIC = DURATION.cinematic / SCENE_DURATION

    // Initialize all elements - start with opacity 0 for fadeIn
    filmFrames.forEach((frame, i) => {
      gsap.set(frame, { autoAlpha: 0, scale: 0.95, y: 0, x: 0 })
    })

    // Focus layout visibility is controlled by Svelte state (phase === 'focus')
    // Focus VIDEO opacity is controlled by GSAP via CSS variable --focus-video-opacity
    // This ensures perfect sync with the card crossfade in both scroll directions.
    if (focusLayout) {
      gsap.set(focusLayout, { '--focus-video-opacity': 0 })
    }

    // Initialize content slab within focus layout (offset for enter animation)
    if (contentSlab) {
      gsap.set(contentSlab, {
        autoAlpha: 0,
        x: mobile ? 0 : 40,
        y: mobile ? 30 : 0
      })
    }

    // INITIAL FADE IN - Should complete right as portal transition finishes
    // Portal transition occupies first 5% of scroll, fadeIn should sync with it
    // Start fadeIn partway through portal so films are visible when portal completes
    const FADE_IN_START = PORTAL_BUFFER - CINEMATIC // Start early so it completes at 5%

    // Film cycle phases (relative to film's range)
    // Based on spec: 9s cycle with specific timings
    // See: docs/plans/2025-01-07-film-overview-section-design.md
    const PHASES = {
      HOLD_START: 0.03,        // Brief hold before animations start
      BORDER_FADE: 0.089,      // 0.8s/9s - Border accent change
      OTHERS_EXIT: 0.200,      // 1.8s/9s - Others start shrinking (delayed to let dimming breathe)
      LABEL_SCRAMBLE: 0.267,   // 2.4s/9s - Label text scramble
      LAYOUT_SHIFT: 0.333,     // 3.0s/9s - Layout transition begins (pushed later for dimming visibility)
      CROSSFADE_IN: 0.367,     // 3.3s/9s - Crossfade thumbnail → video player
      CONTENT_ENTER: 0.400,    // 3.6s/9s - Content slab enters
      // HOLD for reading: 3.6s - 5.6s = 2s reading time
      CONTENT_EXIT: 0.622,     // 5.6s/9s - Content starts leaving
      CROSSFADE_OUT: 0.640,    // 5.8s/9s - Crossfade video player → thumbnail
      LAYOUT_RESET: 0.667,     // 6.0s/9s - Return to overview
      OTHERS_RETURN: 0.700,    // 6.3s/9s - Others fade back in
      LABEL_RESET: 0.778,      // 7.0s/9s - Label back to "FILM"
      ACCENT_SHIFT: 0.800,     // 7.2s/9s - Prepare for next film
    }


    filmFrames.forEach((frame, i) => {
      tl.to(frame, {
        autoAlpha: 1,
        scale: 1,
        duration: CINEMATIC,
        ease: 'ease-lock-on',
      }, Math.max(0.01, FADE_IN_START) + (i * 0.002)) // Slight stagger
    })

    // Build animation for each film
    films.forEach((film, filmIndex) => {
      const cycleStart = ACTIVE_START + (filmIndex * FILM_RANGE)
      const cycleEnd = cycleStart + FILM_RANGE
      const currentFrame = filmFrames[filmIndex] as HTMLElement
      const otherFrames = Array.from(filmFrames).filter((_, i) => i !== filmIndex) as HTMLElement[]

      const currentBorder = currentFrame?.querySelector('[data-bordered-viewport]') as HTMLElement
      const otherBorders = otherFrames.map(f => f.querySelector('[data-bordered-viewport]') as HTMLElement)

      // Convert phase to absolute timeline position
      const pos = (p: number) => cycleStart + (p * FILM_RANGE)

      // PHASE 1: Border accent to current film
      if (currentBorder) {
        tl.to(currentBorder, {
          borderColor: '#f6c605',
          duration: MICRO,
          ease: 'ease-lock-on',
        }, pos(PHASES.BORDER_FADE))
      }

      // Dim other borders
      otherBorders.forEach(border => {
        if (border) {
          tl.to(border, {
            borderColor: '#707977',
            duration: MICRO,
            ease: 'ease-lock-on',
          }, pos(PHASES.BORDER_FADE))
        }
      })

      // Slightly dim other thumbnails to emphasize highlighted film
      otherFrames.forEach(frame => {
        tl.to(frame, {
          autoAlpha: 0.45,
          duration: STANDARD,
          ease: 'ease-lock-on',
          immediateRender: false,
          overwrite: 'auto',
        }, pos(PHASES.BORDER_FADE))
      })

      // PHASE 2: Others exit with scale and fade
      otherFrames.forEach(frame => {
        tl.to(frame, {
          scale: 0.9,
          autoAlpha: 0,
          duration: CINEMATIC,
          ease: 'ease-release',
        }, pos(PHASES.OTHERS_EXIT))
      })

      // PHASE 4: FLIP — Active card transforms from grid position to focus video position
      // Brand Physics: "Zoom is the Primary Verb" — this IS the camera push-in
      // The overview grid gets elevated above the focus layout (z:25 > z:20) so
      // the card visually covers the focus video area during the transform.
      // Non-active cards are already faded out. The grid is transparent, so the
      // content slab in the focus layout (z:20) shows through.

      // Elevate overview grid above focus layout for the flip
      // pointer-events:none so the grid doesn't block content slab interaction
      tl.set(overviewGrid, { zIndex: 25, pointerEvents: 'none' }, pos(PHASES.LAYOUT_SHIFT))

      // Set transform origin to top-left for clean position+scale math
      tl.set(currentFrame, { transformOrigin: 'top left' }, pos(PHASES.LAYOUT_SHIFT))

      // Animate card to focus video position
      tl.to(currentFrame, {
        x: flipData[filmIndex].x,
        y: flipData[filmIndex].y,
        scaleX: flipData[filmIndex].scaleX,
        scaleY: flipData[filmIndex].scaleY,
        duration: CINEMATIC,
        ease: 'ease-lock-on',
      }, pos(PHASES.LAYOUT_SHIFT))

      // Fade out overlay (title/client) — ContentSlab replaces this info
      const currentOverlay = currentFrame.querySelector('[data-film-overlay]') as HTMLElement
      if (currentOverlay) {
        tl.to(currentOverlay, {
          autoAlpha: 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.LAYOUT_SHIFT))
      }

      // CROSSFADE: Card arrived → fade card out, fade focus video in.
      // ROBUST PATTERN: Both opacities driven by the same scrubbed timeline
      // with LINEAR easing so they always sum to 1.0 in both scroll directions.
      // Non-linear easings cause opacity dips (both near 0) when reversed.
      const flipEndAbs = pos(PHASES.LAYOUT_SHIFT) + CINEMATIC
      tl.to(currentFrame, {
        autoAlpha: 0,
        duration: STANDARD,
        ease: 'none',
      }, flipEndAbs)
      tl.to(focusLayout, {
        '--focus-video-opacity': 1,
        duration: STANDARD,
        ease: 'none',
      }, flipEndAbs)

      // PHASE 5: Content slab enters
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.CONTENT_ENTER))
      }

      // PHASE 6: Content slab exits
      if (contentSlab) {
        tl.to(contentSlab, {
          autoAlpha: 0,
          x: mobile ? 0 : 40,
          y: mobile ? 30 : 0,
          duration: STANDARD,
          ease: 'ease-release',
        }, pos(PHASES.CONTENT_EXIT))
      }

      // CROSSFADE BACK: Fade focus video out, fade card in before flip-back.
      // LINEAR easing ensures opacities sum to 1.0 — no gaps or flashes
      // when scrubbing in either direction.
      const flipBackAbs = pos(PHASES.LAYOUT_RESET)
      tl.to(focusLayout, {
        '--focus-video-opacity': 0,
        duration: STANDARD,
        ease: 'none',
      }, flipBackAbs - STANDARD)
      tl.to(currentFrame, {
        autoAlpha: 1,
        duration: STANDARD,
        ease: 'none',
      }, flipBackAbs - STANDARD)

      // PHASE 7: FLIP BACK — Active card returns from focus position to grid
      // Brand Physics: "ease-release" for departing — controlled release back to overview

      // Animate card back to original grid position
      tl.to(currentFrame, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: CINEMATIC,
        ease: 'ease-release',
      }, pos(PHASES.LAYOUT_RESET))

      // Restore overlay (title/client)
      if (currentOverlay) {
        tl.to(currentOverlay, {
          autoAlpha: 1,
          duration: STANDARD,
          ease: 'ease-lock-on',
        }, pos(PHASES.LAYOUT_RESET))
      }

      // Reset transform origin, z-index AFTER flip-back completes.
      // Must happen after pos(LAYOUT_RESET) + CINEMATIC, not mid-flip.
      // Changing transformOrigin while scaleX/scaleY ≠ 1 causes visual jumps.
      const flipBackEndAbs = pos(PHASES.LAYOUT_RESET) + CINEMATIC
      tl.set(currentFrame, { transformOrigin: 'center center' }, flipBackEndAbs + 0.001)
      tl.set(overviewGrid, { zIndex: 'auto', pointerEvents: 'auto' }, flipBackEndAbs + 0.001)

      // Fade in OTHER film frames (overview thumbnails return)
      // Current frame is excluded — its return is handled by the crossfade-back + flip-back sequence.
      // Including it here would create overlapping tweens that record mid-flip "from" values,
      // causing position jumps when reversed.
      otherFrames.forEach((frame) => {
        tl.to(frame, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          x: 0,
          duration: CINEMATIC,
          ease: 'ease-lock-on',
        }, pos(PHASES.OTHERS_RETURN))
      })

      // PHASE 10: Accent shift to next film OR completion for last film
      if (filmIndex < films.length - 1) {
        // Not last film: shift accent to next
        const nextFrame = filmFrames[filmIndex + 1] as HTMLElement
        const nextBorder = nextFrame?.querySelector('[data-bordered-viewport]') as HTMLElement

        if (currentBorder) {
          tl.to(currentBorder, {
            borderColor: '#707977',
            duration: MICRO,
            ease: 'ease-release',
          }, pos(PHASES.ACCENT_SHIFT))
        }

        if (nextBorder) {
          tl.to(nextBorder, {
            borderColor: '#f6c605',
            duration: MICRO,
            ease: 'ease-lock-on',
          }, pos(PHASES.ACCENT_SHIFT))
        }
      } else {
        // Last film: completion animation - prepare for portal exit

        // Fade current border to phantom
        if (currentBorder) {
          tl.to(currentBorder, {
            borderColor: '#707977',
            duration: STANDARD,
            ease: 'ease-release',
          }, pos(PHASES.ACCENT_SHIFT))
        }

        // Slight scale down on all films to hint section ending
        filmFrames.forEach(frame => {
          tl.to(frame, {
            scale: 0.98,
            duration: CINEMATIC,
            ease: 'ease-release',
          }, pos(PHASES.ACCENT_SHIFT))
        })
      }
    })

    // Extend timeline to exactly 1.0 so self.progress (0-1) maps 1:1 to timeline positions.
    // Without this, the timeline ends at ~0.93, causing progress-to-position drift that
    // grows with each film — the phase state races ahead of the GSAP animations,
    // flipping to 'focus' before dimming/shrinking effects have played.
    tl.add(() => {}, 1.0)

    // DEBUG: Log film cycle timeline positions summary
    console.log(`[FilmOverview] ═══════════════════════════════════════════════════════════════════`)
    console.log(`[FilmOverview] TIMELINE SUMMARY (totalDuration=${tl.duration().toFixed(4)}s)`)
    console.log(`[FilmOverview] ───────────────────────────────────────────────────────────────────`)
    films.forEach((film, i) => {
      const cycleStart = ACTIVE_START + (i * FILM_RANGE)
      const cycleEnd = cycleStart + FILM_RANGE
      const pos = (p: number) => cycleStart + (p * FILM_RANGE)
      console.log(`[FilmOverview] Film ${i} (${film.id.padEnd(12)}): cycle=${(cycleStart * 100).toFixed(1).padStart(5)}%-${(cycleEnd * 100).toFixed(1).padStart(5)}% | focus_at=${(pos(PHASES.LAYOUT_SHIFT) * 100).toFixed(1)}% | overview_at=${(pos(PHASES.LABEL_RESET) * 100).toFixed(1)}%`)
    })
    console.log(`[FilmOverview] ═══════════════════════════════════════════════════════════════════`)

    return tl
  }

  // Initialize and connect to ScrollTrigger
  onMount(() => {
    if (!containerEl) return

    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) {
      console.warn('[FilmOverview] No portal container found')
      return
    }

    const viewport = portalContainer.querySelector('[style*="position: fixed"]')
    if (!viewport) {
      console.warn('[FilmOverview] No viewport found')
      return
    }

    const allScenes = viewport.querySelectorAll('[data-scene]')
    let sectionIndex = -1
    allScenes.forEach((scene, i) => {
      if (scene === containerEl) sectionIndex = i
    })

    if (sectionIndex < 0) {
      console.warn('[FilmOverview] Section not found in scenes')
      return
    }

    // Use portal context for variable scene durations if available
    let sectionStart: number
    let sectionEnd: number

    if (portalConfig && portalConfig.durations.length > 0) {
      // Use context-provided durations
      const startTimes = portalConfig.startTimes
      const durations = portalConfig.durations
      sectionStart = startTimes[sectionIndex] * portalConfig.scrollSpeed
      sectionEnd = (startTimes[sectionIndex] + durations[sectionIndex]) * portalConfig.scrollSpeed
    } else {
      // Fallback to equal distribution
      const totalHeight = portalContainer.scrollHeight - window.innerHeight
      const sceneCount = allScenes.length
      const sceneHeight = totalHeight / sceneCount
      sectionStart = sectionIndex * sceneHeight
      sectionEnd = (sectionIndex + 1) * sceneHeight
    }

    console.log(`[FilmOverview] INIT: scrollRange=${sectionStart.toFixed(0)}px-${sectionEnd.toFixed(0)}px (${(sectionEnd - sectionStart).toFixed(0)}px)`)

    // Store scroll range for click-to-navigate
    scrollRange = { start: sectionStart, end: sectionEnd }

    const isMobileNow = typeof window !== 'undefined'
      && window.matchMedia('(max-width: 767px)').matches

    ctx = gsap.context(() => {
      const tl = buildFilmTimeline(containerEl!, isMobileNow)


      const scrollLength = sectionEnd - sectionStart
      filmScrollTrigger = ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `+=${scrollLength}`,
        scrub: 1,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          const progress = self.progress

          // Derive activeIndex from scroll position (direction-agnostic)
          if (progress >= ACTIVE_START && progress < ACTIVE_END) {
            const newIndex = Math.min(
              films.length - 1,
              Math.floor((progress - ACTIVE_START) / FILM_RANGE)
            )
            if (newIndex !== activeIndex) {
              const prevIndex = activeIndex
              activeIndex = newIndex
              console.log(`[FilmOverview] ACTIVE_INDEX_DERIVED: ${prevIndex} → ${newIndex} at progress=${(progress * 100).toFixed(1)}%`)
            }
          }

          // Derive phase from position within film's cycle
          const cycleOffset = (progress - ACTIVE_START) % FILM_RANGE
          const cycleProgress = cycleOffset / FILM_RANGE
          const newPhase = (cycleProgress >= PHASE_LAYOUT_SHIFT && cycleProgress < PHASE_LAYOUT_RESET)
            ? 'focus'
            : 'overview'
          if (newPhase !== phase) {
            const prevPhase = phase
            phase = newPhase
            console.log(`[FilmOverview] PHASE_DERIVED: ${prevPhase} → ${newPhase} at progress=${(progress * 100).toFixed(1)}% cycleProgress=${(cycleProgress * 100).toFixed(1)}%`)
          }

          // Log every 5% progress
          const progressPct = Math.round(progress * 100)
          const direction = self.direction === 1 ? 'FWD' : 'BWD'
          if (progressPct % 5 === 0) {
            console.log(`[FilmOverview] SCROLL: ${direction} progress=${progressPct}% activeIndex=${activeIndex} phase=${phase}`)
          }
        },
        onEnter: () => console.log(`[FilmOverview] ENTER scroll=${window.scrollY}px`),
        onLeave: () => console.log(`[FilmOverview] LEAVE scroll=${window.scrollY}px`),
        onEnterBack: () => console.log(`[FilmOverview] ENTER_BACK scroll=${window.scrollY}px`),
        onLeaveBack: () => console.log(`[FilmOverview] LEAVE_BACK scroll=${window.scrollY}px`),
      })
    }, containerEl)
  })

  // Styles
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  // Overview grid styles - transforms during focus
  // Mobile: Uses width-constrained cards so 16:9 aspect ratio fits viewport height
  const overviewGridStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5rem',
    padding: '12vh 8vw',
    alignItems: 'center',
    alignContent: 'center',

    // Tablet (768-1023px) - 2x2 grid for better visibility
    '@media (max-width: 1023px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.25rem',
      padding: '12vh 6vw',
    },

    // Mobile (<768px) - viewport-fit single column
    // Cards sized to maximize space while fitting all 4 + UI chrome
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '0.625rem', // 10px gaps × 3 = 30px total
      // Padding: 72px top (label + breathing room) + 88px bottom (step indicator + breathing room)
      padding: '72px 4vw 88px',
      alignContent: 'center',
      justifyItems: 'center',
    },
  })

  const filmFrameStyles = css({
    position: 'relative',
    width: '100%',
    transformOrigin: 'center center',
    cursor: 'pointer',

    // Mobile: constrain WIDTH so 16:9 aspect ratio fits viewport height
    // Math: available_height = 100vh - 72px - 88px - 30px = 100vh - 190px
    // Per card height = available / 4
    // Width = height × (16/9) = (100vh - 190px) / 4 × 1.778
    // Simplified: ≈ 44.4vh - 84px, capped at 92% viewport width
    '@media (max-width: 767px)': {
      width: 'min(92%, calc(44.4vh - 84px))',
    },
  })

  // Layered media container - holds both thumbnail and video player
  const mediaLayerContainerStyles = css({
    position: 'relative',
    width: '100%',
  })

  // Thumbnail layer - visible in overview, fades out in focus
  // Positioned absolute to fill the BorderedViewport
  const thumbnailLayerStyles = css({
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    '& img, & video': {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })

  // Video player layer - hidden initially, fades in during focus
  // Positioned absolute above thumbnail for proper crossfade
  const videoPlayerLayerStyles = css({
    position: 'absolute',
    inset: '0',
    zIndex: '2',
    opacity: '0',
    visibility: 'hidden',
    '& iframe, & video, & a': {
      display: 'block',
      width: '100%',
      height: '100%',
      border: 'none',
    },
    '& a img': {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })

  // Play overlay for external links (images with external video)
  const playOverlayStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
  })

  const externalLinkStyles = css({
    display: 'block',
    position: 'relative',
    width: '100%',
    height: '100%',
  })

  // Preview with play button container - for layering thumbnail and button
  const previewWithPlayStyles = css({
    position: 'relative',
    width: '100%',
    height: '100%',
  })

  // Egg roll play button styles - always visible variant for focus mode
  const focusPlayButtonVisibleStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    opacity: '1',
    transition: 'background-color 175ms ease-out',
    zIndex: '20',
    '&:hover': {
      backgroundColor: 'rgba(15, 23, 26, 0.4)',
    },
    '&:focus-visible': {
      outline: '1.5px solid',
      outlineColor: 'brand.accent',
      outlineOffset: '-1.5px',
    },
  })

  const eggRollContainerStyles = css({
    position: 'relative',
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
    transition: 'transform 175ms ease-out',
    'button:hover &': {
      transform: 'scale(1.08)',
    },
  })

  const eggRollTriangleStyles = css({
    width: '24px',
    height: '24px',
    marginLeft: '3px',
    fill: 'brand.accent',
  })

  const overlayStyles = css({
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '1.25rem 1rem 0.875rem',
    // Enhanced gradient: stronger vignette for reliable text legibility
    background: `linear-gradient(
      to top,
      rgba(15, 23, 26, 0.98) 0%,
      rgba(15, 23, 26, 0.85) 40%,
      rgba(15, 23, 26, 0.4) 70%,
      rgba(15, 23, 26, 0) 100%
    )`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    zIndex: '10', // Above thumbnail and video layers

    // Compact overlay for mobile
    '@media (max-width: 767px)': {
      padding: '0.875rem 0.75rem 0.625rem',
    },
  })

  const filmTitleStyles = css({
    fontFamily: 'IBM Plex Sans Condensed, sans-serif',
    fontWeight: '700',
    fontSize: '1rem',
    letterSpacing: '0.05em',
    // Egg Toast yellow - the "danger" accent that slices through imagery
    color: '#f6c605',
    textTransform: 'uppercase',

    '@media (max-width: 767px)': {
      fontSize: '0.875rem',
    },
  })

  const filmClientStyles = css({
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontWeight: '500',
    fontSize: '0.6875rem',
    letterSpacing: '0.12em',
    // Tradewind - lighter support tone for visibility while staying subordinate
    color: '#b7c6cc',
    textTransform: 'uppercase',
  })

  // Focus layout grid - 60/40 split on desktop, stacked on tablet/mobile
  // NOTE: Visibility is controlled by Svelte state (phase === 'focus') instead of GSAP
  // because GSAP scrubbed timelines don't handle overlapping animations correctly when jumping
  const focusLayoutStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'grid',
    gridTemplateColumns: '3fr 2fr', // 60% / 40% split
    gap: '2rem',
    padding: '12vh 8vw',
    alignItems: 'center',
    // Solid background to cover the overview grid thumbnails beneath
    backgroundColor: 'brand.bg',
    // Visibility controlled by inline style based on phase state
    // No CSS transition — syncs with scroll-driven flip animation
    zIndex: '20',
    overflow: 'visible', // Ensure content doesn't get clipped

    // Large tablet (1024-1279px) - slightly adjusted proportions
    '@media (max-width: 1279px)': {
      gridTemplateColumns: '1.2fr 1fr', // 55% / 45% on large tablet
      gap: '1.5rem',
      padding: '12vh 6vw',
    },

    // Small tablet (768-1023px) - stack vertically for better readability
    '@media (max-width: 1023px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto',
      gap: '1.5rem',
      padding: '12vh 6vw 16vh',
      alignContent: 'center',
    },

    // Mobile (<768px) - stacked, matching overview padding for smooth transitions
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto auto',
      gap: '1rem',
      // Match overview padding exactly to prevent position shifts
      padding: '72px 4vw 88px',
      alignContent: 'center',
      overflow: 'auto',
    },
  })

  // Focus video container - holds the video in focus state
  const focusVideoContainerStyles = css({
    position: 'relative',
    width: '100%',
  })

  // Content slab container - inside focus layout grid
  const contentSlabContainerStyles = css({
    position: 'relative',
    width: '100%',
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film-overview">
  <!-- Overview Grid (transforms during focus) -->
  <div class={overviewGridStyles} data-overview-grid data-slide-group="nearest-edge" data-slide-group-mobile="alternating-h">
    {#each films as film, i}
      <div
        class={filmFrameStyles}
        data-film={film.id}
        data-index={i}
        data-animate="slide"
        onclick={() => navigateToFilm(i)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToFilm(i) } }}
        role="button"
        tabindex="0"
        aria-label="View {film.title}"
      >
        <BorderedViewport aspectRatio="16/9">
          <!-- Thumbnail Layer - uses VideoThumbnail for smart loading (video types) -->
          <div class={thumbnailLayerStyles} data-thumbnail>
            {#if film.media.type === 'youtube'}
              <!-- YouTube: Use YT thumbnail, no preview/full video logic -->
              <img
                src={film.media.poster || `https://img.youtube.com/vi/${film.media.src.split('/').pop()}/maxresdefault.jpg`}
                alt={film.title}
              />
            {:else if film.media.type === 'video'}
              <!-- Local video: Use VideoThumbnail with poster → preview -->
              <VideoThumbnail
                poster={film.media.poster}
                previewSrc={film.media.previewSrc}
                previewSrcWebm={film.media.previewSrcWebm}
                previewSrcHevc={film.media.previewSrcHevc}
                alt={film.title}
                mode="preview"
              />
            {:else if film.media.type === 'image'}
              <!-- Image with optional external link -->
              {#if film.media.externalLink}
                <a href={film.media.externalLink} target="_blank" rel="noopener noreferrer" class={externalLinkStyles}>
                  <img src={film.media.src} alt={film.title} />
                  <div class={playOverlayStyles}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </a>
              {:else}
                <img src={film.media.src} alt={film.title} />
              {/if}
            {/if}
          </div>
        </BorderedViewport>
        <!-- Overlay: Title + Client (hidden during focus, ContentSlab shows info) -->
        <div class={overlayStyles} data-film-overlay>
          <span class={filmTitleStyles}>{film.title}</span>
          <span class={filmClientStyles}>{film.client}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Focus Layout Grid (appears during focus state) -->
  <!-- Visibility controlled by Svelte state, not GSAP, for reliable click navigation -->
  <div
    class={focusLayoutStyles}
    data-focus-layout
    style:opacity={phase === 'focus' ? 1 : 0}
    style:visibility={phase === 'focus' ? 'visible' : 'hidden'}
    style:pointer-events={phase === 'focus' ? 'auto' : 'none'}
  >
    <!-- Video Container - keyed by activeIndex to force video element recreation -->
    {#key activeIndex}
    <div class={focusVideoContainerStyles} data-focus-video style="opacity: var(--focus-video-opacity, 0);">
      <BorderedViewport aspectRatio="16/9">
        <!-- Render current film's video content (focus state) -->
        {#if currentFilm.media.type === 'youtube'}
          <iframe
            src={currentFilm.media.src}
            title={currentFilm.title}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else if currentFilm.media.type === 'video'}
          <!-- Video type with special handling for YouTube embed or external link -->
          {#if currentFilm.media.youtubeEmbed}
            <!-- YouTube embed in focus mode (Netflix) - preview first, then embed -->
            {#if youtubeEmbedVisible[activeIndex]}
              <iframe
                src={currentFilm.media.youtubeEmbed + '?autoplay=1'}
                title={currentFilm.title}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            {:else}
              <!-- Preview with always-visible play button -->
              <div class={previewWithPlayStyles}>
                <VideoThumbnail
                  poster={currentFilm.media.poster}
                  previewSrc={currentFilm.media.previewSrc}
                  previewSrcWebm={currentFilm.media.previewSrcWebm}
                  previewSrcHevc={currentFilm.media.previewSrcHevc}
                  alt={currentFilm.title}
                  mode="preview"
                />
                <button
                  class={focusPlayButtonVisibleStyles}
                  onclick={() => handleShowYoutubeEmbed(activeIndex)}
                  aria-label="Play video on YouTube"
                  type="button"
                >
                  <div class={eggRollContainerStyles}>
                    <svg class={eggRollTriangleStyles} viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </button>
              </div>
            {/if}
          {:else if currentFilm.media.externalLink}
            <!-- External link in focus mode (Redbull) - preview with play button that navigates -->
            <div class={previewWithPlayStyles}>
              <VideoThumbnail
                poster={currentFilm.media.poster}
                previewSrc={currentFilm.media.previewSrc}
                previewSrcWebm={currentFilm.media.previewSrcWebm}
                previewSrcHevc={currentFilm.media.previewSrcHevc}
                alt={currentFilm.title}
                mode="preview"
              />
              <button
                class={focusPlayButtonVisibleStyles}
                onclick={() => handleExternalLink(currentFilm.media.externalLink!)}
                aria-label="Watch on RedBull TV"
                type="button"
              >
                <div class={eggRollContainerStyles}>
                  <svg class={eggRollTriangleStyles} viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </button>
            </div>
          {:else}
            <!-- Standard video (Afghanistan, Grace) with full VideoPlayer -->
            {#if filmPlaybackMode[activeIndex] === 'full'}
              <!-- Full video player with controls -->
              <VideoPlayer
                poster={currentFilm.media.poster}
                src={currentFilm.media.src}
                srcWebm={currentFilm.media.srcWebm}
                srcHevc={currentFilm.media.srcHevc}
                alt={currentFilm.title}
                onClose={() => handleCloseVideoPlayer(activeIndex)}
              />
            {:else}
              <!-- Preview with prominent play button -->
              <VideoThumbnail
                poster={currentFilm.media.poster}
                previewSrc={currentFilm.media.previewSrc}
                previewSrcWebm={currentFilm.media.previewSrcWebm}
                previewSrcHevc={currentFilm.media.previewSrcHevc}
                fullSrc={currentFilm.media.src}
                fullSrcWebm={currentFilm.media.srcWebm}
                fullSrcHevc={currentFilm.media.srcHevc}
                alt={currentFilm.title}
                mode="preview"
                showPlayButton={true}
                onRequestFullVideo={() => handleRequestFullVideo(activeIndex)}
              />
            {/if}
          {/if}
        {:else if currentFilm.media.type === 'image'}
          {#if currentFilm.media.externalLink}
            <a href={currentFilm.media.externalLink} target="_blank" rel="noopener noreferrer" class={externalLinkStyles}>
              <img src={currentFilm.media.src} alt={currentFilm.title} />
              <div class={playOverlayStyles}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </a>
          {:else}
            <img src={currentFilm.media.src} alt={currentFilm.title} />
          {/if}
        {/if}
      </BorderedViewport>
    </div>

    <!-- Content Slab Container -->
    <div class={contentSlabContainerStyles} data-content-slab-container>
      <div data-content-slab>
        <ContentSlab
          eyebrow={currentFilm.client}
          title={currentFilm.title}
          description={currentFilm.description}
          year={currentFilm.year}
        />
      </div>
    </div>
    {/key}
  </div>

  <!-- UI Chrome - consistent positioning across all viewports -->
  <UIChrome>
    {#snippet topLeft()}
      <SectionLabel text={labelText} bind:textRef={labelTextEl} />
    {/snippet}

    {#snippet bottomCenter()}
      <StepIndicator
        {steps}
        {activeIndex}
        showLabels={true}
        onSelect={navigateToFilm}
      />
    {/snippet}
  </UIChrome>
</div>
