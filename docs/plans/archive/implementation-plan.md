# svelte-scrollytelling Implementation Plan

## Overview

Implementation of the svelte-scrollytelling boilerplate from design spec. Organized into 10 batches with review checkpoints.

---

## Batch 1: Foundation & Project Setup

### 1.1 Install GSAP dependencies
- [ ] Install `gsap` and GSAP plugins (ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin, MotionPathPlugin)
- [ ] Create `src/lib/gsap/register.ts` for plugin registration
- [ ] Verify GSAP Club license setup for premium plugins

### 1.2 Create project structure
- [ ] Create directory structure per design spec:
  ```
  src/lib/
  ├── core/
  ├── animation/primitives/
  ├── layers/
  ├── content/
  ├── responsive/
  ├── components/
  └── dev/
  ```
- [ ] Create `src/experience/` for showcase example

### 1.3 Configure path aliases
- [ ] Update `svelte.config.js` with aliases:
  - `$lib` → `src/lib`
  - `$experience` → `src/experience`
  - `$styled` → `styled-system`

### 1.4 Create scrollytelling.config.ts
- [ ] Create root config file with default values
- [ ] Define `ScrollytellingConfig` interface
- [ ] Set defaults: `totalDuration: 60`, `scrollSpeed: 65`

**Checkpoint: Project builds, imports resolve, GSAP registers**

---

## Batch 2: Core Type System

### 2.1 Base types (`src/lib/types/`)
- [ ] `config.ts` - ScrollytellingConfig, ExperienceConfig
- [ ] `section.ts` - SectionConfig, SectionID type
- [ ] `layer.ts` - LayerConfig, LayerGroupConfig, LayerID type
- [ ] `animation.ts` - AnimationConfig, AnimationAction union, timing types
- [ ] `content.ts` - ContentConfig, ContentID type
- [ ] `position.ts` - Position, Region, Preset types
- [ ] `scroll-state.ts` - ScrollState interface
- [ ] `index.ts` - Re-export all types

### 2.2 Easing types
- [ ] Define `Ease` union type with named easings + GSAP string passthrough
- [ ] Create easing constants object

### 2.3 Animation primitive types
- [ ] Type signatures for each primitive (fadeIn, slideIn, zoom, etc.)
- [ ] Props interfaces for each primitive
- [ ] `AnimationPrimitive` discriminated union

**Checkpoint: All types compile, no `any` types, IntelliSense works**

---

## Batch 3: Core Timeline System

### 3.1 Timeline creation (`src/lib/core/timeline.ts`)
- [ ] `createMasterTimeline(config)` - Creates scroll-scrubbed GSAP timeline
- [ ] `timeToScroll(seconds)` - Convert seconds to scroll position (0-1)
- [ ] `scrollToTime(position)` - Convert scroll position to seconds
- [ ] Timeline state store (Svelte 5 runes)

### 3.2 Scroll system (`src/lib/core/scroll.ts`)
- [ ] `createScrollSmoother(options)` - Initialize ScrollSmoother
- [ ] Scroll state reactive store: `progress`, `velocity`, `direction`
- [ ] Section boundary calculations from animation durations
- [ ] Cleanup/destroy functions

### 3.3 Experience detection (`src/lib/core/experience.ts`)
- [ ] `detectExperience()` - Returns 'desktop' | 'mobile'
- [ ] Media query matching for orientation + pointer type
- [ ] Capability detection: GPU, memory, reduced motion
- [ ] Experience state store with reactive updates

### 3.4 Frame scaling (`src/lib/core/frame.ts`)
- [ ] `calculateFrameTransform(reference, viewport, scaling)` - Returns scale + offset
- [ ] Cover/contain/fill scaling modes
- [ ] Min/max scale clamping
- [ ] Viewport resize handling

**Checkpoint: Timeline scrubs via scroll, frame scales correctly, experience detected**

---

## Batch 4: Animation Primitives

