# About Section Full-Screen Redesign

## Overview

Redesign the About section to use full-screen images with ContentSlab overlays, matching the portal zoom system used throughout the experience.

## Current State

- Single `AboutSection.svelte` scene with 3 beats
- Images contained in `BorderedViewport` (16:9, ~60% screen width)
- Two-column layout with text on right
- Bar navigation for beat selection

## New Design

### Structure

Replace single About scene with 3 separate portal scenes:

```
PortalContainer
├── HeroShowreelScene
├── FilmOverviewSection
├── AboutScene1        ← Full-screen image + ContentSlab
├── AboutScene2        ← Full-screen image + ContentSlab
├── AboutScene3        ← Full-screen image + ContentSlab
├── ServicesSection
└── ContactSection
```

### Scene Composition

Each `AboutScene` component:

```svelte
<div data-scene="about-{id}">
  <!-- Full-bleed background image -->
  <img
    src={imageSrc}
    alt={subtitle}
    style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
  />

  <!-- ContentSlab - positioned per existing styling, unchanged -->
  <div class="content-slab-wrapper" data-content-slab>
    <ContentSlab eyebrow={subtitle} description={text} />
  </div>

  <!-- Section label (top-left) -->
  <SectionLabel text="ABOUT ME" />

  <!-- Beat indicators (bottom-center) -->
  <BeatIndicator current={beatIndex} total={3} />
</div>
```

### Transition Sequence

```
FilmOverview ──portal zoom──► About1 Image (full-screen, 2.0→1.0)
                                    │
                                    ▼ ContentSlab slides in (100px, 550ms)
                               About1 Image + Content
                                    │
                      ──portal zoom──► About2 Image (full-screen)
                                    │
                                    ▼ ContentSlab slides in
                               About2 Image + Content
                                    │
                      ──portal zoom──► About3 Image (full-screen)
                                    │
                                    ▼ ContentSlab slides in
                               About3 Image + Content
                                    │
                      ──portal zoom──► Services
```

### Animation Details

#### Portal Zoom (handled by PortalContainer)
- Scale: 2.0 → 1.0 (incoming scene)
- Duration: 1.6s
- Easing: `portalIn`, `portalScale`, `irisMask`

#### ContentSlab Entry Animation

| Property | Desktop/Tablet | Mobile |
|----------|----------------|--------|
| Direction | `x: 100 → 0` (from right) | `y: 100 → 0` (from bottom) |
| Distance | 100px | 100px |
| Duration | 550ms (`brand-cinematic`) | 550ms |
| Easing | `ease-lock-on` | `ease-lock-on` |
| Opacity | `0 → 1` (simultaneous) | `0 → 1` |

#### Scroll Timing Per Scene

```
Scene scroll duration: 8s
├─ Phase 1 (0-40%): Image revealed via portal zoom
├─ Phase 2 (40-70%): ContentSlab slides in (scrub-driven)
└─ Phase 3 (70-100%): Hold for reading, then portal out begins
```

### Image Behavior

- Full-screen coverage (`object-fit: cover`)
- Stays full-screen when ContentSlab appears (no scaling)
- ContentSlab has opaque background for legibility
- No changes to ContentSlab styling or positioning

### Experience Timing

**Current:**
```typescript
sceneDurations={[16, 36, 16, 16, 16]}  // Total: 100s
// [Hero, Film, About, Services, Contact]
```

**New:**
```typescript
sceneDurations={[16, 36, 8, 8, 8, 16, 16]}  // Total: 108s
// [Hero, Film, About1, About2, About3, Services, Contact]
```

| Scene | Duration |
|-------|----------|
| Hero | 16s |
| Film | 36s |
| About1 | 8s |
| About2 | 8s |
| About3 | 8s |
| Services | 16s |
| Contact | 16s |
| **Total** | **108s** |

**Scroll distance:** 108s × 65px/s = 7,020px

### Beat Data (unchanged)

```typescript
const beats = [
  {
    id: 'frontline',
    subtitle: 'FRONT-LINE PERSPECTIVE',
    text: "Over the past decade I've documented...",
    imageSrc: '/pictures/heli rescue (1 of 2).jpg'
  },
  {
    id: 'origin',
    subtitle: 'ORIGIN STORY',
    text: "A winding path brought me to the mountains...",
    imageSrc: '/pictures/IMG_1101.JPG'
  },
  {
    id: 'values',
    subtitle: 'VALUES + ONGOING WORK',
    text: "With feeling and fortitude...",
    imageSrc: '/pictures/push (19 of 22).jpg'
  }
]
```

### Responsive Behavior

| Viewport | ContentSlab Entry |
|----------|-------------------|
| Desktop (≥1024px) | Slide from right |
| Tablet (768-1023px) | Slide from right |
| Mobile (<768px) | Slide from bottom |

Uses existing ContentSlab positioning—no changes to component.

### Files to Modify

1. **Create:** `src/experience/sections/AboutScene.svelte` - New reusable About scene component
2. **Modify:** `src/routes/+page.svelte` - Replace single About with 3 AboutScene instances, update sceneDurations
3. **Delete:** `src/experience/sections/AboutSection.svelte` - No longer needed
4. **Optional:** Create `BeatIndicator.svelte` for position display (1/3, 2/3, 3/3)

### Brand Alignment

- **Machine archetype:** Precise, camera-like transitions
- **Sequential focus:** One motion at a time (portal first, then content)
- **Zoom as primary verb:** Portal zoom for scene transitions
- **Full-bleed imagery:** Hero pattern from brand system
- **Locked rig:** Portal handles coordinated movement
