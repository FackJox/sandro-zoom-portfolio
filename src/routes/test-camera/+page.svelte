<!--
  Test page to visualize camera.glb and position the screen plane.
  Access at /test-camera (dev only)
-->
<script lang="ts">
  import { dev } from '$app/environment'
  import { onMount } from 'svelte'

  let Canvas: typeof import('@threlte/core').Canvas
  let CameraScene: typeof import('./CameraScene.svelte').default
  let ready = $state(false)

  onMount(async () => {
    if (!dev) return
    const threlte = await import('@threlte/core')
    const scene = await import('./CameraScene.svelte')
    Canvas = threlte.Canvas
    CameraScene = scene.default
    ready = true
  })
</script>

{#if !dev}
  <div style="display: grid; place-items: center; height: 100vh; color: white; background: #1a1a2e;">
    <p>This page is only available in development mode.</p>
  </div>
{:else if ready}
  <div style="width: 100vw; height: 100vh; background: #1a1a2e;">
    <Canvas>
      <CameraScene />
    </Canvas>
  </div>

  <div style="position: fixed; top: 20px; left: 20px; color: white; font-family: monospace; font-size: 12px;">
    <p>Drag to orbit | Scroll to zoom</p>
    <p>Tweakpane controls on the right →</p>
  </div>
{:else}
  <div style="display: grid; place-items: center; height: 100vh; color: white; background: #1a1a2e;">
    <p>Loading...</p>
  </div>
{/if}
