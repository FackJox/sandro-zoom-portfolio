# Portal Zoom Portfolio Design

## Overview

Sandro's portfolio using scroll-linked portal zoom transitions between sections. Each section pins the viewport; scrolling scrubs the timeline at the configured `scrollSpeed`.

**Tool Separation:**
| Layer | Tool | Owns |
|-------|------|------|
| Static styling | PandaCSS | Layout, colors, typography, spacing |
| Animation | GSAP | Timing, easing, scroll-linking, orchestration |

---

## Section Flow

```
HERO (with logos) → FILM → FILM STORIES → ABOUT ME → SERVICES → FINAL CONTACT
```

All section-to-section transitions use the **portal zoom** mechanism.

---

## Portal Zoom Transition Specification

### Mechanism

The outgoing scene is clipped to a circular mask centered at 50% X, 45% Y. The mask shrinks **faster** than the scale, creating a "closing iris" effect.

### Anchor Point

| Property | Value |
|----------|-------|
| X | 50% (horizontal center) |
| Y | 45% (slightly above vertical center) |

### Outgoing Scene

| Property | From | To | Duration | Delay | Easing |
|----------|------|-----|----------|-------|--------|
| `scale` | 1.0 | 0.3 | 800ms | 0ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `clip-path` | `circle(150% at 50% 45%)` | `circle(0% at 50% 45%)` | 800ms | 0ms | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `opacity` | 1.0 | 0.0 | 200ms | 600ms | `linear` |

### Incoming Scene

| Property | From | To | Duration | Delay | Easing |
|----------|------|-----|----------|-------|--------|
| `scale` | 1.15 | 1.0 | 800ms | 0ms | `cubic-bezier(0, 0, 0.2, 1)` |
| `opacity` | 0.85 | 1.0 | 400ms | 0ms | `ease-out` |

### Outgoing Text

| Element | Property | From | To | Duration | Delay | Easing |
|---------|----------|------|-----|----------|-------|--------|
| Title | `translateX` | 0 | -60px | 400ms | 0ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Title | `opacity` | 1 | 0 | 400ms | 0ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Description | `translateX` | 0 | -40px | 350ms | 50ms | `cubic-bezier(0.4, 0, 1, 1)` |
| Description | `opacity` | 1 | 0 | 350ms | 50ms | `cubic-bezier(0.4, 0, 1, 1)` |

### Incoming Text

| Element | Property | From | To | Duration | Delay | Easing |
|---------|----------|------|-----|----------|-------|--------|
| Title | `translateX` | 60px | 0 | 450ms | 250ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Title | `opacity` | 0 | 1 | 450ms | 250ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Description | `translateX` | 40px | 0 | 400ms | 350ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Description | `opacity` | 0 | 1 | 400ms | 350ms | `cubic-bezier(0, 0, 0.2, 1)` |

### Differential Timing (The Iris Effect)

| Progress | Scale | Mask Radius | Visual Effect |
|----------|-------|-------------|---------------|
| 0% | 1.0 | 150% | Full scene visible |
| 25% | 0.85 | 80% | Edges begin clipping |
| 50% | 0.65 | 50% | Circle clearly visible |
| 75% | 0.45 | 25% | Small portal, content compressed |
| 100% | 0.3 | 0% | Scene fully hidden |

---

## GSAP Implementation

```typescript
function createPortalTransition(outgoing: string, incoming: string) {
  const tl = gsap.timeline({ paused: true })

  // Register custom easing for the mask (steeper curve)
  CustomEase.create('irisMask', 'M0,0 C0.65,0 0.35,1 1,1')

  // Outgoing: SCALE (slower easing)
  tl.to(outgoing, {
    scale: 0.3,
    duration: 0.8,
    ease: 'power2.inOut'
  }, 0)

  // Outgoing: MASK (faster/steeper easing) - SEPARATE TWEEN
  tl.to(outgoing, {
    clipPath: 'circle(0% at 50% 45%)',
    duration: 0.8,
    ease: 'irisMask'
  }, 0)

  // Outgoing: final opacity fade
  tl.to(outgoing, {
    opacity: 0,
    duration: 0.2,
    ease: 'none'
  }, 0.6)

  // Incoming: scale settle + opacity
  tl.fromTo(incoming,
    { scale: 1.15, opacity: 0.85 },
    { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' },
    0
  )

  // Text out (staggered)
  tl.to(`${outgoing} [data-animate="text"]`, {
    x: -60,
    opacity: 0,
    duration: 0.4,
    stagger: 0.05,
    ease: 'power2.in'
  }, 0)

  // Text in (staggered, delayed)
  tl.fromTo(`${incoming} [data-animate="text"]`,
    { x: 60, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out' },
    0.25
  )

  return tl
}
```

