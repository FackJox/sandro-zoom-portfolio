# Architecture

System design, data flow, and file structure of the svelte-scrollytelling boilerplate.

## Design Philosophy

1. **Time-based authoring** - Authors think in seconds, not scroll percentages
2. **Declarative configuration** - Define what, not how
3. **Progressive enhancement** - Degrades gracefully on low-tier devices
4. **HMR-safe** - No memory leaks during development
5. **Type-safe** - Full TypeScript with strict validation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Scroll Input                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ScrollSmoother                             │
│  - Normalizes scroll across devices                              │
│  - Applies data-speed/data-lag attributes                        │
│  - Provides smooth interpolation                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ScrollTrigger                              │
│  - Pins Stage during scroll                                      │
│  - Maps scroll position → timeline progress                      │
│  - Triggers section enter/leave events                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Master Timeline                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │ Section 1│ │ Section 2│ │ Section 3│  ...                    │
│  │ Timeline │ │ Timeline │ │ Timeline │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
│       ↓             ↓             ↓                              │
│  ┌──────────────────────────────────────────┐                   │
│  │           Animation Composer              │                   │
│  │  Routes config → primitives               │                   │
│  └──────────────────────────────────────────┘                   │
│       ↓             ↓             ↓                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                    │
│  │ fadeIn │ │slideIn │ │  zoom  │ │parallax│  ...               │
│  └────────┘ └────────┘ └────────┘ └────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Rendered Output                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      LayerStack                          │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                    │    │
│  │  │ z=0  bg │ │ z=50 mg │ │z=100 fg │                    │    │
│  │  └─────────┘ └─────────┘ └─────────┘                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       Content                            │    │
│  │  Positioned components with scroll state                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Configuration → Rendering

```
SectionConfig
     │
     ├── layers[] ─────────────► LayerStack ──► Layer components
     │
     ├── content[] ────────────► Content wrappers ──► User components
     │
     └── animations[] ─────────► Composer ──► Primitives ──► GSAP timeline
```

### Time → Scroll Conversion

```
User authors:     { at: 2.5, duration: 0.8 }  (seconds)
                           │
                           ▼
Timing system:    timeToScroll(2.5) = 2.5 / 60 = 0.0417  (proportion)
                           │
                           ▼
GSAP timeline:    timeline.to(target, {...}, 0.0417)  (timeline position)
                           │
                           ▼
ScrollTrigger:    Scroll 0-3900px maps to timeline 0-1
```

## File Structure

```
src/lib/
├── core/                       # Foundation systems
│   ├── register.ts             # GSAP plugin registration (singleton)
│   ├── scroll.ts               # ScrollSmoother management
│   ├── timeline.ts             # Timeline factory with gsap.context
│   ├── timing.ts               # Time↔scroll conversion
│   ├── experience.ts           # Desktop/mobile switching
│   ├── accessibility.ts        # Reduced motion support
│   ├── capabilities.ts         # Device tier detection
│   └── input.ts                # Observer-based input handling
│
├── animation/
│   ├── primitives/             # Animation factory functions
│   │   ├── fade.ts             # fadeIn, fadeOut, crossfade
│   │   ├── slide.ts            # slideIn, slideOut, pan
│   │   ├── zoom.ts             # zoom with scale/pan/rotate
│   │   ├── parallax.ts         # parallax effects
│   │   ├── transform.ts        # scale, rotate, skew
│   │   ├── stagger.ts          # staggered animations
│   │   ├── text.ts             # SplitText animations
│   │   ├── draw-svg.ts         # DrawSVGPlugin
│   │   ├── morph.ts            # MorphSVGPlugin
│   │   ├── motion-path.ts      # MotionPathPlugin
│   │   ├── physics.ts          # CustomBounce, inertia
│   │   ├── mask.ts             # Reveal masks
│   │   ├── dimension.ts        # Z-depth animations
│   │   ├── combined.ts         # Composite animations
│   │   └── index.ts            # Barrel exports
│   ├── easing.ts               # CustomEase, brand easings
│   ├── composer.ts             # Config → primitive router
│   ├── flip.ts                 # Flip plugin wrapper
│   └── gsap-passthrough.ts     # Raw GSAP escape hatch
│
├── layers/
│   ├── Layer.svelte            # Single layer (image/video/3D)
│   ├── LayerGroup.svelte       # Grouped layers
│   ├── LayerStack.svelte       # All layers with z-ordering
│   └── types.ts                # Layer type definitions
│
├── content/
│   ├── Content.svelte          # Positioned content wrapper
│   ├── ContentSlot.svelte      # Component slot with positioning
│   └── scroll-state.ts         # Reactive scroll state
│
├── responsive/
│   ├── frame.ts                # Reference frame scaling
│   ├── regions.ts              # Semantic 9-grid regions
│   ├── safe-zones.ts           # Device safe areas
│   ├── fluid.ts                # Utopia-style fluid sizing
│   └── presets.ts              # Position/layout presets
│
├── components/
│   ├── ScrollContainer.svelte  # Root scroll wrapper
│   ├── Stage.svelte            # Pinned viewport with scaling
│   └── Section.svelte          # Section with timeline
│
├── integrations/
│   └── threlte.ts              # Three.js/Threlte bridge
│
├── dev/
│   ├── Debugger.svelte         # Timeline scrubber, layer toggles
│   ├── GSDevTools.svelte       # GSAP inspector wrapper
│   ├── hmr.ts                  # HMR-safe utilities
│   └── validation.ts           # Config validation
│
├── types/
│   └── index.ts                # All TypeScript interfaces
│
└── index.ts                    # Public API exports
```

