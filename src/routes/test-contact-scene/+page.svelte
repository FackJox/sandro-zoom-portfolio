<!--
  Test page to visualize ContactScene with scroll-driven animation.
  Access at /test-contact-scene (dev only)

  Scroll behavior:
  - Page is 300vh tall to allow scrolling
  - Canvas is pinned during scroll
  - Scroll progress drives the zoom-out animation
-->
<script lang="ts">
  import { dev } from '$app/environment'
  import { onMount, onDestroy } from 'svelte'
  import { registerGSAP, gsap, ScrollTrigger } from '$lib/core/gsap'

  let Canvas: typeof import('@threlte/core').Canvas
  let ContactScene: typeof import('$experience/sections/ContactScene.svelte').default
  let ready = $state(false)

  // Scroll progress state (0-1)
  let scrollProgress = $state(0)

  // Element references
  let scrollContainer: HTMLElement | null = $state(null)
  let canvasWrapper: HTMLElement | null = $state(null)

  // GSAP context for cleanup
  let ctx: gsap.Context | null = null

  onMount(async () => {
    if (!dev) return

    // Register GSAP plugins first
    registerGSAP()

    // Dynamic imports for Threlte (SSR-safe)
    const threlte = await import('@threlte/core')
    const scene = await import('$experience/sections/ContactScene.svelte')
    Canvas = threlte.Canvas
    ContactScene = scene.default
    ready = true

    // Wait for DOM to be ready with the canvas
    await new Promise(resolve => setTimeout(resolve, 100))

    if (!scrollContainer || !canvasWrapper) return

    ctx = gsap.context(() => {
      // Pin the canvas wrapper and track scroll progress
      ScrollTrigger.create({
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        pin: canvasWrapper,
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          scrollProgress = self.progress
        }
      })

      console.log('[ContactScene Test] ScrollTrigger created')
    }, scrollContainer)
  })

  onDestroy(() => {
    ctx?.revert()
  })
</script>

{#if !dev}
  <div class="dev-only-message">
    <p>This page is only available in development mode.</p>
  </div>
{:else if ready}
  <!-- Scroll container - 300vh to allow scroll-driven animation -->
  <div bind:this={scrollContainer} class="scroll-container">
    <!-- Pinned canvas wrapper -->
    <div bind:this={canvasWrapper} class="canvas-wrapper">
      <Canvas>
        <ContactScene {scrollProgress} showDebug={true} />
      </Canvas>
    </div>
  </div>

  <!-- Fixed debug info overlay -->
  <div class="debug-overlay">
    <p class="debug-title">ContactScene Scroll Test</p>
    <p>Scroll Progress: {(scrollProgress * 100).toFixed(1)}%</p>
    <p class="debug-hint">Green plane = Services texture placeholder</p>
    <p class="debug-hint">Scroll down to see zoom-out animation</p>
  </div>

  <!-- Scroll indicator at top -->
  <div class="scroll-indicator scroll-indicator-top">
    <span>START (fullscreen)</span>
  </div>

  <!-- Scroll indicator at bottom -->
  <div class="scroll-indicator scroll-indicator-bottom">
    <span>END (corner position)</span>
  </div>
{:else}
  <div class="loading-message">
    <p>Loading...</p>
  </div>
{/if}

<style>
  .dev-only-message,
  .loading-message {
    display: grid;
    place-items: center;
    height: 100vh;
    color: white;
    background: #0f171a;
  }

  .scroll-container {
    width: 100%;
    height: 300vh;
    background: #0f171a;
    position: relative;
  }

  .canvas-wrapper {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  .debug-overlay {
    position: fixed;
    top: 20px;
    left: 20px;
    color: white;
    font-family: monospace;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.7);
    padding: 12px;
    border-radius: 4px;
    z-index: 1000;
  }

  .debug-title {
    margin: 0 0 8px 0;
    font-weight: bold;
  }

  .debug-hint {
    margin: 4px 0 0 0;
    opacity: 0.7;
  }

  .scroll-indicator {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-family: monospace;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 4px;
    z-index: 1000;
    pointer-events: none;
  }

  .scroll-indicator-top {
    top: 20px;
  }

  .scroll-indicator-bottom {
    bottom: 20px;
  }
</style>
