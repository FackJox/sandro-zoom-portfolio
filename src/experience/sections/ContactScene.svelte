<!--
  ContactScene.svelte

  3D scene for the camera reveal effect.
  Contains a camera rig group with:
  - Screen plane (where Services texture will be rendered)
  - Camera GLB model positioned relative to screen

  Animation: Scroll-driven zoom-out from fullscreen to corner position
  - Start: Screen fills viewport (rig at center, close to camera)
  - End: Rig moves to bottom-right (desktop) or bottom-center (mobile)

  Values from Tweakpane positioning session:
  - cameraModel: position (0.63, -0.82, 0), rotation (-1.59, 0, -3.14), scale 0.023
  - screenPlane: position (0, 0.08, 0.68), scale (1.6, 0.9)
-->
<script lang="ts">
  import { T } from '@threlte/core'
  import { useGltf, Text } from '@threlte/extras'
  import * as THREE from 'three'
  import { onMount, onDestroy } from 'svelte'
  import { Pane } from 'tweakpane'
  import { gsap, ScrollTrigger, registerGSAP } from '$lib/core/gsap'

  interface Props {
    /** Scroll progress 0-1 for external control (optional) */
    scrollProgress?: number
    /** Whether to show debug Tweakpane controls */
    showDebug?: boolean
  }

  let { scrollProgress = 0, showDebug = true }: Props = $props()

  // Load camera model
  const gltf = useGltf('/camera.glb')

  // Tweakpane instance
  let pane: Pane | null = null

  // GSAP context for cleanup
  let ctx: gsap.Context | null = null

  // Viewport dimensions for dynamic start calculation
  let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1920)
  let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 1080)
  let aspectRatio = $derived(viewportWidth / viewportHeight)

  // Calculate start position dynamically so screen fills viewport
  // The screen plane (1.6 x 0.9) must cover the entire visible area
  let calculatedStartZ = $derived(() => {
    const fovRad = (viewerCamera.fov * Math.PI) / 180
    const halfFov = fovRad / 2

    // Screen dimensions (from screenPlane.scale)
    const screenWidth = screenPlane.scale.x
    const screenHeight = screenPlane.scale.y

    // Distance needed for screen to fill viewport height
    const distanceForHeight = screenHeight / (2 * Math.tan(halfFov))

    // Distance needed for screen to fill viewport width
    const distanceForWidth = screenWidth / (2 * Math.tan(halfFov) * aspectRatio)

    // Use minimum distance (closer) to ensure screen covers both dimensions
    // Add 5% margin to ensure no edge gaps
    const requiredDistance = Math.min(distanceForHeight, distanceForWidth) * 0.95

    // Calculate rig Z position
    // distance = viewerCamera.z - (rigGroup.z + screenPlane.z)
    // rigGroup.z = viewerCamera.z - distance - screenPlane.z
    const rigZ = viewerCamera.position.z - requiredDistance - screenPlane.position.z

    return rigZ
  })

  // Animation start position (screen fills viewport) - now uses calculated Z
  let startRig = $state({
    position: { x: 0, y: 0, z: 2.5 }, // z will be overwritten by calculated value
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0
  })

  // Update start position when viewport changes
  $effect(() => {
    startRig.position.z = calculatedStartZ()
  })

  // Animation end position (desktop: bottom-right corner)
  let endRig = $state({
    position: { x: 1.7, y: -1.5, z: 0.2 },
    rotation: { x: -0.2, y: -0.1, z: 0 },
    scale: 0.8
  })

  // Current animated rig state (interpolated between start and end)
  let rigGroup = $state({
    position: { x: 0, y: 0, z: 2.5 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.2
  })

  // Camera model position RELATIVE to rig group
  let cameraModel = $state({
    position: { x: 0.63, y: -0.82, z: 0 },
    rotation: { x: -1.59, y: 0, z: -3.14 },
    scale: 0.023
  })

  // Screen plane position RELATIVE to rig group
  let screenPlane = $state({
    position: { x: 0, y: 0.08, z: 0.68 },
    scale: { x: 1.6, y: 0.9 }
  })

  // Viewer camera settings
  let viewerCamera = $state({
    position: { x: 0, y: 0, z: 5 },
    fov: 50
  })

  // 3D Text settings
  let textConfig = $state({
    position: { x: -3, y: 2, z: -2 },
    fontSize: 0.35,
    maxWidth: 4,
    color: '#ffffff'
  })

  // Interpolate rig position based on progress
  function updateRigFromProgress(progress: number) {
    const p = Math.max(0, Math.min(1, progress))

    rigGroup.position.x = startRig.position.x + (endRig.position.x - startRig.position.x) * p
    rigGroup.position.y = startRig.position.y + (endRig.position.y - startRig.position.y) * p
    rigGroup.position.z = startRig.position.z + (endRig.position.z - startRig.position.z) * p

    rigGroup.rotation.x = startRig.rotation.x + (endRig.rotation.x - startRig.rotation.x) * p
    rigGroup.rotation.y = startRig.rotation.y + (endRig.rotation.y - startRig.rotation.y) * p
    rigGroup.rotation.z = startRig.rotation.z + (endRig.rotation.z - startRig.rotation.z) * p

    rigGroup.scale = startRig.scale + (endRig.scale - startRig.scale) * p
  }

  // React to external scrollProgress prop changes
  $effect(() => {
    updateRigFromProgress(scrollProgress)
  })

  // Output for copy
  let outputValues = $derived(JSON.stringify({
    startRig: startRig,
    endRig: endRig,
    currentRig: rigGroup,
    cameraModel: cameraModel,
    screenPlane: screenPlane,
    viewerCamera: viewerCamera,
    textConfig: textConfig
  }, null, 2))

  // Handle window resize for dynamic start position
  function handleResize() {
    viewportWidth = window.innerWidth
    viewportHeight = window.innerHeight
  }

  onMount(() => {
    // Register GSAP plugins
    registerGSAP()

    // Set initial viewport dimensions and listen for resize
    handleResize()
    window.addEventListener('resize', handleResize)

    if (!showDebug) return

    pane = new Pane({ title: 'Contact Scene' })

    // Viewport Info folder (read-only calculated values)
    const viewportFolder = pane.addFolder({ title: 'Viewport Info (calculated)' })
    const viewportInfo = {
      width: viewportWidth,
      height: viewportHeight,
      aspect: aspectRatio.toFixed(2),
      calculatedZ: calculatedStartZ().toFixed(2)
    }
    viewportFolder.addBinding(viewportInfo, 'width', { readonly: true, label: 'Width' })
    viewportFolder.addBinding(viewportInfo, 'height', { readonly: true, label: 'Height' })
    viewportFolder.addBinding(viewportInfo, 'aspect', { readonly: true, label: 'Aspect' })
    viewportFolder.addBinding(viewportInfo, 'calculatedZ', { readonly: true, label: 'Start Z' })

    // Animation Start Position folder (screen fills viewport)
    const startFolder = pane.addFolder({ title: 'Animation Start (fullscreen)', expanded: false })
    startFolder.addBinding(startRig, 'position', {
      x: { min: -5, max: 5, step: 0.1 },
      y: { min: -5, max: 5, step: 0.1 },
      z: { min: -2, max: 10, step: 0.1 }
    })
    startFolder.addBinding(startRig, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.01 },
      y: { min: -Math.PI, max: Math.PI, step: 0.01 },
      z: { min: -Math.PI, max: Math.PI, step: 0.01 }
    })
    startFolder.addBinding(startRig, 'scale', { min: 0.1, max: 3, step: 0.1 })

    // Animation End Position folder (corner position)
    const endFolder = pane.addFolder({ title: 'Animation End (corner)' })
    endFolder.addBinding(endRig, 'position', {
      x: { min: -5, max: 5, step: 0.1 },
      y: { min: -5, max: 5, step: 0.1 },
      z: { min: -2, max: 10, step: 0.1 }
    })
    endFolder.addBinding(endRig, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.01 },
      y: { min: -Math.PI, max: Math.PI, step: 0.01 },
      z: { min: -Math.PI, max: Math.PI, step: 0.01 }
    })
    endFolder.addBinding(endRig, 'scale', { min: 0.1, max: 3, step: 0.1 })

    // Viewer camera folder
    const cameraFolder = pane.addFolder({ title: 'Viewer Camera', expanded: false })
    cameraFolder.addBinding(viewerCamera, 'position', {
      x: { min: -10, max: 10, step: 0.1 },
      y: { min: -10, max: 10, step: 0.1 },
      z: { min: 0.5, max: 20, step: 0.1 }
    })
    cameraFolder.addBinding(viewerCamera, 'fov', { min: 20, max: 120, step: 1 })

    // 3D Text folder
    const textFolder = pane.addFolder({ title: '3D Text', expanded: false })
    textFolder.addBinding(textConfig, 'position', {
      x: { min: -10, max: 10, step: 0.1 },
      y: { min: -10, max: 10, step: 0.1 },
      z: { min: -10, max: 10, step: 0.1 }
    })
    textFolder.addBinding(textConfig, 'fontSize', { min: 0.1, max: 1, step: 0.01 })
    textFolder.addBinding(textConfig, 'maxWidth', { min: 1, max: 10, step: 0.1 })
    textFolder.addBinding(textConfig, 'color', { view: 'color' })

    // Screen plane folder (relative adjustments)
    const screenFolder = pane.addFolder({ title: 'Screen Plane (relative)', expanded: false })
    screenFolder.addBinding(screenPlane, 'position', {
      x: { min: -2, max: 2, step: 0.01 },
      y: { min: -2, max: 2, step: 0.01 },
      z: { min: -2, max: 2, step: 0.01 }
    })
    screenFolder.addBinding(screenPlane, 'scale', {
      x: { min: 0.1, max: 5, step: 0.1 },
      y: { min: 0.1, max: 5, step: 0.1 }
    })

    // Camera model folder (relative adjustments)
    const modelFolder = pane.addFolder({ title: 'Camera Model (relative)', expanded: false })
    modelFolder.addBinding(cameraModel, 'position', {
      x: { min: -2, max: 2, step: 0.01 },
      y: { min: -2, max: 2, step: 0.01 },
      z: { min: -2, max: 2, step: 0.01 }
    })
    modelFolder.addBinding(cameraModel, 'rotation', {
      x: { min: -Math.PI, max: Math.PI, step: 0.01 },
      y: { min: -Math.PI, max: Math.PI, step: 0.01 },
      z: { min: -Math.PI, max: Math.PI, step: 0.01 }
    })
    modelFolder.addBinding(cameraModel, 'scale', { min: 0.001, max: 0.1, step: 0.001 })

    // Export button
    pane.addButton({ title: 'Copy Values to Console' }).on('click', () => {
      console.log('=== CONTACT SCENE VALUES ===')
      console.log(outputValues)
      navigator.clipboard?.writeText(outputValues)
    })

    // Preview buttons for start/end positions
    const previewFolder = pane.addFolder({ title: 'Preview Animation' })
    previewFolder.addButton({ title: 'Go to Start (fullscreen)' }).on('click', () => {
      updateRigFromProgress(0)
    })
    previewFolder.addButton({ title: 'Go to End (corner)' }).on('click', () => {
      updateRigFromProgress(1)
    })
    previewFolder.addButton({ title: 'Go to 50%' }).on('click', () => {
      updateRigFromProgress(0.5)
    })
  })

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
    ctx?.revert()
    pane?.dispose()
  })
