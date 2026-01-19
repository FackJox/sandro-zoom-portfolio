<!--
  Test page to visualize camera.glb and position the screen plane.
  Access at /test-camera
-->
<script lang="ts">
  import { Canvas } from '@threlte/core'
  import CameraScene from './CameraScene.svelte'
</script>

<div style="width: 100vw; height: 100vh; background: #1a1a2e;">
  <Canvas>
    <CameraScene />
  </Canvas>
</div>

<div style="position: fixed; top: 20px; left: 20px; color: white; font-family: monospace; font-size: 12px;">
  <p>Drag to orbit | Scroll to zoom</p>
  <p>Tweakpane controls on the right →</p>
</div>
