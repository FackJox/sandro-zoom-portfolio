# Motion Design Specification: National Geographic Landing Page Portal Transition

## 1. Overview

| Property | Value |
|----------|-------|
| **Source** | `Landing Page Concept Zoom-in Transition-reversed-slow.mp4` |
| **Duration** | 24.15 seconds (slowed/reversed from original) |
| **Estimated Original Duration** | ~8 seconds at normal speed |
| **Resolution** | 1600 × 1200 |
| **Aspect Ratio** | 4:3 |
| **Frame Rate** | ~30 fps |
| **Scene Count** | 3 scenes |
| **Transition Count** | 2 transitions |
| **Primary Transition Type** | Circular portal zoom-out mask |

### Animation Summary

A carousel-style landing page for National Geographic featuring wildlife scenes. Each scene transitions to the next via a **circular portal mask** that shrinks from full-screen to nothing, revealing the next scene behind it. The transition creates a "looking through a closing iris" effect.

---

## 2. Scene Inventory

### Scene 1: Kingfisher ("A master fisherman")

| Property | Value |
|----------|-------|
| **Duration** | 0.0s – 5.5s (in slowed video) |
| **Sun Color** | `#F5C542` (golden yellow) |
| **Water Reflection** | Yellow-gold gradient with horizontal line texture |
| **Background** | Dark with subtle chevron pattern |

**Content:**
- **Title:** "A master fisherman"
- **Subtitle:** "Kingfishers or Alcedinidae are a family of small to medium-sized, brightly colored birds in the order Coraciiformes"
- **Caption (right):** "A kingfisher catching a fish / Kakadu National Park"
- **Slide Counter:** "3 / 6"

**Hero Element:** Kingfisher bird in flight, diving pose, wings spread. Photo cutout with transparent background.

---

### Scene 2: Deer ("What the deer are telling us")

| Property | Value |
|----------|-------|
| **Duration** | 7.0s – 15.0s (in slowed video) |
| **Sun Color** | `#E85D3B` (coral red/orange) |
| **Water Reflection** | Red-orange gradient with horizontal line texture |
| **Background** | Dark with subtle chevron pattern |

**Content:**
- **Title:** "What the deer are telling us"
- **Subtitle:** "In 1968, Stanford biology professor Paul Ehrlich predicted that another widespread species would die out as a result of overpopulation"
- **Caption (right):** "A whitetail deer watches something in the distance"
- **Slide Counter:** "2 / 6"

**Hero Element:** Standing deer (stag with antlers), facing camera. Photo cutout with transparent background.

**Decorative Elements:** 4-5 floating maple leaves at various positions, continuously animating.

---

### Scene 3: Elephant ("The elephant queen")

| Property | Value |
|----------|-------|
| **Duration** | 17.0s – 24.0s (in slowed video) |
| **Sun Color** | `#F58220` (deep orange/amber) |
| **Water Reflection** | Amber gradient, dusty ground texture |
| **Background** | Dark with subtle chevron pattern |

**Content:**
- **Title:** "The elephant queen"
- **Subtitle:** "African elephants are the largest land animals on Earth. They are slightly larger than their Asian cousins and can be..."
- **Caption (right):** "An African elephant at Indianapolis Zoo in Indiana"
- **Slide Counter:** "1 / 6"

**Hero Element:** African elephant walking toward camera. Photo cutout with transparent background.

---

## 3. Layer Decomposition

### 3.1 Layer Stack Per Scene (Back to Front)

