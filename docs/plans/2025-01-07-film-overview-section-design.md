# Film Overview Section Design

**Date:** 2025-01-07
**Status:** Approved

## Overview

A new `FilmOverviewSection` that displays all 4 films in a grid before transitioning to individual focus states with scroll-driven animations.

## Design Goals

- Display all films at a glance before diving into details
- Create a cinematic scroll-driven experience
- Follow Alpine Noir brand physics (Machine archetype)
- Reuse existing components where possible

---

## Layout Specifications

### Overview State

**Desktop (horizontal):**
```
┌──────────────────────────────────────────────────────────────────┐
│  FILM                                                            │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │             │ │             │ │             │ │             │ │
│  │  [video]    │ │  [image]    │ │  [video]    │ │  [video]    │ │
│  │             │ │             │ │             │ │             │ │
│  │─────────────│ │─────────────│ │─────────────│ │─────────────│ │
│  │14 PEAKS     │ │NO DAYS OFF  │ │GRACE        │ │AFGHANISTAN  │ │
│  │NETFLIX      │ │REDBULL TV   │ │MONTANE      │ │CHARLES SCHWAB│
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│   [accent]        [accent]        [accent]        [accent]       │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile (vertical stack):**
```
┌────────────────────┐
│  FILM              │
│                    │
│  ┌──────────────┐  │
│  │ 14 PEAKS     │  │
│  │ NETFLIX      │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │ NO DAYS OFF  │  │
│  │ REDBULL TV   │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │ GRACE        │  │
│  │ MONTANE      │  │
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │ AFGHANISTAN  │  │
│  │ CHARLES SCHWAB│ │
│  └──────────────┘  │
└────────────────────┘
```

**Specifications:**
- All frames use `BorderedViewport` with `brand.accent` (#f6c605) border
- Each frame contains media (video autoplays muted, or image)
- Title + client overlaid at bottom of each frame (dark gradient for legibility)
- Equal sizing: 25% each on desktop, stacked on mobile
- Aspect ratio: 2.39:1 (cinematic) on desktop, 16:9 on mobile

### Focus State

**Desktop (60/40 split):**
```
┌──────────────────────────────────────────────────────────────────┐
│  FILM — HIGH ALTITUDE FEATURES                                   │
│                                                                  │
│  ┌────────────────────────────────┐  ┌────────────────────────┐  │
│  │                                │  │ NETFLIX                │  │
│  │                                │  │                        │  │
│  │        [14 PEAKS video]        │  │ 14 PEAKS               │  │
│  │                                │  │                        │  │
│  │                                │  │ I worked as lead       │  │
│  │                                │  │ cinematographer on     │  │
│  └────────────────────────────────┘  │ Netflix's smash hit... │  │
│          [accent border]             │                        │  │
│                                      │ 2021                   │  │
│                                      └────────────────────────┘  │
│                                                                  │
│              ● ─ ─ ─ ○ ─ ─ ─ ○ ─ ─ ─ ○   [step indicator]       │
└──────────────────────────────────────────────────────────────────┘
```

**Mobile (stacked):**
```
┌────────────────────┐
│  FILM — HIGH...    │
│                    │
│  ┌──────────────┐  │
│  │              │  │
│  │ [14 PEAKS]   │  │
│  │              │  │
│  └──────────────┘  │
│                    │
│  NETFLIX           │
│  14 PEAKS          │
│                    │
│  I worked as lead  │
│  cinematographer...│
│                    │
│  ● ─ ○ ─ ○ ─ ○     │
└────────────────────┘
```

**Specifications:**
- Video/image in `BorderedViewport` with `brand.accent` border (only focused film)
- `ContentSlab` component displays eyebrow (client), title, description, year
- Section label transitions from "FILM" to "FILM — HIGH ALTITUDE FEATURES"
- `StepIndicator` shows current position
- Layout matches current `FilmSection` structure
- ContentSlab unchanged - full description on all viewports

---

## Animation Sequence

### Brand Physics Tokens

From `docs/Brand Physics Archetype.md`:

| Token | Value | Usage |
|-------|-------|-------|
| `ease-lock-on` | `cubic-bezier(0.19, 1.0, 0.22, 1.0)` | Entering elements |
| `ease-release` | `cubic-bezier(0.25, 0.0, 0.35, 1.0)` | Exiting elements |
| `brand-micro` | 175ms (0.175s) | Border color changes |
| `brand-standard` | 315ms (0.315s) | Content animations |
| `brand-cinematic` | 550ms (0.55s) | Major state changes |

### Easing Registration

Register brand physics easings in `src/lib/animation/easing.ts`:

```typescript
import { CustomEase } from 'gsap/CustomEase'