### 4.1 Opacity primitives (`src/lib/animation/primitives/fade.ts`)
- [ ] `fadeIn(duration?, ease?)` - Returns GSAP tween config
- [ ] `fadeOut(duration?, ease?)`
- [ ] `crossfade(toTarget, duration?, ease?)` - Coordinated opacity swap

### 4.2 Position primitives (`src/lib/animation/primitives/slide.ts`)
- [ ] `slideIn(direction, distance?, duration?, ease?)`
- [ ] `slideOut(direction, distance?, duration?, ease?)`
- [ ] `pan(props: { x?, y?, duration?, ease? })`

### 4.3 Scale/zoom primitives (`src/lib/animation/primitives/zoom.ts`)
- [ ] `zoom(props: { scale: [from, to], pan?, rotate?, duration?, ease? })`
- [ ] `scale(from?, to?, duration?, ease?)` - Simple scale

### 4.4 Parallax primitive (`src/lib/animation/primitives/parallax.ts`)
- [ ] `parallax(props: { speed, axis?, trigger? })`
- [ ] Scroll-linked continuous animation
- [ ] Mouse-triggered variant
- [ ] Z-index based speed auto-calculation

### 4.5 Depth primitives (`src/lib/animation/primitives/dimension.ts`)
- [ ] `dimension(props: { z?, recede?, approach?, duration?, ease? })`
- [ ] Perspective transform handling
- [ ] Scale + blur for depth simulation

### 4.6 Morph primitive (`src/lib/animation/primitives/morph.ts`)
- [ ] `morph(toShape, duration?, ease?)` - SVG path morphing
- [ ] Shape compatibility validation
- [ ] Integration with DrawSVGPlugin

### 4.7 Mask primitive (`src/lib/animation/primitives/mask.ts`)
- [ ] `mask(props: { shape, content: { pan?, scale?, rotate? }, duration?, ease? })`
- [ ] CSS clip-path or SVG mask
- [ ] Content animation within mask bounds

### 4.8 Sequencing primitives (`src/lib/animation/primitives/stagger.ts`)
- [ ] `stagger(targets[], props: { animation, delay, overlap?, direction? })`
- [ ] Forward/reverse/center/edges directions
- [ ] Overlap ratio for timing control

### 4.9 Physics primitives (`src/lib/animation/primitives/follow-through.ts`)
- [ ] `followThrough(props: { settle, wobble?, duration?, ease? })`
- [ ] Elastic overshoot effect
- [ ] Secondary motion wobble

### 4.10 Transform primitive (`src/lib/animation/primitives/transform.ts`)
- [ ] `transform(props: { scale?, rotate?, skew?, duration?, ease? })`
- [ ] From/to array support for each property

### 4.11 Composer (`src/lib/animation/composer.ts`)
- [ ] `combined(animations[])` - Merge multiple primitives
- [ ] Timeline position resolution for relative timing (`+=0.2`, `label+0.3`)
- [ ] Animation dependency graph

### 4.12 GSAP passthrough (`src/lib/animation/gsap-passthrough.ts`)
- [ ] `gsapRaw(config)` - Direct GSAP tween/timeline config
- [ ] Keyframes support
- [ ] Full GSAP API access

### 4.13 Easing (`src/lib/animation/easing.ts`)
- [ ] Named easing constants: `linear`, `ease`, `easeIn`, `easeOut`, `cubic`
- [ ] Easing resolver function (named → GSAP string)

### 4.14 Primitive index (`src/lib/animation/primitives/index.ts`)
- [ ] Re-export all primitives
- [ ] Type exports

**Checkpoint: Each primitive creates valid GSAP config, combined works**

---

## Batch 5: Layer System

### 5.1 Layer types (`src/lib/layers/types.ts`)
- [ ] `LayerConfig` interface with all properties
- [ ] `LayerGroupConfig` with children
- [ ] Default z-index constants: `BG: 0`, `MG: 50`, `FG: 100`
- [ ] Layer ID inference for type safety