| Z-Index | Layer | Type | Description |
|---------|-------|------|-------------|
| 1 | Outer background | Solid | Black/very dark grey (`#0a0a0a`) |
| 2 | Chevron pattern | SVG/CSS | Subtle diagonal lines, low opacity (~5%) |
| 3 | Container | Shape | Rounded rectangle with 24px border-radius, dark fill |
| 4 | Circular vignette | Gradient | Radial gradient, transparent center → dark edges |
| 5 | Sun semicircle | Shape | Colored half-circle, positioned at horizon line |
| 6 | Water reflection | Texture | Horizontal lines with gradient, matches sun color |
| 7 | Hero animal | Image | PNG cutout, positioned right of center |
| 8 | Floating elements | Images | Leaves (Scene 2 only), various positions |
| 9 | Play button | UI | White circle outline + triangle, center of viewport |
| 10 | Title text | Typography | Large serif, left-aligned |
| 11 | Description text | Typography | Small sans-serif, left-aligned below title |
| 12 | Right caption | Typography | Small, right-aligned with slide counter |
| 13 | Header | UI | Nav bar: hamburger, logo, buttons |
| 14 | Footer | UI | Social icons, scroll indicator, legal links |

### 3.2 Persistent Elements (Unaffected by Transition)

These elements remain static and are **never masked** during transitions:

| Element | Position | Z-Index Behavior |
|---------|----------|------------------|
| Header navigation | Top | Always on top, outside mask |
| Footer bar | Bottom | Always on top, outside mask |
| NatGeo logo | Top center | Always visible |
| Play button | Center (50%, 45%) | Always on top, scale pulse only |
| Scroll indicator | Bottom center | Updates state, never masked |

### 3.3 Layer Stack During Transition