// Register brand easings (call once during GSAP init)
export function registerBrandEasings(): void {
  CustomEase.create('ease-lock-on', 'M0,0 C0.19,1 0.22,1 1,1')
  CustomEase.create('ease-release', 'M0,0 C0.25,0 0.35,1 1,1')
}
```

### Scroll Configuration

```typescript
// FilmOverviewSection scroll setup
ScrollTrigger.create({
  trigger: container,
  start: 'top top',
  end: '+=36s',      // 4 films × 9s each = 36s total
  scrub: 1,          // Smooth 1:1 scroll-to-animation
  pin: true,
  anticipatePin: 1,
  invalidateOnRefresh: true
})
```

### Timeline Per Film Cycle (~9s)

```typescript
// Film 1 cycle (0s - 9s)
animations: [
  // OVERVIEW STATE (0s) - all films fade in
  { target: 'film-1', action: 'fadeIn', duration: 0.55, at: 0, ease: 'ease-lock-on' },
  { target: 'film-2', action: 'fadeIn', duration: 0.55, at: 0, ease: 'ease-lock-on' },
  { target: 'film-3', action: 'fadeIn', duration: 0.55, at: 0, ease: 'ease-lock-on' },
  { target: 'film-4', action: 'fadeIn', duration: 0.55, at: 0, ease: 'ease-lock-on' },

  // BORDER FADE (0.8s) - non-focused borders: accent → phantom
  { target: 'border-2', action: 'gsap', gsap: { to: { borderColor: '#707977' }, duration: 0.175 }, at: 0.8 },
  { target: 'border-3', action: 'gsap', gsap: { to: { borderColor: '#707977' }, duration: 0.175 }, at: 0.8 },
  { target: 'border-4', action: 'gsap', gsap: { to: { borderColor: '#707977' }, duration: 0.175 }, at: 0.8 },

  // OTHERS EXIT (1.2s) - scale down + fade
  { target: 'film-2', action: 'combined', at: 1.2, animations: [
    { action: 'scaleOut', to: 0.85, duration: 0.55, ease: 'ease-release' },
    { action: 'fadeOut', duration: 0.55, ease: 'ease-release' }
  ]},
  { target: 'film-3', action: 'combined', at: 1.2, animations: [
    { action: 'scaleOut', to: 0.85, duration: 0.55, ease: 'ease-release' },
    { action: 'fadeOut', duration: 0.55, ease: 'ease-release' }
  ]},
  { target: 'film-4', action: 'combined', at: 1.2, animations: [
    { action: 'scaleOut', to: 0.85, duration: 0.55, ease: 'ease-release' },
    { action: 'fadeOut', duration: 0.55, ease: 'ease-release' }
  ]},

  // LABEL TRANSITION (1.8s)
  { target: 'section-label', action: 'scrambleText', text: 'FILM — HIGH ALTITUDE FEATURES', duration: 0.315, at: 1.8 },

  // LAYOUT SHIFT (2.0s) - film-1 moves to 60% position
  { target: 'film-1', action: 'gsap', gsap: { to: { width: '60%' }, duration: 0.55, ease: 'ease-lock-on' }, at: 2.0 },

  // CONTENT ENTER (2.6s)
  { target: 'content-slab-1', action: 'fadeIn', duration: 0.315, at: 2.6, ease: 'ease-lock-on' },
  { target: 'content-slab-1', action: 'slideIn', direction: 'right', distance: 40, duration: 0.315, at: 2.6 },

  // HOLD for reading (~3s)

  // CONTENT EXIT (5.6s)
  { target: 'content-slab-1', action: 'fadeOut', duration: 0.315, at: 5.6, ease: 'ease-release' },

  // LAYOUT RESET (6.0s) - film-1 back to 25%
  { target: 'film-1', action: 'gsap', gsap: { to: { width: '25%' }, duration: 0.55, ease: 'ease-release' }, at: 6.0 },

  // OTHERS RETURN (6.5s) - scale up + fade in
  { target: 'film-2', action: 'combined', at: 6.5, animations: [
    { action: 'scaleIn', from: 0.85, duration: 0.55, ease: 'ease-lock-on' },
    { action: 'fadeIn', duration: 0.55, ease: 'ease-lock-on' }
  ]},
  { target: 'film-3', action: 'combined', at: 6.5, animations: [
    { action: 'scaleIn', from: 0.85, duration: 0.55, ease: 'ease-lock-on' },
    { action: 'fadeIn', duration: 0.55, ease: 'ease-lock-on' }
  ]},
  { target: 'film-4', action: 'combined', at: 6.5, animations: [
    { action: 'scaleIn', from: 0.85, duration: 0.55, ease: 'ease-lock-on' },
    { action: 'fadeIn', duration: 0.55, ease: 'ease-lock-on' }
  ]},

  // BORDER RESET + ACCENT SHIFT (7.2s) - accent moves to film-2
  { target: 'border-1', action: 'gsap', gsap: { to: { borderColor: '#707977' }, duration: 0.175 }, at: 7.2 },
  { target: 'border-2', action: 'gsap', gsap: { to: { borderColor: '#f6c605' }, duration: 0.175 }, at: 7.2 },
  { target: 'border-3', action: 'gsap', gsap: { to: { borderColor: '#707977' }, duration: 0.175 }, at: 7.2 },
  { target: 'border-4', action: 'gsap', gsap: { to: { borderColor: '#707977' }, duration: 0.175 }, at: 7.2 },

  // Film 2 cycle begins at 9s...
]
```

### Key Timing Principles

- **Sequential focus:** Border fades complete before scale begins
- **brand-cinematic (0.55s):** Major state changes (enter/exit, layout shifts)
- **brand-standard (0.315s):** Content animations
- **brand-micro (0.175s):** Border color changes
- **No overlapping motion types:** borders → scale → position → content

---

## Mobile Adaptations

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Overview grid | `1fr 1fr 1fr 1fr` (horizontal) | `1fr` stacked (vertical) |
| Frame aspect | 2.39:1 (cinematic) | 16:9 (taller for thumb reach) |
| Exit direction | Scale toward center | Scale + slide up |
| Focus layout | 60/40 side-by-side | Stacked (video top, slab bottom) |
| Content slab | Full description | Full description (unchanged) |
| Touch zones | N/A | Larger tap targets for step indicator |

### Mobile Animation Adjustments

```typescript
mobile: {
  animations: [
    // Others exit: slide UP instead of just scale (better for vertical layout)
    { target: 'film-2', action: 'combined', at: 1.2, animations: [
      { action: 'scaleOut', to: 0.9, duration: 0.55 },
      { action: 'slideOut', direction: 'up', distance: 30, duration: 0.55 },
      { action: 'fadeOut', duration: 0.55 }
    ]},

    // Content enters from bottom (natural for thumb scroll)
    { target: 'content-slab-1', action: 'slideIn', direction: 'up', distance: 30, at: 2.6 }
  ]
}
```

### Breakpoint

- Desktop: `min-width: 768px`
- Mobile: below 768px

---

## Component Architecture

### New Component

```
src/experience/sections/
├── FilmOverviewSection.svelte    ← NEW (replaces FilmSection)
```

### Reused Components (unchanged)

```
src/experience/components/ui/
├── BorderedViewport.svelte
├── ContentSlab.svelte
├── SectionLabel.svelte
├── StepIndicator.svelte
└── ScrollHint.svelte
```

### Component Structure

```svelte
<div class={containerStyles} data-scene="film-overview">
  <!-- Section Label (morphs from "FILM" → "FILM — HIGH ALTITUDE FEATURES") -->
  <SectionLabel text={labelText} />

  <!-- Overview Grid (all 4 films) -->
  <div class={overviewGridStyles} data-overview-grid>
    {#each films as film, i}
      <div class={filmFrameStyles} data-film={film.id} data-index={i}>
        <BorderedViewport aspectRatio={aspectRatio}>
          <!-- Video/Image -->
        </BorderedViewport>
        <!-- Overlay: Title + Client -->
        <div class={overlayStyles}>
          <span class={titleStyles}>{film.title}</span>
          <span class={clientStyles}>{film.client}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Focus Layout (shown during focus state) -->
  <div class={focusLayoutStyles} data-focus-layout>
    <div class={viewportContainerStyles}>
      <BorderedViewport aspectRatio="2.39/1">
        <!-- Active film media -->
      </BorderedViewport>
    </div>
    <div class={slabContainerStyles}>
      <ContentSlab
        eyebrow={currentFilm.client}
        title={currentFilm.title}
        description={currentFilm.description}
        year={currentFilm.year}
      />
    </div>
  </div>

  <!-- Step Indicator -->
  <StepIndicator {steps} {activeIndex} />

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
```

### State Management

```typescript
let activeIndex = $state(0)           // Current film (0-3)
let phase = $state<'overview' | 'focus' | 'transition'>('overview')
let labelText = $derived(
  phase === 'overview' ? 'FILM' : 'FILM — HIGH ALTITUDE FEATURES'
)
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/experience/sections/FilmOverviewSection.svelte` | Create new |
| `src/experience/sections/index.ts` | Export new component |
| `src/routes/+page.svelte` | Replace `FilmSection` with `FilmOverviewSection` |
| `src/experience/sections/FilmSection.svelte` | Delete (or archive) |

---

## Timing Summary

| Phase | Duration |
|-------|----------|
| Total section | 36s |
| Per film cycle | ~9s |
| Overview hold | ~0.8s |
| Transition to focus | ~1.8s |
| Content reading time | ~3s |
| Transition back | ~1.4s |
| Accent shift + next cycle | ~2s |

---

## No Changes Required

- `ContentSlab.svelte` - reused as-is
- `BorderedViewport.svelte` - reused as-is
- `SectionLabel.svelte` - reused as-is
- `StepIndicator.svelte` - reused as-is
- Brand Design System
- Brand Physics Archetype