---

## Section Configurations

### 1. HERO (includes logos)

```typescript
const hero: SectionConfig = {
  id: 'hero',
  duration: 3,

  layers: [
    {
      id: 'bg',
      type: 'video',
      src: '/video/showreel-loop.mp4',
      z: 0,
      style: { filter: 'saturate(0.3) contrast(1.1)' }
    }
  ],

  content: [
    {
      id: 'slab',
      component: HeroSlab,
      props: {
        title: 'sandrogh',
        tagline: 'HIGH ALTITUDE & HOSTILE ENVIRONMENT',
        description: 'Over the past decade I\'ve documented some of the biggest stories from the world of high altitude mountaineering.'
      },
      position: { preset: 'center' },
      at: 0
    },
    {
      id: 'logos',
      component: LogoStrip,
      props: {
        logos: ['netflix', 'bbc', 'redbull', 'northface', 'berghaus', 'osprey']
      },
      position: { preset: 'bottom-center' },
      at: 0
    }
  ],

  animations: [
    { target: 'bg', action: 'fadeIn', duration: 0.8, at: 0 },
    { target: 'bg', action: 'zoom', scale: [1.02, 1.0], duration: 1.2, at: 0 },
    { target: 'slab', action: 'fadeIn', duration: 0.6, at: 0.2 },
    { target: 'logos', action: 'fadeIn', duration: 0.5, at: 0.4 }
  ]
}
```

### 2. FILM (14 Peaks, K2 Winter, K2 Summit)

```typescript
const film: SectionConfig = {
  id: 'film',
  duration: 8,

  layers: [
    {
      id: 'bg',
      type: 'image',
      src: '/images/film-bg.jpg',
      z: 0
    }
  ],

  content: [
    {
      id: 'label',
      component: SectionLabel,
      props: { text: 'FILM — HIGH ALTITUDE FEATURES' },
      position: { preset: 'top-left' },
      at: 0
    },
    {
      id: 'card-1',
      component: FilmCard,
      props: {
        title: '14 PEAKS: NOTHING IS IMPOSSIBLE',
        description: 'I worked as lead cinematographer on the Netflix documentary...',
        video: '/video/14-peaks-trailer.mp4'
      },
      position: { preset: 'center' },
      at: 0,
      until: 2.5
    },
    {
      id: 'card-2',
      component: FilmCard,
      props: {
        title: 'K2: WINTER EXPEDITION',
        description: 'Documenting the first winter ascent of K2...',
        video: '/video/k2-winter.mp4'
      },
      position: { preset: 'center' },
      at: 2.5,
      until: 5
    },
    {
      id: 'card-3',
      component: FilmCard,
      props: {
        title: 'K2 SUMMIT',
        description: 'The summit push that made history...',
        image: '/images/k2-summit.jpg'
      },
      position: { preset: 'center' },
      at: 5,
      until: 8
    },
    {
      id: 'progress',
      component: CardProgress,
      props: { total: 3 },
      position: { preset: 'bottom-center' },
      at: 0
    }
  ],

  animations: [
    { target: 'card-1', action: 'fadeIn', duration: 0.45, at: 0 },
    { target: 'card-1 [data-animate="text"]', action: 'slideIn', direction: 'up', stagger: 0.1, at: 0.25 },
    { target: 'card-1', action: 'fadeOut', duration: 0.3, at: 2.2 },
    { target: 'card-2', action: 'fadeIn', duration: 0.45, at: 2.5 },
    { target: 'card-2', action: 'fadeOut', duration: 0.3, at: 4.7 },
    { target: 'card-3', action: 'fadeIn', duration: 0.45, at: 5 }
  ]
}
```

### 3. FILM STORIES (Sasha, Grace, Afghanistan)