```
┌─────────────────────────────────────────────────────────────────┐
│ [Z: 100] HEADER (hamburger, logo, "ALL EPISODES", "EN")         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Z: 50] PLAY BUTTON - never masked, scale pulses               │
│                                                                 │
│  [Z: 20] OUTGOING SCENE - clipped to shrinking circle           │
│          ┌─────────────────────────────────────────┐            │
│          │  Vignette + Sun + Animal + Text         │            │
│          │  clip-path: circle(R% at 50% 45%)       │            │
│          │  transform: scale(S)                    │            │
│          └─────────────────────────────────────────┘            │
│                                                                 │
│  [Z: 10] INCOMING SCENE - full bleed, scaling down from 1.15    │
│          ┌─────────────────────────────────────────────────┐    │
│          │  Vignette + Sun + Animal + Text (fading in)     │    │
│          │  transform: scale(1.15 → 1.0)                   │    │
│          └─────────────────────────────────────────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Z: 100] FOOTER (social icons, scroll indicator, legal)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Transition Specifications

### 4.1 Transition: Scene A → Scene B (Portal Zoom-Out)

#### Mechanism

The outgoing scene is clipped to a **circular mask** centered on the play button. The mask radius shrinks from full coverage to zero while the scene simultaneously scales down. The incoming scene sits behind at slightly larger scale and settles to 1.0.

#### Anchor Point

| Property | Value |
|----------|-------|
| **X** | 50% (horizontal center of viewport) |
| **Y** | 45% (slightly above vertical center, aligned with sun center) |
| **Reference Element** | Play button center / Sun center (both aligned) |

#### Critical Relationship: Mask vs Scale

The mask radius shrinks **faster** than the scale, creating the "closing iris" effect where edges are clipped before content fully shrinks:

| Progress | Scene Scale | Mask Radius | Visual Effect |
|----------|-------------|-------------|---------------|
| 0% | 1.0 | 150% | Full scene visible |
| 25% | 0.85 | 80% | Edges begin clipping |
| 50% | 0.65 | 50% | Circle clearly visible |
| 75% | 0.45 | 25% | Small portal, content compressed |
| 100% | 0.3 | 0% | Scene fully hidden |

#### Animated Properties: Outgoing Scene

| Property | From | To | Duration | Delay | Easing |
|----------|------|-----|----------|-------|--------|
| `transform: scale()` | 1.0 | 0.3 | 800ms | 0ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `clip-path: circle()` | 150% at 50% 45% | 0% at 50% 45% | 800ms | 0ms | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `opacity` | 1.0 | 0.0 | 200ms | 600ms | `linear` |

#### Animated Properties: Incoming Scene

| Property | From | To | Duration | Delay | Easing |
|----------|------|-----|----------|-------|--------|
| `transform: scale()` | 1.15 | 1.0 | 800ms | 0ms | `cubic-bezier(0, 0, 0.2, 1)` |
| `opacity` | 0.85 | 1.0 | 400ms | 0ms | `ease-out` |

#### Animated Properties: Outgoing Text

| Element | Property | From | To | Duration | Delay | Easing |
|---------|----------|------|-----|----------|-------|--------|
| Title | `translateX` | 0 | -60px | 400ms | 0ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Title | `opacity` | 1 | 0 | 400ms | 0ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Description | `translateX` | 0 | -40px | 350ms | 50ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Description | `opacity` | 1 | 0 | 350ms | 50ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Right caption | `translateX` | 0 | 40px | 300ms | 0ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Right caption | `opacity` | 1 | 0 | 300ms | 0ms | `cubic-bezier(0.4, 0, 1, 1)` |

#### Animated Properties: Incoming Text

| Element | Property | From | To | Duration | Delay | Easing |
|---------|----------|------|-----|----------|-------|--------|
| Title | `translateX` | 60px | 0 | 450ms | 250ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Title | `opacity` | 0 | 1 | 450ms | 250ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Description | `translateX` | 40px | 0 | 400ms | 350ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Description | `opacity` | 0 | 1 | 400ms | 350ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Right caption | `translateX` | -40px | 0 | 350ms | 300ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Right caption | `opacity` | 0 | 1 | 350ms | 300ms | `cubic-bezier(0, 0, 0.2, 1)` |

#### Play Button Behavior

| Phase | Property | From | To | Duration | Easing |
|-------|----------|------|-----|----------|--------|
| Transition start | `scale` | 1.0 | 1.05 | 100ms | `ease-out` |
| Mid-transition | `scale` | 1.05 | 0.95 | 500ms | `ease-in-out` |
| Transition end | `scale` | 0.95 | 1.0 | 200ms | `ease-out` |

Play button is **never masked** - it sits above all scene layers.

---

### 4.2 Sun Halo Effect

A key visual detail: both scenes have their sun positioned at **identical coordinates** (50% X, 42% Y relative to container). During transition:

1. Outgoing scene's sun is visible inside the shrinking portal
2. Incoming scene's sun is visible outside the portal
3. The dark vignette creates a "ring" between them
4. Visual result: outgoing sun appears to have a colored halo

**Implementation requirement:** Sun elements in all scenes must be positioned identically.

---

### 4.3 Edge Bleed / Anticipation

At ~200ms before the main portal shrink begins, the incoming scene's colors become visible at the **corners of the rounded rectangle container**. This creates anticipation.

| Property | Value |
|----------|-------|
| **Trigger** | 200ms before main transition |
| **Effect** | Corners of container show next scene |
| **Implementation** | Incoming scene is already behind, container clips both |

---

## 5. Micro-Interactions

### 5.1 Floating Leaves (Scene 2: Deer)

**Count:** 4-5 leaves at various positions

**Per-leaf animation (continuous, independent):**

| Property | Animation | Duration | Easing |
|----------|-----------|----------|--------|
| `rotate` | 0deg → 360deg | 12s | `linear` |
| `translateY` | Sine wave, ±20px amplitude | 4s | `sine` (ease-in-out) |
| `translateX` | Sine wave, ±5px amplitude | 6s | `sine` (ease-in-out) |

**Leaf positions (approximate):**

| Leaf | X Position | Y Position | Size | Initial Rotation |
|------|------------|------------|------|------------------|
| 1 | 10% | 15% | 40px | 15deg |
| 2 | 85% | 35% | 35px | 120deg |
| 3 | 75% | 70% | 45px | 240deg |
| 4 | 20% | 80% | 30px | 80deg |
| 5 | 90% | 85% | 38px | 200deg |

**Behavior during transition:**
- Leaves scale with the scene (inside portal, they shrink)
- Leaves continue their float animation uninterrupted
- Leaves are clipped by the portal mask like all scene content

### 5.2 Water Reflection

**Type:** Horizontal lines with gradient opacity

**Animation:**
| Property | Animation | Duration | Easing |
|----------|-----------|----------|--------|
| Subtle wave distortion | ±2px vertical offset | 3s | `sine` |
| Shimmer opacity | 0.7 → 1.0 → 0.7 | 4s | `sine` |

### 5.3 Bird Wing Position (Scene 1)

**Animation:** Subtle shift in wing position
| Property | From | To | Duration |
|----------|------|-----|----------|
| `translateY` | 0 | 10px | 5s |

Very subtle, almost imperceptible. Creates sense of life/motion in hero image.

---

## 6. Persistent UI Elements

### 6.1 Header

| Element | Position | Style |
|---------|----------|-------|
| Hamburger menu | Left | 3 horizontal lines, white |
| NatGeo logo | Center | Yellow rectangle outline (brand mark) |
| "ALL EPISODES" button | Right | Outlined button, white text |
| "EN" language selector | Far right | Plain text |
| Settings icon | Far right | 3 vertical bars |

**Behavior:** Static throughout all transitions. Never masked or animated.

### 6.2 Footer

| Element | Position | Style |
|---------|----------|-------|
| Social icons | Left | Facebook, Instagram, YouTube (white) |
| Scroll indicator | Center | Rounded rectangle capsule outline |
| Legal links | Right | "TERMS & CONDITIONS | PRIVACY | COOKIES" |

### 6.3 Scroll Indicator State Machine

```
┌─────────────────┐
│      IDLE       │ ← Capsule outline, empty
└────────┬────────┘
         │ scroll/swipe initiated
         ▼
