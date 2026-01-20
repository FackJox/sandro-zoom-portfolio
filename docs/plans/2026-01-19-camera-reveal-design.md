# Camera Reveal Design

The final scene reveals that the scrollytelling experience has been playing on a camera's screen. As the user scrolls, the camera zooms out from fullscreen to settle in the bottom-right, revealing contact information in the space around it.

## Architecture

### Scene Layers

1. **Background** - Solid color plane, far back in Z-space
2. **3D Text** - "If you have a story to tell please get in touch." - revealed by camera movement
3. **Camera Rig** - GLB model + screen plane with frozen Services texture
4. **HTML Overlay** - Contact links and social buttons, fade in after camera settles

### Transition Flow

```
START (scroll 0%)              END (scroll 100%)
┌─────────────────────┐       ┌─────────────────────────┐
│                     │       │ "If you have a story    │
│    [SCREEN]         │       │  to tell please         │
│  (Services frozen)  │  ──►  │  get in touch."         │
│                     │       │                         │
│   [CAMERA BODY]     │       │ +447880352909           │
│   (off-screen)      │       │ sandro@...    ┌──────┐  │
└─────────────────────┘       │ [IG][YT][SS]  │SCREEN│  │
                              │               └──────┘  │
                              │                [CAM]    │
                              └─────────────────────────┘
```

## Animation Details

### Camera Movement

- **Type:** Scroll-driven (GSAP ScrollTrigger, scrub: true)
- **Easing:** `power2.out` - ease-out deceleration, cinematic "landing"
- **Method:** Animate viewer camera Z position (pull back) + camera rig XY position (drift to corner)

### Timeline

| Scroll % | Action |
|----------|--------|
| 0-85% | Camera pulls back, drifts to bottom-right. 3D text revealed. |
| 85-100% | HTML contact elements fade in |

### Reveal Mechanism

- **3D text:** Positioned behind camera rig initially, naturally revealed as camera moves aside
- **HTML elements:** Start `opacity: 0`, animate to `opacity: 1` at 85% scroll

## Responsive Breakpoints

### Desktop (>1024px)
- Camera: Bottom-right third
- 3D text: Top-left, large
- HTML: Vertical stack, left-aligned

### Tablet (768-1024px)
- Camera: Bottom-center
- 3D text: Top-left, medium
- HTML: Vertical stack, left-aligned

### Mobile (<768px)
- Camera: Bottom-center, smaller scale
- 3D text: Top-left, small, tighter line breaks
- HTML: Vertical stack, centered

## Technical Implementation

### Threlte Scene Structure

```svelte
<Canvas>
  <!-- Background -->
  <T.Mesh position={[0, 0, -10]}>
    <T.PlaneGeometry args={[50, 50]} />
    <T.MeshBasicMaterial color="#0a0a12" />
  </T.Mesh>

  <!-- 3D Text (revealed) -->
  <Text
    text="If you have a story to tell please get in touch."
    position={[-3, 2, -2]}
    fontSize={0.5}
    maxWidth={8}
    anchorX="left"
    anchorY="top"
  />

  <!-- Camera Rig (animated) -->
  <T.Group bind:ref={cameraRig}>
    <!-- Screen plane -->
    <T.Mesh position={[0, 0.08, 0.68]}>
      <T.PlaneGeometry args={[1.6, 0.9]} />
      <T.MeshBasicMaterial map={servicesTexture} />
    </T.Mesh>

    <!-- Camera GLB -->
    <T.Group
      position={[0.63, -0.82, 0]}
      rotation={[-1.59, 0, -3.14]}
      scale={0.023}
    >
      <T is={gltf.scene} />
    </T.Group>
  </T.Group>

  <!-- Viewer camera -->
  <T.PerspectiveCamera makeDefault position={[0, 0, cameraZ]} fov={50} />
</Canvas>

<!-- HTML overlay (fades in) -->
<div class="contact-html" style="opacity: {htmlOpacity}">
  <a href="tel:+447880352909">+447880352909</a>
  <a href="mailto:sandro.gromen-hayes@live.com">sandro.gromen-hayes@live.com</a>
  <div class="socials">
    <a href="...">Instagram</a>
    <a href="...">YouTube</a>
    <a href="...">Shutterstock</a>
  </div>
</div>
```

### GSAP Animation

```typescript
// Pull back viewer camera
gsap.to(viewerCameraPosition, {
  z: 8,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: contactSection,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true
  }
})

// Drift camera rig to bottom-right
gsap.to(cameraRigPosition, {
  x: 2.5,
  y: -1.2,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: contactSection,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true
  }
})

// Fade in HTML at 85%
gsap.to(htmlOpacity, {
  value: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: contactSection,
    start: '85% top',
    end: 'bottom bottom',
    scrub: true
  }
})
```

## Assets Required

| Asset | Path | Notes |
|-------|------|-------|
| Camera GLB | `/static/camera.glb` | Existing |
| Services texture | `/static/textures/services-frozen.jpg` | Screenshot of Services section, 1920x1080 |

## Captured Tweakpane Values

### Final Responsive Positions (from `/test-contact-scene`)

**Mobile & Tablet (same values):**
```json
{
  "rigGroup": {
    "position": { "x": 0, "y": -1.5, "z": 0 },
    "rotation": { "x": -0.16, "y": 0.03, "z": -0.03 },
    "scale": 0.8
  },
  "viewerCamera": {
    "position": { "x": 0, "y": 0, "z": 5 },
    "fov": 50
  }
}
```

**Desktop:**
```json
{
  "rigGroup": {
    "position": { "x": 1.7, "y": -1.5, "z": 0.2 },
    "rotation": { "x": -0.2, "y": -0.1, "z": 0 },
    "scale": 0.8
  },
  "viewerCamera": {
    "position": { "x": 0, "y": 0, "z": 5 },
    "fov": 50
  }
}
```

### Camera Model & Screen (relative to rig, same for all breakpoints)
```json
{
  "cameraModel": {
    "position": { "x": 0.63, "y": -0.82, "z": 0 },
    "rotation": { "x": -1.59, "y": 0, "z": -3.14 },
    "scale": 0.023
  },
  "screenPlane": {
    "position": { "x": 0, "y": 0.08, "z": 0.68 },
    "scale": { "x": 1.6, "y": 0.9 }
  }
}
```

### 3D Text Responsive Positions

**Mobile:**
```json
{
  "position": { "x": -1.3, "y": 3.1, "z": -2 },
  "fontSize": 0.48,
  "maxWidth": 2.8,
  "color": "#ffffff"
}
```

**Tablet:**
```json
{
  "position": { "x": -2.4, "y": 2.9, "z": -2 },
  "fontSize": 0.49,
  "maxWidth": 4,
  "color": "#ffffff"
}
```

**Desktop:**
```json
{
  "position": { "x": -4.8, "y": 2.9, "z": -2 },
  "fontSize": 0.72,
  "maxWidth": 6.8,
  "color": "#ffffff"
}
```

## Dependencies

- `@threlte/core` - Svelte Three.js wrapper
- `@threlte/extras` - useGltf, Text component
- `three` - Three.js
- `troika-three-text` - High-quality 3D text (via @threlte/extras Text)
- `gsap` - Animation (existing)

## Open Questions

1. **Services texture update workflow** - Manual screenshot for now, could automate later
2. **3D text font** - Use system default or custom font?
3. **Background treatment** - Solid color, gradient, or subtle texture?
