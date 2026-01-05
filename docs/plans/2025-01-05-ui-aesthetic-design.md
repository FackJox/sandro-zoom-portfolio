# UI Aesthetic Design: Sandro Portfolio

**Date:** 2025-01-05
**Status:** Approved

## Overview

Integrate the "UI-style" aesthetic from the reference project (FackJox/sandro-zoom) into the current portal zoom implementation. This includes bordered viewports, two-column layouts, and HUD chrome elements while preserving the existing portal zoom transitions.

## Section Structure

```
1. Hero        → Full-bleed showreel with overlay + content
2. Showreel    → Fade reveal to full-color video
3. Film        → 4 projects, two-column layout
4. About       → 3 beats, two-column layout
5. Services    → Staggered card reveal
6. Contact     → Centered CTA
```

## Section Designs

### 1. Hero Section

**Layout:** Full-bleed video with centered content

**Content:**
- Title: `sandrogh` (lowercase)
- Tagline: `HIGH ALTITUDE & HOSTILE ENVIRONMENT`
- Description: `Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering.`
- Secondary: `With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners.`
- Logo strip at bottom (client logos)
- Scroll hint indicator

**Media:**
- Showreel video (full-bleed)
- Desaturated filter (`saturate(0.3) contrast(1.1)`)
- Dark gradient overlay for text legibility

**Transition to Showreel:**
- NOT portal zoom
- Hero content fades/slides out
- Overlay fades to transparent
- Desaturation filter animates to full color

---

### 2. Showreel Section (NEW)

**Layout:** Full-bleed video with minimal chrome

**Content:**
- Section label: `SHOWREEL` (top-left, with keyline)
- Same showreel video continues from Hero
- Full color (no desaturation, no overlay)
- Scroll hint indicator

**Media Sources:**
```
/videos/showreel.mp4      (fallback)
/videos/showreel.hevc.mp4 (Safari)
/videos/showreel.av1.webm (modern browsers)
```

**Transition to Film:**
- Portal zoom effect (existing implementation)

---

### 3. Film Section

**Layout:** Two-column grid

```
┌─────────────────────┬──────────────────────┐
│                     │  [EYEBROW/CLIENT]    │
│  ┌───────────────┐  │  PROJECT TITLE       │
│  │               │  │  ────────────────    │
│  │  VIDEO/IMAGE  │  │                      │
│  │  VIEWPORT     │  │  Description text    │
│  │  (bordered)   │  │                      │
│  └───────────────┘  │  [year]              │
│                     │                      │
├─────────────────────┴──────────────────────┤
│     ○ ○ ● ○  step indicator with labels    │
└────────────────────────────────────────────┘
```

**UI Elements:**
- Section label: `FILM -- HIGH ALTITUDE FEATURES`
- Bordered viewport: 1px accent color, 4px border-radius, dark background
- Content slab: Solid dark panel with text hierarchy
- Step indicator: Dots with project name labels
- Scroll hint indicator

**Projects (4 total):**

| # | Project | Client | Media | Copy |
|---|---------|--------|-------|------|
| 1 | 14 Peaks | Netflix | YouTube embed: `https://youtu.be/8QH5hBOoz08` | I worked as lead cinematographer on Netflix's smash hit 14 Peaks. I shot most of the drone footage along with key scenes including the intro, Nims visiting his family and the K2 drama. I then worked as DOP on the first successful K2 winter expedition. |
| 2 | No Days Off | RedBull TV | Image + play button (links to RedBull): `https://static.wixstatic.com/media/37d07c_5ed3218453264242ab5e39b7c013c723~mv2.jpg` → `https://www.redbull.com/us-en/episodes/no-days-off-s1-e1` | In 2022 I filmed episode 1 of Sasha DiGiulian's 'No Days Off' series for RedBull TV. During preparation for Petzl's RocTrip Sasha, Alex Megos, Steve McClure & Neil Gresham developed new routes in a remote and undeveloped corner of Greece's mainland. |
| 3 | Grace | Montane | Local video: `/videos/grace.mp4` | I directed, shot and edited the story of Grace, a recovering climber searching for a bigger life. Focusing on mental health and community the film was supported by Montane and played at film festivals world wide. |
| 4 | Afghanistan | Charles Schwab | Local video: `/videos/shwab.mp4` | Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m. |

**Scroll Behavior:**
- Scroll-driven beat navigation (existing pattern)
- Video/image crossfades between projects
- Text content slides up with stagger

---

### 4. About Section

**Layout:** Two-column grid (same as Film for consistency)

```
┌─────────────────────┬──────────────────────┐
│                     │  [BEAT SUBTITLE]     │
│  ┌───────────────┐  │  ────────────────    │
│  │               │  │                      │
│  │    IMAGE      │  │  Beat text content   │
│  │   VIEWPORT    │  │                      │
│  │  (bordered)   │  │                      │
│  └───────────────┘  │                      │
│                     │                      │
├─────────────────────┴──────────────────────┤
│        ━ ━━━ ━  bar progress indicators    │
└────────────────────────────────────────────┘
```