┌─────────────────┐
│   SCROLLING     │ ← Small pill rises inside capsule
└────────┬────────┘
         │ threshold reached
         ▼
┌─────────────────┐
│  TRANSITIONING  │ ← Pill at top, single pulse
└────────┬────────┘
         │ transition complete
         ▼
┌─────────────────┐
│     RESET       │ ← Pill drops to bottom, fades out
└────────┬────────┘
         │ 500ms delay
         ▼
┌─────────────────┐
│      IDLE       │
└─────────────────┘
```

**Scroll indicator dimensions:**
- Width: 24px
- Height: 48px
- Border radius: 12px (fully rounded ends)
- Stroke: 2px white

---

## 7. Color & Typography Reference

### 7.1 Color Palette

#### Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| NatGeo Yellow | `#FFCC00` | Logo, accents |
| Background Dark | `#0a0a0a` | Outer background |
| Container Dark | `#1a1a1a` | Inner container |
| Text White | `#FFFFFF` | Primary text |
| Text Grey | `#AAAAAA` | Secondary text |

#### Scene-Specific Colors
| Scene | Sun | Reflection | Accent |
|-------|-----|------------|--------|
| Kingfisher | `#F5C542` | `#F5C542` → `#8B7025` | Teal (`#00B4D8`) |
| Deer | `#E85D3B` | `#E85D3B` → `#7A2E1D` | Orange (`#E07020`) |
| Elephant | `#F58220` | `#F58220` → `#8B4A12` | Warm grey (`#8B8178`) |

### 7.2 Typography

| Element | Font Family | Weight | Size | Line Height |
|---------|-------------|--------|------|-------------|
| Title | Serif (Georgia/Times-like) | 400 | 72px | 1.1 |
| Description | Sans-serif (Helvetica-like) | 400 | 14px | 1.5 |
| Caption | Sans-serif | 400 | 12px | 1.4 |
| Slide counter | Sans-serif | 400 | 14px | 1.0 |
| Button | Sans-serif | 500 | 12px | 1.0 |

---

## 8. Timing Summary (Master Timeline)

### Original Speed Estimate

The video is slowed. Estimated original timing:

| Event | Slowed Time | Original Time (Est.) |
|-------|-------------|----------------------|
| Scene hold | 5s | ~1.5s |
| Transition | 2.5s | ~0.8s |
| Full cycle | 7.5s | ~2.5s |

### Master Timeline (Original Speed)

```
TIME (ms)     0    100   200   300   400   500   600   700   800   900
             |-----|-----|-----|-----|-----|-----|-----|-----|-----|
SCENE HOLD   ████████████████████████████████████████████████████████  (1500ms)

TRANSITION START (t=0):
Outgoing scale    ████████████████████████████████████████░░░░░░░░░░  (800ms)
Outgoing mask     ████████████████████████████████████████░░░░░░░░░░  (800ms)
Outgoing opacity  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░  (200ms, delay 600ms)
Incoming scale    ████████████████████████████████████████░░░░░░░░░░  (800ms)
Text out          ██████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (400ms)
Text in           ░░░░░░░░░░░░████████████████████████░░░░░░░░░░░░░░  (450ms, delay 250ms)
Play button pulse ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░  (100ms + 200ms)

Legend: ████ = animating, ░░░░ = idle/waiting
```

---

## 9. Technology Recommendation

### Requirements Analysis

| Requirement | Present? | CSS | GSAP | Three.js/WebGL |
|-------------|----------|-----|------|----------------|
| 2D transforms (scale) | Yes | Full | Full | Full |
| Circular clip-path mask | Yes | Full | Full | Full |
| Soft/feathered mask edges | No | N/A | N/A | N/A |
| Complex timeline orchestration | Yes | Poor | **Excellent** | Fair |
| Scroll-linked animation | Likely | Fair | **Excellent** | Fair |
| Staggered text animations | Yes | Fair | **Excellent** | Fair |
| Continuous micro-animations (leaves) | Yes | Good | Good | Good |
| 3D transforms | No | N/A | N/A | N/A |
| Particle systems | No | N/A | N/A | N/A |
| Shader effects | No | N/A | N/A | N/A |
| Native DOM accessibility | Yes | **Full** | **Full** | None |

### Recommendation

**Primary Technology:** GSAP (GreenSock Animation Platform)

**Rationale:**
1. **Timeline orchestration** - 8+ simultaneous animations with different easings and delays. GSAP's timeline API handles this elegantly.
2. **ScrollTrigger integration** - If scroll-linked, GSAP's ScrollTrigger is industry standard.
3. **CustomEase** - Can exactly replicate any easing curve from After Effects.
4. **Context cleanup** - `gsap.context()` ensures proper cleanup in component lifecycle.
5. **No WebGL overhead** - All effects achievable with CSS properties that GSAP animates.
6. **Accessibility preserved** - DOM-based, screen readers work normally.

**Not Recommended: Three.js/WebGL**
- No 3D requirements
- No shader requirements
- Adds unnecessary complexity and bundle size
- Would require canvas, breaking native accessibility

**CSS-only: Possible but Painful**
- Would require 50+ lines of CSS transitions
- No centralized timeline control
- Difficult to coordinate timing relationships
- No scrubbing/debugging tools

---

## 10. Implementation Patterns

### 10.1 Pattern: Portal Transition

**DOM Structure:**
```html
<div class="stage">
  <!-- Incoming scene (behind) -->
  <div class="scene scene--incoming" data-scene="deer">
    <div class="scene__vignette"></div>
    <div class="scene__sun"></div>
    <div class="scene__water"></div>
    <div class="scene__hero">
      <img src="deer.png" alt="Deer" />
    </div>
    <div class="scene__leaves">
      <div class="leaf" data-leaf="1"></div>
      <!-- ... more leaves -->
    </div>
    <div class="scene__content">
      <h1 class="scene__title" data-animate="text">What the deer are telling us</h1>
      <p class="scene__description" data-animate="text">In 1968...</p>
    </div>
    <div class="scene__caption" data-animate="text">
      <span>A whitetail deer watches...</span>
      <span class="scene__counter">2 / 6</span>
    </div>
  </div>

  <!-- Outgoing scene (on top, masked) -->
  <div class="scene scene--outgoing" data-scene="kingfisher">
    <!-- Same structure as above -->
  </div>

  <!-- Persistent UI (always on top, never masked) -->
  <div class="ui-persistent">
    <button class="play-button" aria-label="Play video">
      <svg><!-- play icon --></svg>
    </button>
  </div>

  <!-- Header/Footer outside scene containers -->
  <header class="header">...</header>
  <footer class="footer">...</footer>
</div>
```

