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
  totalDuration={30}
  scrollSpeed={65}
  markers={true}
>
  <!-- Scene 1: Hero - Text from both sides meeting in middle -->
  <div
    data-scene="hero"
    style="position: absolute; inset: 0; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #1a1a2e, #16213e);"
  >
    <div style="position: absolute; left: 5%; top: 40%;" data-animate="text" data-direction="left">
      <h1 style="font-size: 5rem; font-weight: bold; color: white; line-height: 1.1; margin: 0;">HERO</h1>
    </div>
    <div style="position: absolute; right: 5%; top: 50%; text-align: right;" data-animate="text" data-direction="right">
      <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7); margin: 0;">Scene 1</p>
      <p style="font-size: 1.2rem; color: rgba(255,255,255,0.5); margin: 0;">Scroll to transition</p>
    </div>
  </div>

  <!-- Scene 2: Film -->
  <div
    data-scene="film"
    style="position: absolute; inset: 0; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #0f3460, #16213e);"
  >
    <div style="position: absolute; left: 5%; top: 40%;" data-animate="text" data-direction="left">
      <h1 style="font-size: 5rem; font-weight: bold; color: white; line-height: 1.1; margin: 0;">14 PEAKS</h1>
    </div>
    <div style="position: absolute; right: 5%; top: 50%; text-align: right;" data-animate="text" data-direction="right">
      <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7); margin: 0;">Scene 2</p>
      <p style="font-size: 1.2rem; color: rgba(255,255,255,0.5); margin: 0;">Documentary Film</p>
    </div>
  </div>

  <!-- Scene 3: Stories -->
  <div
    data-scene="stories"
    style="position: absolute; inset: 0; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #533483, #16213e);"
  >
    <div style="position: absolute; left: 5%; top: 40%;" data-animate="text" data-direction="left">
      <h1 style="font-size: 5rem; font-weight: bold; color: white; line-height: 1.1; margin: 0;">STORIES</h1>
    </div>
    <div style="position: absolute; right: 5%; top: 50%; text-align: right;" data-animate="text" data-direction="right">
      <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7); margin: 0;">Scene 3</p>
      <p style="font-size: 1.2rem; color: rgba(255,255,255,0.5); margin: 0;">Behind the scenes</p>
    </div>
  </div>

  <!-- Scene 4: About -->
  <div
    data-scene="about"
    style="position: absolute; inset: 0; overflow: hidden; transform-origin: 50% 45%; background: linear-gradient(135deg, #e94560, #16213e);"
  >
    <div style="position: absolute; left: 5%; top: 40%;" data-animate="text" data-direction="left">
      <h1 style="font-size: 5rem; font-weight: bold; color: white; line-height: 1.1; margin: 0;">ABOUT</h1>
    </div>
    <div style="position: absolute; right: 5%; top: 50%; text-align: right;" data-animate="text" data-direction="right">
      <p style="font-size: 1.5rem; color: rgba(255,255,255,0.7); margin: 0;">Scene 4</p>
      <p style="font-size: 1.2rem; color: rgba(255,255,255,0.5); margin: 0;">The Person</p>
    </div>
  </div>
</PortalContainer>
