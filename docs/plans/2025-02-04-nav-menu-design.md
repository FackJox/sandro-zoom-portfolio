# Navigation Menu Design

## Overview

A minimal navigation menu for the scrollytelling portfolio that allows quick access to all sections. Uses a two-line hamburger icon that transforms into a full menu with scan-line reveal animation.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Menu items | Full section names (Showreel, Film, About, Services, Contact) | Clear, immediately understandable |
| Closed state | Two horizontal lines | Minimal, matches section label line aesthetic |
| Opening animation | Vertical scan line wipe | Matches metadata strip transition, mechanical/viewfinder feel |
| Closing animation | Collapse inward | Shows relationship: lines ARE the menu |
| Open state button | X transformation | Universally understood close affordance |
| Background | Blur + dim | Rack focus camera metaphor |
| Hover state | Text color shift to Egg Toast | Subtle, lets scan line be the star |
| Current section | Accent line indicator | Mirrors SectionLabel pattern |
| Panel | Solid Black Pearl | Hard edges, matches brand aesthetic |

---

## Structure & States

### Closed State (Hamburger)

- **Position**: Top-right corner via UIChrome's `topRight` slot
- **Visual**: Two horizontal Egg Toast lines
  - Width: 24px
  - Height: 1.5px each
  - Gap: 6px between lines
- **Behavior**: Click/tap to open menu

### Open State

- **Panel**: Solid Black Pearl (`#20292b`) surface
  - Hard edges (0-2px radius max)
  - Right-aligned, positioned below the X button
- **Items**: Stacked vertically
  - SHOWREEL
  - FILM
  - ABOUT
  - SERVICES
  - CONTACT
- **Typography**:
  - Font: IBM Plex Sans Condensed
  - Weight: 600
  - Transform: uppercase
  - Tracking: -0.05em
  - Size: ~0.875rem
- **Close button**: Two lines rotated 45° to form X, same position as hamburger

### Current Section Indicator

- **Visual**: 24px Egg Toast accent line to the left of current section's text
- **Style**: Mirrors SectionLabel pattern (1.5px thick, Egg Toast color)
- **Detection**: Based on scroll position when menu opens

### Hover State

- **Effect**: Text color transitions Silverplate (`#c0bfb6`) → Egg Toast (`#f6c605`)
- **Timing**: `brand-micro` (175ms)
- **Easing**: `ease-lock-on` — `cubic-bezier(0.19, 1.0, 0.22, 1.0)`

---

## Animations

### Opening Animation (Scan Line Reveal)

**Sequence:**

1. **Hamburger → X rotation** (175ms, `ease-lock-on`)
   - Two lines rotate 45° in opposite directions to form X

2. **Panel fade in** (175ms)
   - Black Pearl panel appears

3. **Background rack focus** (280ms, `ease-lock-on`)
   - Page content receives Black Stallion overlay at 70% opacity
   - `backdrop-filter: blur(8px)` applied
   - Both animate simultaneously

4. **Scan line sweep** (~400ms, linear)
   - Egg Toast line (2px wide) sweeps top → bottom
   - Linear easing for mechanical scan feel

5. **Items reveal** (staggered ~60ms each)
   - Each menu item becomes visible as scan line passes
   - Items have slight fade + appear effect

6. **Scan line fade out** (175ms)
   - Line fades after reaching bottom edge

**Total duration**: ~550ms (`brand-cinematic`)

### Closing Animation (Collapse Inward)

**Sequence:**

1. **Items collapse** (staggered ~40ms each, bottom → top)
   - Each item slides upward + fades out
   - Movement toward hamburger position
   - `ease-release` curve

2. **X → Hamburger rotation** (175ms)
   - Lines rotate back to parallel

3. **Background release** (280ms, `ease-release`)
   - Blur and dim fade out together

4. **Panel fade out** (175ms)
   - Completes close

**Total duration**: ~450ms (snappier than open)

### Auto-Close on Scroll

- **Threshold**: 10px of scroll movement
- **Behavior**: Triggers closing animation immediately
- **No scroll-jacking**: Page continues scrolling normally during close

---

## Background & Interactions

### Rack Focus Effect

**Opening:**
- Black Stallion (`#0f171a`) overlay at 70% opacity
- CSS `backdrop-filter: blur(8px)`
- Both animate together over 280ms with `ease-lock-on`

**Closing:**
- Blur and dim fade out with `ease-release`
- Content returns to sharp focus

### Click Behaviors