**Key CSS:**
```css
.stage {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a0a0a;
}

.scene {
  position: absolute;
  inset: 40px; /* Account for header/footer space */
  border-radius: 24px;
  overflow: hidden;
}

.scene--outgoing {
  z-index: 20;
  clip-path: circle(150% at 50% 45%);
  transform-origin: 50% 45%;
}

.scene--incoming {
  z-index: 10;
  transform: scale(1.15);
  transform-origin: 50% 45%;
}

.ui-persistent {
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.play-button {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
}

.header, .footer {
  position: absolute;
  z-index: 100;
}
```

**GSAP Animation:**
```javascript
function createPortalTransition(outgoing, incoming) {
  const tl = gsap.timeline({ paused: true });

  // Outgoing scene: scale down + circular mask shrink
  tl.to(outgoing, {
    scale: 0.3,
    clipPath: 'circle(0% at 50% 45%)',
    duration: 0.8,
    ease: 'power2.inOut'
  }, 0);

  // Outgoing scene: fade out at end
  tl.to(outgoing, {
    opacity: 0,
    duration: 0.2,
    ease: 'none'
  }, 0.6);

  // Incoming scene: scale settle
  tl.fromTo(incoming,
    { scale: 1.15 },
    { scale: 1, duration: 0.8, ease: 'power2.out' },
    0
  );

  // Text out: staggered slide + fade
  tl.to(`${outgoing} [data-animate="text"]`, {
    x: -60,
    opacity: 0,
    duration: 0.4,
    stagger: 0.05,
    ease: 'power2.in'
  }, 0);

  // Text in: staggered slide + fade
  tl.fromTo(`${incoming} [data-animate="text"]`,
    { x: 60, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out' },
    0.25
  );

  // Play button pulse
  tl.to('.play-button', {
    scale: 1.05,
    duration: 0.1,
    ease: 'power2.out'
  }, 0);

  tl.to('.play-button', {
    scale: 1,
    duration: 0.2,
    ease: 'power2.out'
  }, 0.6);

  return tl;
}
```

### 10.2 Pattern: Floating Leaves

```javascript
function animateLeaves(container) {
  const leaves = container.querySelectorAll('.leaf');

  leaves.forEach((leaf, i) => {
    // Continuous rotation
    gsap.to(leaf, {
      rotation: 360,
      duration: 10 + (i * 2), // Vary per leaf
      ease: 'none',
      repeat: -1
    });

    // Floating Y motion
    gsap.to(leaf, {
      y: '+=20',
      duration: 3 + (i * 0.5),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    // Subtle X drift
    gsap.to(leaf, {
      x: '+=5',
      duration: 5 + (i * 0.7),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });
  });
}
```

### 10.3 Pattern: Scroll Indicator

```javascript
function createScrollIndicator(element) {
  const pill = element.querySelector('.scroll-indicator__pill');
  const tl = gsap.timeline({ paused: true });

  tl.fromTo(pill,
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
  );

  tl.to(pill, {
    scale: 1.1,
    duration: 0.15,
    ease: 'power2.out'
  });

  tl.to(pill, {
    scale: 1,
    duration: 0.15,
    ease: 'power2.in'
  });

  return {
    activate: () => tl.play(),
    reset: () => tl.reverse()
  };
}
```

---

## 11. Performance Notes