## Component Hierarchy

```
+page.svelte
└── ScrollContainer              # Root: GSAP init, ScrollSmoother
    └── Stage                    # Pinned viewport, frame scaling
        ├── Section              # Section 1: layers + content + timeline
        │   ├── LayerStack
        │   │   ├── Layer (bg)
        │   │   ├── Layer (mg)
        │   │   └── Layer (fg)
        │   └── Content[]
        │       └── UserComponent
        │
        ├── Section              # Section 2
        │   └── ...
        │
        └── Section              # Section N
            └── ...
```

## Singleton Management

### Why Singletons?

GSAP has global state. Multiple ScrollSmoother instances break scrolling. Multiple plugin registrations cause errors.

### Singleton Pattern

```typescript
// core/register.ts
let registered = false

export function initGSAP() {
  if (registered) return  // Guard
  gsap.registerPlugin(...)
  registered = true
}

// HMR reset
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    registered = false
  })
}
```

```typescript
// core/scroll.ts
let smoother: ScrollSmoother | null = null

export function getScrollSmoother(config?) {
  if (smoother) return smoother  // Return existing
  smoother = ScrollSmoother.create({ ... })
  return smoother
}

export function killScrollSmoother() {
  smoother?.kill()
  smoother = null
}
```

## Animation Context

### The Problem

GSAP animations persist in global state. Without cleanup:
- Memory leaks on component unmount
- Ghost animations on HMR
- Conflicting ScrollTriggers

### The Solution: gsap.context()

```typescript
let ctx: gsap.Context

$effect(() => {
  if (!container) return

  // All animations scoped to container
  ctx = gsap.context(() => {
    gsap.to('.element', { x: 100 })
    ScrollTrigger.create({ trigger: '.section', ... })
  }, container)

  // Single cleanup call kills everything
  return () => ctx.revert()
})
```

### Why This Works

1. `gsap.context()` records all animations/triggers created inside
2. `ctx.revert()` kills ALL recorded animations
3. Scope selector (second arg) limits queries to container
4. No manual tracking of individual tweens/triggers

## Experience Detection

### Binary Split

Desktop and mobile are treated as separate experiences:

```typescript
experiences: {
  desktop: {
    match: '(orientation: landscape), (pointer: fine)',
    frame: { width: 1920, height: 1080, scaling: 'cover' }
  },
  mobile: {
    match: '(orientation: portrait) and (pointer: coarse)',
    frame: { width: 390, height: 844, scaling: 'contain' }
  }
}
```

### Detection Flow

```
Window resize / orientation change
            │
            ▼
   matchMedia.matches
            │
            ▼
   Update experience state
            │
            ▼
   Merge mobile overrides
            │
            ▼
   Rebuild affected timelines
```

### Mobile Overrides

Section configs can include mobile variants:

```typescript
{
  id: 'hero',
  layers: [...],
  content: [...],
  animations: [...],

  mobile: {
    // These override base config on mobile
    content: [{ position: { preset: 'center-top' } }],
    animations: [/* simplified */]
  }
}
```

## Performance Tiers

### Detection

```typescript
type PerformanceTier = 'high' | 'medium' | 'low'

// High: 8GB+ memory, 8+ cores
// Medium: 4GB+ memory, 4+ cores
// Low: Below medium thresholds
```

### Feature Degradation

```typescript
// Content can specify tier requirement
{ performanceTier: 'high' }  // Only on high-tier devices

// 3D layers have fallback
{
  type: '3d',
  component: Scene3D,
  fallback: { src: '/static-image.jpg' }  // Used on low tier
}
```

### Capability-Based Features

```typescript
const capabilities = detectCapabilities()

if (capabilities.tier === 'low') {
  // Skip complex animations
  // Use static images instead of video
  // Disable parallax
}
```

## Next Steps

- [Core Systems](./core-systems.md) - Deep dive into GSAP setup
- [Animation Primitives](./animation-primitives.md) - All animation types
- [Patterns](./patterns.md) - Critical patterns to follow
