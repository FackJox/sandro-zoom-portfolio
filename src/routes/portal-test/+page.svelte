<script lang="ts">
  import { browser } from '$app/environment'
  import { registerGSAP } from '$lib/core/gsap'
  import { PortalContainer } from '$lib/components'

  // Register GSAP immediately on client (before any components mount)
  if (browser) {
    registerGSAP()
    console.log('[PortalTest] GSAP registered')
  }
</script>

<svelte:head>
  <title>Portal Transition Test</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #000;
    }
  </style>
</svelte:head>

<PortalContainer
  totalDuration={20}
  scrollSpeed={65}
  transitionDuration={0.8}
  markers={true}
>
  <!-- Scene 1: Hero -->
  <div
    data-scene="hero"
    style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #1a1a2e, #16213e);"
  >
    <h1 style="font-size: 4rem; font-weight: bold; color: white; margin-bottom: 1rem;" data-animate="text">HERO</h1>
    <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7);" data-animate="text">Scene 1 - Scroll to transition</p>
  </div>

  <!-- Scene 2: Film -->
  <div
    data-scene="film"
    style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #0f3460, #16213e);"
  >
    <h1 style="font-size: 4rem; font-weight: bold; color: white; margin-bottom: 1rem;" data-animate="text">FILM</h1>
    <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7);" data-animate="text">Scene 2 - 14 Peaks, K2</p>
  </div>

  <!-- Scene 3: Stories -->
  <div
    data-scene="stories"
    style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #533483, #16213e);"
  >
    <h1 style="font-size: 4rem; font-weight: bold; color: white; margin-bottom: 1rem;" data-animate="text">STORIES</h1>
    <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7);" data-animate="text">Scene 3 - Sasha, Grace</p>
  </div>

  <!-- Scene 4: About -->
  <div
    data-scene="about"
    style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #e94560, #16213e);"
  >
    <h1 style="font-size: 4rem; font-weight: bold; color: white; margin-bottom: 1rem;" data-animate="text">ABOUT</h1>
    <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7);" data-animate="text">Scene 4 - The Person</p>
  </div>
</PortalContainer>