### GPU-Accelerated Properties (Use These)

```css
.animated-element {
  /* These properties are GPU-composited */
  transform: translateX() scale() rotate();
  opacity: 0-1;
  clip-path: circle();

  /* Hint to browser for optimization */
  will-change: transform, opacity, clip-path;
  contain: layout style paint;
}
```

### Properties to Avoid Animating

| Property | Issue | Alternative |
|----------|-------|-------------|
| `width`, `height` | Triggers layout | Use `transform: scale()` |
| `top`, `left` | Triggers layout | Use `transform: translate()` |
| `margin`, `padding` | Triggers layout | Use `transform: translate()` |
| `border-radius` | Expensive paint | Avoid animating |
| `box-shadow` | Expensive paint | Use pseudo-element or opacity |

### Mobile Considerations

```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .scene--outgoing {
    transition: opacity 0.3s ease;
  }

  /* Disable complex animations */
  .leaf { animation: none; }
}
```

### Performance Budget

| Metric | Target |
|--------|--------|
| Animation frame rate | 60fps |
| JS execution per frame | < 2ms |
| First contentful paint | < 1.5s |
| Total bundle (animation) | < 80kb gzipped |

---

## 12. Assumptions & Clarifications Needed

### Assumptions Made

| Item | Assumption | Confidence |
|------|------------|------------|
| Original video speed | ~3x slower than real-time | Medium |
| Easing curves | Approximated from visual analysis | Medium |
| Sun position | Both suns at identical coordinates | High (visual evidence) |
| Text animation direction | Left = exit left, enter from right | High |
| Mask anchor | Centered on play button | High |
| Leaf count | 4-5 leaves | Medium |

### Clarifications Needed

1. **Trigger mechanism:** Is the transition triggered by scroll, click, swipe, or auto-advancement?
2. **Reverse direction:** Does scrolling/swiping backward reverse the animation?
3. **Interrupted transitions:** What happens if user triggers next transition mid-animation?
4. **Keyboard navigation:** How should arrow keys / tab navigation work?
5. **Touch gestures:** Is there swipe-to-advance on mobile?
6. **Auto-play timing:** If auto-advancing, what is the interval between scenes?

---

## Appendix A: Frame Reference

Key frames used in analysis (extracted at 2fps):

| Frame | Time (slowed) | Scene State |
|-------|---------------|-------------|
| 0001 | 0.0s | Kingfisher, idle |
| 0010 | 5.0s | Kingfisher, pre-transition |
| 0012 | 6.0s | Transition starting, edge bleed visible |
| 0013 | 6.5s | Mid-transition, portal at ~50% |
| 0014 | 7.0s | Transition ending, deer emerging |
| 0015 | 7.5s | Deer, settling |
| 0020 | 10.0s | Deer, idle with floating leaves |
| 0031 | 15.5s | Transition starting (deer → elephant) |
| 0032 | 16.0s | Mid-transition |
| 0033 | 16.5s | Transition ending |
| 0035 | 17.5s | Elephant, settling |
| 0048 | 24.0s | Elephant, final state |

---

## Appendix B: CSS Custom Properties Reference

```css
:root {
  /* Timing */
  --transition-duration: 800ms;
  --text-out-duration: 400ms;
  --text-in-duration: 450ms;
  --text-in-delay: 250ms;

  /* Easing */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-portal: cubic-bezier(0.65, 0, 0.35, 1);

  /* Positions */
  --portal-center-x: 50%;
  --portal-center-y: 45%;
  --sun-center-y: 42%;

  /* Scales */
  --incoming-start-scale: 1.15;
  --outgoing-end-scale: 0.3;

  /* Colors - Kingfisher */
  --sun-kingfisher: #F5C542;

  /* Colors - Deer */
  --sun-deer: #E85D3B;

  /* Colors - Elephant */
  --sun-elephant: #F58220;
}
```

---

*Specification generated from video analysis. Last updated: 2024-12-30*