| Target | Action |
|--------|--------|
| Menu item | Scroll to section, close menu |
| X button | Close menu |
| Blurred background | Close menu |
| Escape key | Close menu |

### Scroll-to-Section

When a menu item is clicked:

1. Menu begins closing animation
2. After 150ms delay (let close start), trigger scroll
3. Use GSAP `scrollTo` with `ease-lock-on` easing
4. Duration: ~600ms for nearby sections, up to 1200ms for distant jumps
5. ScrollTrigger animations play naturally as page scrolls

### Accessibility

- `aria-expanded` on menu button
- `role="navigation"` and `aria-label="Section navigation"` on menu panel
- Focus trapped within menu when open
- Focus returns to hamburger button on close
- **Reduced motion fallback**:
  - Scan line replaced with simple crossfade
  - Blur effect disabled
  - Transitions shortened to `brand-micro`

---

## Component Structure

### File Structure

```
src/experience/components/ui/
├── NavMenu.svelte          # Main menu component
├── NavMenuButton.svelte    # Hamburger/X button
└── NavMenuItem.svelte      # Individual menu item
```

### NavMenu.svelte

**Responsibilities:**
- Manages open/closed state
- Creates GSAP context for all animations
- Handles scroll detection for auto-close
- Calculates current section from scroll position
- Renders backdrop overlay
- Coordinates opening/closing animation sequences

**Props:**
```typescript
interface NavMenuProps {
  sections: Array<{
    id: string
    label: string
    sceneIndex: number
  }>
}
```

### NavMenuButton.svelte

**Responsibilities:**
- Renders hamburger lines / X
- Handles rotation animation between states
- Click handler to toggle menu

**Props:**
```typescript
interface NavMenuButtonProps {
  isOpen: boolean
  onClick: () => void
}
```

### NavMenuItem.svelte

**Responsibilities:**
- Renders single menu item
- Handles hover state (color transition)
- Shows accent line if current section
- Click handler for navigation

**Props:**
```typescript
interface NavMenuItemProps {
  label: string
  isCurrent: boolean
  onClick: () => void
}
```

### Integration

```svelte
<!-- At page level or in a persistent chrome component -->
<UIChrome>
  {#snippet topRight()}
    <NavMenu sections={[
      { id: 'showreel', label: 'SHOWREEL', sceneIndex: 0 },
      { id: 'film', label: 'FILM', sceneIndex: 1 },
      { id: 'about', label: 'ABOUT', sceneIndex: 2 },
      { id: 'services', label: 'SERVICES', sceneIndex: 5 },
      { id: 'contact', label: 'CONTACT', sceneIndex: 6 },
    ]} />
  {/snippet}
</UIChrome>
```

### Section Mapping

| Menu Item | Scene Index | Notes |
|-----------|-------------|-------|
| SHOWREEL | 0 | Hero + Showreel combined scene |
| FILM | 1 | Film Overview section |
| ABOUT | 2 | First About beat (Frontline) |
| SERVICES | 5 | Services section |
| CONTACT | 6 | Contact section |

About's 3 beats (scenes 2, 3, 4) collapse to single "ABOUT" entry targeting first beat.

---

## Motion Tokens Reference

From Brand Physics Archetype:

| Token | Value | Use |
|-------|-------|-----|
| `ease-lock-on` | `cubic-bezier(0.19, 1.0, 0.22, 1.0)` | Opening, acquiring targets |
| `ease-release` | `cubic-bezier(0.25, 0.0, 0.35, 1.0)` | Closing, releasing |
| `brand-micro` | 150-200ms | Small state changes, hover |
| `brand-standard` | 280-350ms | UI transitions |
| `brand-cinematic` | 500-600ms | Major transitions |

---

## Visual Reference

### Closed State
```
                    ════════════════════
                    ════════════════════
```

### Open State
```
                              ╲      ╱
                               ╲    ╱
                                ╲  ╱
                                 ╲╱
                                 ╱╲
                                ╱  ╲
                               ╱    ╲
                              ╱      ╲

                    ┌─────────────────────┐
                    │ ▬ SHOWREEL          │  ← accent line = current
                    │   FILM              │
                    │   ABOUT             │
                    │   SERVICES          │
                    │   CONTACT           │
                    └─────────────────────┘
```

### Scan Line During Open
```
                    ┌─────────────────────┐
                    │   SHOWREEL          │  ← revealed
                    │   FILM              │  ← revealed
                    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← scan line (Egg Toast)
                    │                     │  ← not yet revealed
                    │                     │
                    └─────────────────────┘
```
