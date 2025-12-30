<!--
  Example Scrollytelling Page

  Demonstrates a complete scrollytelling experience with:
  - Multiple sections (Hero, Features, Outro)
  - Time-based animations
  - Layer parallax effects
  - Responsive design (desktop/mobile variants)
  - GSAP escape hatch
  - Debug tools
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import {
    ScrollContainer,
    Stage,
    Section,
    Debugger,
    validateAndLog,
    setupViteHMR,
    type MasterTimeline,
  } from 'svelte-scrollytelling'
  import { config } from './scrollytelling.config'
  import { hero, features, outro } from '../../experience'

  // All sections for the experience
  const sections = [hero, features, outro]

  // State
  let isReady = $state(false)
  let showDebugger = $state(true)

  // Validate config in development
  onMount(() => {
    if (import.meta.env.DEV) {
      // Validate configuration
      validateAndLog(config)

      // Setup HMR for scroll preservation
      setupViteHMR({
        preserveScroll: true,
        preserveSection: true,
        animationReset: 'soft',
      })
    }
  })

  // Timeline ready callback
  function handleReady(timeline: MasterTimeline) {
    isReady = true
    console.log('[Example] Timeline ready, duration:', timeline.totalDuration)
  }

  // Optional: Track scroll state
  function handleScroll(state: any) {
    // Can be used for analytics, progress tracking, etc.
    // console.log('[Example] Progress:', state.progress)
  }
</script>

<svelte:head>
  <title>Scrollytelling Example | svelte-scrollytelling</title>
  <meta name="description" content="A showcase of svelte-scrollytelling features" />
</svelte:head>

<ScrollContainer
  {config}
  smooth={false}
  onready={handleReady}
  onscroll={handleScroll}
>
  <Stage>
    {#each sections as section (section.id)}
      <Section config={section} />
    {/each}
  </Stage>

  <!-- Debug tools (dev only) - must be inside ScrollContainer for context -->
  {#if import.meta.env.DEV && showDebugger}
    <Debugger
      position="bottom-right"
      showFps={true}
      showLayers={true}
      showAnimations={true}
    />
  {/if}
</ScrollContainer>

<!-- Toggle debugger button -->
{#if import.meta.env.DEV}
  <button
    class="debug-toggle"
    onclick={() => showDebugger = !showDebugger}
    aria-label={showDebugger ? 'Hide debugger' : 'Show debugger'}
  >
    {showDebugger ? '🐛' : '👁️'}
  </button>
{/if}

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  :global(body) {
    background: #0a0a0a;
    color: #fff;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .debug-toggle {
    position: fixed;
    bottom: 16px;
    left: 16px;
    z-index: 10000;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .debug-toggle:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.2);
  }
</style>