**UI Elements:**
- Section label: `ABOUT ME`
- Bordered viewport with static images
- Bar-style progress indicators (differentiates from Film dots)
- Scroll hint indicator

**Beats (3 total):**

| Beat | Subtitle | Content |
|------|----------|---------|
| 1 | Front-line perspective | Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan, Mt Noshaq as the first Afghan woman summited and the highest peak in Pakistan, K2 as the first Pakistani woman summited. I filmed Nirmal Purja as he set a blazing speed record on the 14 8,000ers and filmed Kristin Harila as she smashed it. |
| 2 | Origin story | A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. Wanting to see more of the world I joined the British army reserve and soon the commando training combined with my passion for story telling provided opportunities to do just that. I filmed army expeds to Dhaulagiri in 2016 and Everest in 2017, began building a basecamp network and haven't really stopped carrying cameras up mountains since. |
| 3 | Values + Ongoing Work | With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe deeply in representation and hope the projects I've worked on show people what's possible when you look up and believe. Stories from the mountains and the people in between are slowly being collected on my Youtube channel. |

---

### 5. Services Section

**Layout:** Staggered card reveal (vertical list)

```
┌────────────────────────────────────────────┐
│ ── SERVICES ──                             │
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │  MOUNTAIN DOP                       │   │
│  └─────────────────────────────────────┘   │
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │  EXPED & PRODUCT PHOTOGRAPHY        │   │
│  └─────────────────────────────────────┘   │
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │  AERIAL CINEMATOGRAPHY              │   │
│  └─────────────────────────────────────┘   │
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │  STOCK FOOTAGE ON Shutterstock ↗    │   │
│  └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

**UI Elements:**
- Section label: `SERVICES`
- Service cards with 1px accent border
- Monospace/technical typography
- Staggered reveal animation on scroll
- Scroll hint indicator

**Services (4 cards):**
1. `MOUNTAIN DOP`
2. `EXPED & PRODUCT PHOTOGRAPHY`
3. `AERIAL CINEMATOGRAPHY`
4. `STOCK FOOTAGE AVAILABLE ON Shutterstock` (external link)

---

### 6. Contact Section

**Layout:** Centered, minimal

```
┌────────────────────────────────────────────┐
│ ── CONTACT ──                              │
│                                            │
│     If you have a story to tell            │
│     please get in touch.                   │
│                                            │
│     ────────────────────────               │
│                                            │
│     +447880352909                          │
│     sandro.gromen-hayes@live.com           │
│                                            │
└────────────────────────────────────────────┘
```

**Content:**
- Headline: `If you have a story to tell please get in touch.`
- Phone: `+447880352909` (clickable `tel:` link)
- Email: `sandro.gromen-hayes@live.com` (clickable `mailto:` link)

**UI Elements:**
- Section label: `CONTACT`
- Static or slow parallax background
- No scroll hint (final section)

---

## Global Elements

### Scroll Hints

- Persistent indicator on all sections (except Contact)
- Subtle pulsing chevron or animated line
- Positioned bottom-center
- Fades during active scroll, reappears on pause

### Bordered Viewport Component

Shared UI pattern for Film and About sections:

```css
.viewport {
  border: 1px solid var(--accent);  /* eggToast */
  border-radius: 4px;
  background: var(--dark);          /* blackPearl */
  aspect-ratio: 2.39 / 1;           /* cinematic */
  overflow: hidden;
}
```

### Content Slab Component

Right-side text panel for two-column layouts:

```css
.content-slab {
  background: var(--dark-elevated);
  padding: 1.5rem 2rem;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

### Typography Hierarchy

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Eyebrow | IBM Plex Sans | 0.75rem | 500 | 0.18em |
| Title | IBM Plex Sans Condensed | 1.45-1.85rem | 700 | 0.08em |
| Body | IBM Plex Sans | 1rem | 400 | normal |
| Metadata | IBM Plex Mono | 0.75rem | 400 | 0.1em |

---

## Transitions

| From | To | Type |
|------|-----|------|
| Hero | Showreel | Fade reveal (content out, overlay fade, color in) |
| Showreel | Film | Portal zoom |
| Film | About | Portal zoom |
| About | Services | Portal zoom |
| Services | Contact | Portal zoom |

---

## Files to Modify

### Remove
- `src/experience/sections/StoriesSection.svelte`

### Create
- `src/experience/sections/ShowreelSection.svelte`
- `src/experience/components/ui/BorderedViewport.svelte`
- `src/experience/components/ui/ContentSlab.svelte`
- `src/experience/components/ui/ScrollHint.svelte`
- `src/experience/components/ui/StepIndicator.svelte`

### Modify
- `src/experience/sections/HeroSection.svelte` - Update copy, add transition hooks
- `src/experience/sections/FilmSection.svelte` - Two-column layout, new projects, video embeds
- `src/experience/sections/AboutSection.svelte` - Two-column layout, correct copy
- `src/experience/sections/ServicesSection.svelte` - Card layout, staggered animation
- `src/experience/sections/ContactSection.svelte` - Correct copy
- `src/routes/+page.svelte` - Update section order, remove Stories

---

## Responsive Design

### Breakpoints

| Device | Width | Safe Zones |
|--------|-------|------------|
| Mobile | < 768px | 16px sides, `env(safe-area-inset-*)` for notch/home indicator |
| Tablet | 768px - 1023px | 32px all sides |
| Desktop | ≥ 1024px | 60px sides, 40px top/bottom |

### Hero Section (Responsive)

| Aspect | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Title `sandrogh` | `clamp(4rem, 12vw, 10rem)` | `clamp(3rem, 10vw, 5rem)` | `clamp(2.5rem, 15vw, 4rem)` |
| Tagline | 1rem, 0.25em tracking | 0.85rem | 0.75rem |
| Description | Max 600px, 1.1rem | Max 500px, 1rem | Full width, 0.9rem |
| Logo strip | Horizontal scroll | Horizontal scroll | 2-row grid or marquee |
| Content position | Center | Center | Center-top (more room for logos) |

### Film & About Sections (Responsive)

**Layout transformation:**

```
Desktop (≥1024px):              Tablet (768-1023px):           Mobile (<768px):
┌─────────┬──────────┐          ┌─────────┬──────────┐         ┌──────────────┐
│  VIDEO  │  CONTENT │          │  VIDEO  │  CONTENT │         │    VIDEO     │
│  60%    │   40%    │          │  55%    │   45%    │         │   (16:9)     │
│         │          │          │ (smaller│ (tighter │         ├──────────────┤
│         │          │          │  gaps)  │  padding)│         │   CONTENT    │
└─────────┴──────────┘          └─────────┴──────────┘         │  (stacked)   │
                                                                └──────────────┘
```

| Aspect | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Layout | 2-column grid (0.6fr 0.4fr) | 2-column grid (0.55fr 0.45fr) | Single column, stacked |
| Viewport aspect | 2.39:1 cinematic | 2.39:1 | 16:9 (taller for mobile) |
| Content slab padding | 2rem | 1.5rem | 1.25rem |
| Title size | 1.85rem | 1.45rem | 1.25rem |
| Body text | 1rem | 0.95rem | 0.9rem |
| Step indicator | Below content, horizontal | Below content | Fixed bottom, compact |
| Border radius | 4px | 4px | 2px |

**Mobile-specific:**
- Video viewport sits above content (no side-by-side)
- Swipe gestures enabled for project navigation
- Step indicator becomes minimal dots (no labels)
- Content has semi-transparent dark background for contrast

### Services Section (Responsive)

| Aspect | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Card layout | Centered stack, max-width 600px | Centered stack, max-width 500px | Full-width with safe zone padding |
| Card padding | 1.5rem 2rem | 1.25rem 1.5rem | 1rem 1.25rem |
| Typography | 1rem | 0.9rem | 0.85rem |
| Stagger delay | 0.15s | 0.12s | 0.1s |
| Gap between cards | 1.5rem | 1.25rem | 1rem |

### Contact Section (Responsive)

| Aspect | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Headline | 1.5rem, max-width 500px | 1.25rem | 1.1rem, full width |
| Contact details | Horizontal row | Horizontal row | Stacked vertically |
| Padding | 60px sides | 32px sides | 16px sides |
| CTA touch targets | Standard | 44px min | 48px min (thumb-friendly) |

### Scroll Hint (Responsive)

| Aspect | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Position | Bottom center, 40px from edge | Bottom center, 24px | Bottom center, safe-area aware |
| Size | 24px chevron | 20px | 18px |
| Animation | Subtle pulse | Subtle pulse | More prominent (users expect scroll) |

### Touch & Gesture Support (Mobile/Tablet)

| Gesture | Action |
|---------|--------|
| Swipe left/right | Navigate between Film/About beats |
| Swipe up | Scroll to next section |
| Tap step indicator | Jump to specific beat |
| Long press video | (Future: fullscreen option) |

### Performance Considerations

| Device | Video Quality | Image Format |
|--------|---------------|--------------|
| Desktop | Full res, AV1/HEVC | AVIF with JPG fallback |
| Tablet | 720p max | AVIF with JPG fallback |
| Mobile | 480p max, consider poster-only on slow connections | WebP with JPG fallback |

**Reduced motion:**
- Honor `prefers-reduced-motion`
- Replace scroll-driven animations with instant state changes
- Keep portal zoom but reduce duration (0.3s vs 0.6s)

---

## Out of Scope

- Lens bug (persistent viewfinder HUD element)
- Metadata morph (hero → logos)
- Lens detach effects
- Netflix logo iris zoom
- Grid flip transition (About → Services)
- Concentric lens rings during zoom-out