### 5.2 Layer component (`src/lib/layers/Layer.svelte`)
- [ ] Render single layer (img, video, or canvas)
- [ ] Apply z-index, position, size from config
- [ ] `data-layer` attribute for GSAP targeting
- [ ] Initial opacity/scale from config
- [ ] Parallax prop handling (shorthand to full config)

### 5.3 LayerGroup component (`src/lib/layers/LayerGroup.svelte`)
- [ ] Wrapper div with group transform
- [ ] Render children layers
- [ ] `data-layer-group` attribute for GSAP targeting
- [ ] Relative z-index within group

### 5.4 LayerStack component (`src/lib/layers/LayerStack.svelte`)
- [ ] Render all layers from section config
- [ ] Handle both flat layers and groups
- [ ] Sort by z-index
- [ ] Absolute positioning within frame

**Checkpoint: Layers render, z-order correct, groups animate together**

---

## Batch 6: Content System

### 6.1 ScrollState (`src/lib/content/scroll-state.ts`)
- [ ] `ScrollState` interface implementation
- [ ] Context-based state injection
- [ ] Progress calculation per content lifespan
- [ ] Section and global progress derivation

### 6.2 Content component (`src/lib/content/Content.svelte`)
- [ ] Render Svelte component with props
- [ ] Wrapper div for GSAP animation
- [ ] `data-content` attribute for targeting
- [ ] Mount/unmount based on `at`/`until` timing
- [ ] Optional ScrollState prop injection

### 6.3 ContentSlot component (`src/lib/content/ContentSlot.svelte`)
- [ ] Position content using responsive system
- [ ] Apply preset or explicit position
- [ ] Anchor point handling
- [ ] Pixel offset support

### 6.4 Content container (`src/lib/content/ContentContainer.svelte`)
- [ ] Render all content from section config
- [ ] Manage content lifecycle (mount/unmount timing)
- [ ] ScrollState context provider

**Checkpoint: Components render, mount/unmount by time, receive scroll state**

---

## Batch 7: Responsive System

### 7.1 Regions (`src/lib/responsive/regions.ts`)
- [ ] Semantic region definitions (left-third, center, right-third, etc.)
- [ ] Region to coordinates calculation
- [ ] Safe zone awareness in calculations
- [ ] 3x3 grid cell naming

### 7.2 Presets (`src/lib/responsive/presets.ts`)
- [ ] Golden ratio presets: `golden-left` (38.2%), `golden-right` (61.8%)
- [ ] Rule of thirds: `third-left`, `third-right`, `thirds-intersect-*`
- [ ] Rule of fifths: `fifth-1` through `fifth-4`
- [ ] Center variants: `center`, `center-left`, `center-top`, etc.
- [ ] Preset resolver function

### 7.3 Safe zones (`src/lib/responsive/safe-zones.ts`)
- [ ] Device-specific insets (mobile, tablet, desktop)
- [ ] `env(safe-area-inset-*)` integration
- [ ] Safe zone calculation for current experience
- [ ] Safe zone CSS custom properties

### 7.4 Fluid sizing (`src/lib/responsive/fluid.ts`)
- [ ] `generateFluidScale(config)` - Create CSS clamp() values
- [ ] Type scale generation (xs through 3xl)
- [ ] Space scale generation (3xs through 3xl)
- [ ] CSS custom property generation
- [ ] PandaCSS token integration

### 7.5 Position resolver (`src/lib/responsive/position.ts`)
- [ ] `resolvePosition(config, frame, experience)` - Final coordinates
- [ ] Preset lookup
- [ ] Region calculation
- [ ] Explicit x/y passthrough
- [ ] Anchor point adjustment

**Checkpoint: Positions resolve correctly across experiences, fluid sizes scale**

---

## Batch 8: Main Components

### 8.1 ScrollContainer (`src/lib/components/ScrollContainer.svelte`)
- [ ] Initialize ScrollSmoother on mount
- [ ] Scroll spacer div for scroll distance
- [ ] Provide scroll context to children
- [ ] Cleanup on destroy

### 8.2 Stage (`src/lib/components/Stage.svelte`)
- [ ] Pinned viewport container
- [ ] Apply frame scaling
- [ ] Reference dimensions from config
- [ ] `data-stage` attribute