</script>

<!-- Lighting -->
<T.AmbientLight intensity={0.6} />
<T.DirectionalLight position={[5, 10, 5]} intensity={1} />
<T.DirectionalLight position={[-5, 5, -5]} intensity={0.3} />

<!-- Perspective Camera looking at origin -->
<T.PerspectiveCamera
  makeDefault
  position.x={viewerCamera.position.x}
  position.y={viewerCamera.position.y}
  position.z={viewerCamera.position.z}
  fov={viewerCamera.fov}
  near={0.1}
  far={100}
/>

<!-- Background plane (dark, z: -10) -->
<T.Mesh position={[0, 0, -10]}>
  <T.PlaneGeometry args={[50, 50]} />
  <T.MeshBasicMaterial color="#0f171a" />
</T.Mesh>

<!-- 3D Text - positioned behind the camera rig, revealed as rig moves -->
<Text
  text="If you have a story to tell please get in touch."
  position={[textConfig.position.x, textConfig.position.y, textConfig.position.z]}
  fontSize={textConfig.fontSize}
  maxWidth={textConfig.maxWidth}
  color={textConfig.color}
  anchorX="left"
  anchorY="top"
/>

<!-- Camera Rig Group - contains screen plane and camera model -->
<T.Group
  position.x={rigGroup.position.x}
  position.y={rigGroup.position.y}
  position.z={rigGroup.position.z}
  rotation.x={rigGroup.rotation.x}
  rotation.y={rigGroup.rotation.y}
  rotation.z={rigGroup.rotation.z}
  scale={rigGroup.scale}
>
  <!-- Screen Plane (bright green placeholder for Services texture) -->
  <T.Mesh
    position.x={screenPlane.position.x}
    position.y={screenPlane.position.y}
    position.z={screenPlane.position.z}
  >
    <T.PlaneGeometry args={[screenPlane.scale.x, screenPlane.scale.y]} />
    <T.MeshBasicMaterial
      color="#00ff00"
      side={THREE.DoubleSide}
    />
  </T.Mesh>

  <!-- Camera GLB Model -->
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
</T.Group>
