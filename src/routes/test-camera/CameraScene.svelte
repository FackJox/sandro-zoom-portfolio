<!--
  CameraScene.svelte

  3D scene to visualize camera.glb and position the screen plane.
  Uses Tweakpane for interactive positioning controls.
-->
<script lang="ts">
  import { T, useTask } from '@threlte/core'
  import { useGltf, OrbitControls, Grid } from '@threlte/extras'
  import { onMount, onDestroy } from 'svelte'
  import * as THREE from 'three'
  import { Pane } from 'tweakpane'

  // Load camera model
  const gltf = useGltf('/camera.glb')

  // Tweakpane state
  let pane: Pane | null = null

  // Camera model transform
  let cameraModel = $state({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 0.01 // GLB is ~150 units, scale down
  })

  // Screen plane transform (relative to camera or world)
  let screenPlane = $state({
    position: { x: 0, y: 0, z: -0.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1.6, y: 0.9 }, // 16:9 aspect
    visible: true,
    color: '#00ff00',
    opacity: 0.5
  })

  // Viewer camera position (for final composition reference)
  let viewerRef = $state({
    fov: 50,
    near: 0.1,
    far: 1000
  })

  // Output values for copy/paste
  let outputValues = $derived(JSON.stringify({
    cameraModel: {
      position: cameraModel.position,
      rotation: cameraModel.rotation,
      scale: cameraModel.scale
    },
    screenPlane: {
      position: screenPlane.position,
      rotation: screenPlane.rotation,
      scale: screenPlane.scale
    }
  }, null, 2))

  onMount(() => {
    pane = new Pane({ title: 'Camera Positioning' })

    // Camera Model folder
    const cameraFolder = pane.addFolder({ title: 'Camera Model' })
    cameraFolder.addBinding(cameraModel, 'position', {
      x: { min: -10, max: 10, step: 0.01 },
      y: { min: -10, max: 10, step: 0.01 },
      z: { min: -10, max: 10, step: 0.01 }
    })
    cameraFolder.addBinding(cameraModel, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.01 },
      y: { min: -Math.PI, max: Math.PI, step: 0.01 },
      z: { min: -Math.PI, max: Math.PI, step: 0.01 }
    })
    cameraFolder.addBinding(cameraModel, 'scale', { min: 0.001, max: 0.1, step: 0.001 })

    // Screen Plane folder
    const screenFolder = pane.addFolder({ title: 'Screen Plane' })
    screenFolder.addBinding(screenPlane, 'visible')
    screenFolder.addBinding(screenPlane, 'position', {
      x: { min: -5, max: 5, step: 0.01 },
      y: { min: -5, max: 5, step: 0.01 },
      z: { min: -5, max: 5, step: 0.01 }
    })
    screenFolder.addBinding(screenPlane, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.01 },
      y: { min: -Math.PI, max: Math.PI, step: 0.01 },
      z: { min: -Math.PI, max: Math.PI, step: 0.01 }
    })
    screenFolder.addBinding(screenPlane, 'scale', {
      x: { min: 0.1, max: 5, step: 0.01 },
      y: { min: 0.1, max: 5, step: 0.01 }
    })
    screenFolder.addBinding(screenPlane, 'color')
    screenFolder.addBinding(screenPlane, 'opacity', { min: 0, max: 1, step: 0.1 })

    // Export button
    pane.addButton({ title: 'Copy Values to Console' }).on('click', () => {
      console.log('=== CAMERA POSITIONING VALUES ===')
      console.log(outputValues)
      navigator.clipboard?.writeText(outputValues)
    })
  })

  onDestroy(() => {
    pane?.dispose()
  })
</script>

<!-- Lighting -->
<T.AmbientLight intensity={0.6} />
<T.DirectionalLight position={[5, 10, 5]} intensity={1} castShadow />
<T.DirectionalLight position={[-5, 5, -5]} intensity={0.3} />

<!-- Perspective Camera with OrbitControls -->
<T.PerspectiveCamera
  makeDefault
  position={[0, 0, 5]}
  fov={viewerRef.fov}
  near={viewerRef.near}
  far={viewerRef.far}
>
  <OrbitControls enableDamping />
</T.PerspectiveCamera>

<!-- Grid for reference -->
<Grid
  cellColor="#444466"
  sectionColor="#666688"
  fadeDistance={25}
  cellSize={0.5}
  sectionSize={2}
/>

<!-- Camera Model -->
{#if $gltf}
  <T.Group
    position.x={cameraModel.position.x}
    position.y={cameraModel.position.y}
    position.z={cameraModel.position.z}
    rotation.x={cameraModel.rotation.x}
    rotation.y={cameraModel.rotation.y}
    rotation.z={cameraModel.rotation.z}
    scale={cameraModel.scale}
  >
    <T is={$gltf.scene} />
  </T.Group>
{/if}

<!-- Screen Plane (where the frozen Services frame will go) -->
{#if screenPlane.visible}
  <T.Mesh
    position.x={screenPlane.position.x}
    position.y={screenPlane.position.y}
    position.z={screenPlane.position.z}
    rotation.x={screenPlane.rotation.x}
    rotation.y={screenPlane.rotation.y}
    rotation.z={screenPlane.rotation.z}
  >
    <T.PlaneGeometry args={[screenPlane.scale.x, screenPlane.scale.y]} />
    <T.MeshBasicMaterial
      color={screenPlane.color}
      transparent
      opacity={screenPlane.opacity}
      side={THREE.DoubleSide}
    />
  </T.Mesh>
{/if}

<!-- Axes helper for orientation -->
<T.AxesHelper args={[2]} />