```typescript
const filmStories: SectionConfig = {
  id: 'film-stories',
  duration: 8,

  layers: [
    {
      id: 'bg',
      type: 'image',
      src: '/images/stories-bg.jpg',
      z: 0
    }
  ],

  content: [
    {
      id: 'label',
      component: SectionLabel,
      props: { text: 'FILM — FIELD STORIES' },
      position: { preset: 'top-left' },
      at: 0
    },
    {
      id: 'card-sasha',
      component: StoryCard,
      props: {
        title: 'SASHA / NO DAYS OFF',
        description: 'In 2022 I filmed episode 1 of No Days Off for Red Bull TV...',
        video: '/video/sasha.mp4'
      },
      position: { preset: 'center' },
      at: 0,
      until: 2.5
    },
    {
      id: 'card-grace',
      component: StoryCard,
      props: {
        title: 'GRACE / MENTAL HEALTH',
        description: 'I directed, shot and edited this piece on mental health...',
        video: '/video/grace.mp4'
      },
      position: { preset: 'center' },
      at: 2.5,
      until: 5
    },
    {
      id: 'card-afghanistan',
      component: StoryCard,
      props: {
        title: 'AFGHANISTAN / CHARLES SCHWAB',
        description: 'Filmed during one of six trips to Afghanistan...',
        video: '/video/afghanistan.mp4'
      },
      position: { preset: 'center' },
      at: 5,
      until: 8
    },
    {
      id: 'progress',
      component: CardProgress,
      props: { labels: ['Sasha', 'Grace', 'Afghanistan'] },
      position: { preset: 'bottom-center' },
      at: 0
    }
  ],

  animations: [
    { target: 'card-sasha', action: 'fadeIn', duration: 0.45, at: 0 },
    { target: 'card-sasha', action: 'fadeOut', duration: 0.3, at: 2.2 },
    { target: 'card-grace', action: 'fadeIn', duration: 0.45, at: 2.5 },
    { target: 'card-grace', action: 'fadeOut', duration: 0.3, at: 4.7 },
    { target: 'card-afghanistan', action: 'fadeIn', duration: 0.45, at: 5 }
  ]
}
```

### 4. ABOUT ME (3 beats)

```typescript
const aboutMe: SectionConfig = {
  id: 'about',
  duration: 8,

  layers: [
    {
      id: 'bg-frontline',
      type: 'image',
      src: '/images/frontline.jpg',
      z: 0,
      at: 0,
      until: 2.5
    },
    {
      id: 'bg-origin',
      type: 'image',
      src: '/images/city-army.jpg',
      z: 0,
      at: 2.5,
      until: 5
    },
    {
      id: 'bg-values',
      type: 'image',
      src: '/images/mountains-human.jpg',
      z: 0,
      at: 5
    }
  ],

  content: [
    {
      id: 'label',
      component: SectionLabel,
      props: { text: 'ABOUT ME' },
      position: { preset: 'top-left' },
      at: 0
    },
    {
      id: 'beat-1',
      component: AboutBeat,
      props: {
        subtitle: 'FRONT-LINE PERSPECTIVE',
        text: 'Over the past decade I\'ve documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan...'
      },
      position: { preset: 'center' },
      at: 0,
      until: 2.5
    },
    {
      id: 'beat-2',
      component: AboutBeat,
      props: {
        subtitle: 'ORIGIN STORY',
        text: 'A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings...'
      },
      position: { preset: 'center' },
      at: 2.5,
      until: 5
    },
    {
      id: 'beat-3',
      component: AboutBeat,
      props: {
        subtitle: 'VALUES & WORK',
        text: 'With feeling and fortitude I have the experience to bring human stories from the world\'s most inhumane corners...'
      },
      position: { preset: 'center' },
      at: 5
    }
  ],

  animations: [
    { target: 'bg-frontline', action: 'fadeIn', duration: 0.5, at: 0 },
    { target: 'beat-1', action: 'fadeIn', duration: 0.45, at: 0.2 },
    { target: 'bg-frontline', action: 'fadeOut', duration: 0.4, at: 2.2 },
    { target: 'bg-origin', action: 'fadeIn', duration: 0.4, at: 2.3 },
    { target: 'beat-1', action: 'fadeOut', duration: 0.3, at: 2.2 },
    { target: 'beat-2', action: 'fadeIn', duration: 0.45, at: 2.5 },
    { target: 'bg-origin', action: 'fadeOut', duration: 0.4, at: 4.7 },
    { target: 'bg-values', action: 'fadeIn', duration: 0.4, at: 4.8 },
    { target: 'beat-2', action: 'fadeOut', duration: 0.3, at: 4.7 },
    { target: 'beat-3', action: 'fadeIn', duration: 0.45, at: 5 }
  ]
}
```

