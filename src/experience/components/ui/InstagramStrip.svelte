<!--
  InstagramStrip.svelte

  Horizontal scrolling Instagram feed strip for contact/footer area.
  Displays recent posts from @sandro.g.h with Alpine Noir styling.

  Design: docs/plans/2026-02-04-instagram-feed-strip-design.md
  Brand: docs/Brand Design System.md
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import { css } from '$styled/css'
  import type { InstagramPost, InstagramFeedResponse } from '$lib/api/instagram'

  // State
  let posts = $state<InstagramPost[]>([])
  let loading = $state(true)
  let error = $state<string | null>(null)

  // Fetch posts on mount
  onMount(async () => {
    try {
      const response = await fetch('/api/instagram/feed')
      const data: InstagramFeedResponse = await response.json()
      posts = data.posts
    } catch (e) {
      console.error('[InstagramStrip] Failed to fetch posts:', e)
      error = e instanceof Error ? e.message : 'Failed to load'
    } finally {
      loading = false
    }
  })

  // Don't render anything if no posts and not loading
  const shouldRender = $derived(loading || posts.length > 0)

  // Styles
  const containerStyles = css({
    position: 'relative',
    width: '100%',
    backgroundColor: '#20292b',
    borderTop: '1.5px solid #707977',
    padding: 'clamp(48px, 8vh, 80px) 0',
  })

  const headerStyles = css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 clamp(16px, 4vw, 48px)',
    marginBottom: '1.5rem',
  })

  const labelStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#c0bfb6',
  })

  const followLinkStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.65rem',
    fontWeight: '500',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#f6c605',
    textDecoration: 'none',
    transition: 'opacity 175ms ease',

    '&:hover': {
      opacity: '0.8',
    },
  })

  const scrollContainerStyles = css({
    display: 'flex',
    gap: '1.5rem',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    padding: '0 clamp(16px, 4vw, 48px)',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },

    '@media (max-width: 767px)': {
      gap: '1rem',
    },
  })

  const postStyles = css({
    flexShrink: '0',
    width: 'clamp(140px, 18vw, 200px)',
    aspectRatio: '1 / 1',
    scrollSnapAlign: 'start',
    position: 'relative',
    overflow: 'hidden',
    border: '1.5px solid #707977',
    transition: 'border-color 175ms ease, transform 175ms ease',
    cursor: 'pointer',

    '&:hover': {
      borderColor: '#f6c605',
      transform: 'scale(1.02)',
    },

    '@media (max-width: 767px)': {
      width: 'clamp(120px, 35vw, 160px)',
    },
  })

  const imageStyles = css({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'saturate(0.85) contrast(1.05)',
  })

  const grainOverlayStyles = css({
    position: 'absolute',
    inset: '0',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    opacity: '0.04',
    pointerEvents: 'none',
    mixBlendMode: 'overlay',
  })

  const videoIndicatorStyles = css({
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    color: 'white',
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
  })
</script>

<style>
  /* Global keyframes for skeleton pulse animation */
  @keyframes instagram-skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }

  .skeleton {
    flex-shrink: 0;
    width: clamp(140px, 18vw, 200px);
    aspect-ratio: 1 / 1;
    background-color: #464f4c;
    animation: instagram-skeleton-pulse 1.5s ease-in-out infinite;
  }

  @media (max-width: 767px) {
    .skeleton {
      width: clamp(120px, 35vw, 160px);
    }
  }
</style>

{#if shouldRender}
  <div class={containerStyles}>
    <!-- Header -->
    <div class={headerStyles}>
      <span class={labelStyles}>Field</span>
      <a
        href="https://instagram.com/sandro.g.h"
        target="_blank"
        rel="noopener noreferrer"
        class={followLinkStyles}
      >
        Follow @sandro.g.h
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
      </a>
    </div>

    <!-- Scroll Container -->
    <div class={scrollContainerStyles}>
      {#if loading}
        <!-- Loading skeletons -->
        {#each Array(6) as _, i}
          <div class="skeleton"></div>
        {/each}
      {:else}
        <!-- Posts -->
        {#each posts as post (post.id)}
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            class={postStyles}
          >
            <img
              src={post.mediaUrl}
              alt="Instagram post"
              class={imageStyles}
              loading="lazy"
            />
            <div class={grainOverlayStyles}></div>

            {#if post.mediaType === 'VIDEO'}
              <svg class={videoIndicatorStyles} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            {:else if post.mediaType === 'CAROUSEL_ALBUM'}
              <svg class={videoIndicatorStyles} viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h2v12H4zm4 0h2v12H8zm4 0h12v12H12z"/>
              </svg>
            {/if}
          </a>
        {/each}
      {/if}
    </div>
  </div>
{/if}