### 8.3 Section (`src/lib/components/Section.svelte`)
- [ ] Accept `SectionConfig` prop
- [ ] Render LayerStack
- [ ] Render ContentContainer
- [ ] Create section timeline from animations
- [ ] Add timeline to master at calculated position
- [ ] Handle mobile variant switching
- [ ] `data-section` attribute

### 8.4 Timeline builder (`src/lib/core/section-timeline.ts`)
- [ ] Parse animation configs into GSAP timeline
- [ ] Resolve relative timing (`+=`, `label+`)
- [ ] Apply primitives to targets
- [ ] Handle combined animations
- [ ] Calculate section duration from animations

### 8.5 Public index (`src/lib/index.ts`)
- [ ] Export all public components
- [ ] Export all primitives
- [ ] Export all types
- [ ] Export responsive utilities
- [ ] Export dev tools

**Checkpoint: Full section renders with layers, content, animations**

---

## Batch 9: Developer Experience

### 9.1 Debugger overlay (`src/lib/dev/Debugger.svelte`)
- [ ] Timeline progress display (time + percentage)
- [ ] Current section indicator with progress bar
- [ ] Active animations list
- [ ] Layer visibility toggles
- [ ] Manual timeline scrubber
- [ ] Section jump buttons
- [ ] Play/pause toggle
- [ ] Bounding box overlay toggle
- [ ] Position: configurable corner

### 9.2 HMR preservation (`src/lib/dev/hmr.ts`)
- [ ] Store scroll position before HMR
- [ ] Restore after HMR complete
- [ ] Section state preservation
- [ ] Animation state handling ('soft' reset)
- [ ] Vite HMR API integration

### 9.3 Config validation (`src/lib/dev/validation.ts`)
- [ ] Validate layer IDs in animations reference existing layers
- [ ] Validate content IDs in animations reference existing content
- [ ] Check for timing conflicts (overlapping animations on same target)
- [ ] Validate position presets exist
- [ ] Validate animation props per action type
- [ ] Runtime warnings in dev mode
- [ ] TypeScript compile-time validation via generics

**Checkpoint: Debugger shows state, HMR preserves scroll, validation catches errors**

---

## Batch 10: Documentation & CLAUDE.md

### 10.1 CLAUDE.md
- [ ] Project overview and architecture
- [ ] Development commands
- [ ] File structure explanation
- [ ] Key patterns and conventions
- [ ] Type system overview
- [ ] Animation primitive reference
- [ ] Responsive system guide
- [ ] Common tasks and how-tos

### 10.2 README.md
- [ ] Project description and features
- [ ] Installation instructions
- [ ] Quick start guide
- [ ] Basic usage example
- [ ] Links to full documentation

### 10.3 API Documentation (`docs/api/`)
- [ ] `config.md` - Configuration options
- [ ] `components.md` - Component reference
- [ ] `primitives.md` - Animation primitives with examples
- [ ] `layers.md` - Layer system guide
- [ ] `content.md` - Content system guide
- [ ] `responsive.md` - Positioning and fluid sizing
- [ ] `types.md` - Type reference

### 10.4 Guides (`docs/guides/`)
- [ ] `getting-started.md` - Tutorial from scratch
- [ ] `creating-sections.md` - Section authoring
- [ ] `animations.md` - Animation patterns
- [ ] `responsive-design.md` - Mobile/desktop handling
- [ ] `performance.md` - Optimization tips
- [ ] `debugging.md` - Using dev tools

**Checkpoint: Documentation complete, CLAUDE.md accurate**

---

## Batch 11: Showcase Example

### 11.1 Design the showcase
- [ ] Use frontend-layouts skill for composition
- [ ] 3-4 sections demonstrating all features
- [ ] Section 1: Hero with all 3 layers (BG/MG/FG), parallax, fadeIn
- [ ] Section 2: Feature showcase with stagger, slideIn, zoom
- [ ] Section 3: Interactive with mask, morph, dimension
- [ ] Section 4: Finale with combined animations, crossfade