### 5. SERVICES (credits on black)

```typescript
const services: SectionConfig = {
  id: 'services',
  duration: 5,

  layers: [
    {
      id: 'bg',
      type: 'solid',
      color: '#0a0a0a',
      z: 0
    }
  ],

  content: [
    {
      id: 'credits',
      component: ServicesCredits,
      props: {
        lines: [
          'MOUNTAIN DOP',
          'EXPEDITION & PRODUCT PHOTOGRAPHY',
          'AERIAL CINEMATOGRAPHY',
          'STOCK FOOTAGE'
        ]
      },
      position: { preset: 'center' },
      at: 0
    },
    {
      id: 'cta',
      component: ScrollCTA,
      props: { text: 'ONE MORE SHOT ↓' },
      position: { preset: 'bottom-center' },
      at: 3
    }
  ],

  animations: [
    { target: 'credits', action: 'fadeIn', duration: 0.5, at: 0 },
    { target: 'cta', action: 'fadeIn', duration: 0.4, at: 3 }
  ]
}
```

### 6. FINAL CONTACT (3D camera reveal)

```typescript
const finalContact: SectionConfig = {
  id: 'contact',
  duration: 4,

  layers: [
    {
      id: 'bg',
      type: 'image',
      src: '/images/bts-scene.jpg',
      z: 0
    },
    {
      id: 'camera-3d',
      type: '3d',
      component: Camera3D,
      props: {
        lcdContent: 'services'
      },
      z: 50,
      position: { preset: 'bottom-right' }
    }
  ],

  content: [
    {
      id: 'contact-text',
      component: ContactBlock,
      props: {
        headline: 'If you have a story to tell please get in touch.',
        phone: '+44 7880 352909',
        email: 'sandro.gromen-hayes@live.com'
      },
      position: { preset: 'center-left' },
      at: 0.5
    }
  ],

  animations: [
    { target: 'bg', action: 'fadeIn', duration: 0.6, at: 0 },
    { target: 'camera-3d', action: 'fadeIn', duration: 0.8, at: 0.2 },
    { target: 'contact-text', action: 'fadeIn', duration: 0.5, at: 0.5 },
    { target: 'contact-text [data-animate="text"]', action: 'slideIn', direction: 'up', stagger: 0.1, at: 0.6 }
  ]
}
```

---

## Portal Transitions Between Sections

```typescript
const transitions: TransitionConfig[] = [
  { from: 'hero', to: 'film', type: 'portal' },
  { from: 'film', to: 'film-stories', type: 'portal' },
  { from: 'film-stories', to: 'about', type: 'portal' },
  { from: 'about', to: 'services', type: 'portal' },
  { from: 'services', to: 'contact', type: 'portal' }
]
```

---

## Time-to-Scroll Mapping

```typescript
const config = {
  totalDuration: 36, // sum of all section durations
  scrollSpeed: 65,   // px/s
  transitionDuration: 0.8 // seconds per portal transition
}

// Derived
const transitionScrollDistance = config.transitionDuration * config.scrollSpeed // 52px
```

---

## Layer Stack During Transition

```
┌─────────────────────────────────────────────────────────────────┐
│ [Z: 100] PERSISTENT UI (header, footer)                         │
│          - Never masked, always visible                         │
├─────────────────────────────────────────────────────────────────┤
│ [Z: 20]  OUTGOING SCENE                                         │
│          - clip-path: circle(R% at 50% 45%)                     │
│          - transform: scale(S)                                  │
│          - transform-origin: 50% 45%                            │
├─────────────────────────────────────────────────────────────────┤
│ [Z: 10]  INCOMING SCENE                                         │
│          - Full bleed, no mask                                  │
│          - transform: scale(1.15 → 1.0)                         │
│          - transform-origin: 50% 45%                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deferred Features

To be added after core portal transition is working:

- Lens bug (persistent viewfinder HUD element)
- Metadata morph (hero → logos)
- Lens detach effects
- Netflix logo iris zoom
- Grid flip transition (About → Services)
- Concentric lens rings during zoom-out

---

*Design validated: 2025-12-30*