### 11.2 Showcase assets
- [ ] Create/source placeholder images for BG/MG/FG layers
- [ ] Organize in `static/assets/showcase/`
- [ ] Multiple aspect ratios for desktop/mobile

### 11.3 Showcase components (`src/experience/components/`)
- [ ] `Headline.svelte` - Fluid typography, scroll-aware
- [ ] `Card.svelte` - Feature card with animation
- [ ] `Badge.svelte` - Animated badge/tag
- [ ] `ProgressRing.svelte` - ScrollState-driven progress

### 11.4 Showcase sections (`src/experience/sections/`)
- [ ] `hero.ts` - All layer types, parallax, fadeIn, slideIn
- [ ] `features.ts` - Stagger, zoom, transform, content grid
- [ ] `interactive.ts` - Mask, morph, dimension, followThrough
- [ ] `finale.ts` - Combined animations, crossfade, all presets

### 11.5 Section: Hero
- [ ] 3-layer composition (BG sky, MG mountains, FG foliage)
- [ ] Layer group for parallax background
- [ ] Headline with fadeIn + slideIn combined
- [ ] Subhead with stagger
- [ ] All primitives: fadeIn, slideIn, parallax

### 11.6 Section: Features
- [ ] Feature cards with stagger reveal
- [ ] Zoom on scroll for emphasis
- [ ] Transform (rotate, scale) on elements
- [ ] Grid layout with semantic positioning
- [ ] Responsive: stack on mobile

### 11.7 Section: Interactive
- [ ] Mask reveal effect
- [ ] SVG morph demonstration
- [ ] Dimension (z-depth) parallax
- [ ] FollowThrough physics
- [ ] Mouse-triggered parallax

### 11.8 Section: Finale
- [ ] Crossfade between layer states
- [ ] Combined multi-primitive animation
- [ ] All position presets demonstrated
- [ ] Golden ratio, thirds, fifths markers
- [ ] Fluid sizing showcase

### 11.9 Experience assembly (`src/experience/index.ts`)
- [ ] Export all sections
- [ ] Mobile variants for each section

### 11.10 Main page (`src/routes/+page.svelte`)
- [ ] Import and render all sections
- [ ] Debugger in dev mode
- [ ] Full responsive experience

**Checkpoint: Showcase runs, demonstrates all features, mobile works**

---

## Batch 12: Polish & Testing

### 12.1 Type cleanup
- [ ] Run `npm run check` - fix all TypeScript errors
- [ ] Ensure no `any` types in public API
- [ ] Verify IntelliSense works for all exports

### 12.2 Linting
- [ ] Run `npm run lint` - fix all issues
- [ ] Consistent code style

### 12.3 Build verification
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works
- [ ] No console errors in production

### 12.4 Cross-browser testing
- [ ] Chrome desktop
- [ ] Safari desktop
- [ ] Firefox desktop
- [ ] Chrome mobile (DevTools)
- [ ] Safari mobile (DevTools)

### 12.5 Performance check
- [ ] 60fps scrolling
- [ ] No layout thrashing
- [ ] Reasonable bundle size

### 12.6 Final documentation review
- [ ] All examples work
- [ ] No outdated references
- [ ] CLAUDE.md matches implementation

**Checkpoint: Production-ready, all tests pass, documentation accurate**

---

## Execution Notes

### Parallel Work Opportunities
- Batch 4 (Animation Primitives) tasks can run in parallel
- Batch 7 (Responsive) can parallel with Batch 5-6
- Documentation (Batch 10) can start during Batch 8-9

### Dependencies
- Batch 3 (Core) required before Batch 4-8
- Batch 5 (Layers) + Batch 6 (Content) required before Batch 8 (Components)
- Batch 1-9 required before Batch 11 (Showcase)

### Review Checkpoints
After each batch, verify:
1. TypeScript compiles without errors
2. Dev server runs without console errors
3. Functionality matches design spec
4. Code follows project conventions
