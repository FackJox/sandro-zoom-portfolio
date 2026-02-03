# UI Aesthetic Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate bordered viewports, two-column layouts, and HUD chrome elements from the reference project while preserving existing portal zoom transitions.

**Architecture:** Phased implementation starting with shared UI components, then section-by-section updates. Each phase is independently verifiable. Portal zoom transitions in PortalContainer remain untouched - we only modify section content.

**Tech Stack:** SvelteKit 2.49, Svelte 5 (runes), GSAP 3.14 + ScrollTrigger, PandaCSS

**Design Source:** `docs/plans/2025-01-05-ui-aesthetic-design.md`

---

## Critical Documentation References

Before implementing, the engineer should read:

| Document | Path | Key Information |
|----------|------|-----------------|
| Design Spec | `docs/plans/2025-01-05-ui-aesthetic-design.md` | Section layouts, typography, responsive specs |
| Brand Design | `docs/Brand Design System.md` | Colors, typography tokens, layout patterns |
| Brand Physics | `docs/Brand Physics Archtype.md` | Motion tokens, easing curves, timing |
| Patterns | `docs/framework/patterns.md` | gsap.context(), autoAlpha, cleanup order |
| Components | `docs/framework/components.md` | Section, Stage, ScrollContainer usage |
| Animation | `docs/framework/animation-primitives.md` | fadeIn, slideIn, stagger primitives |
| Responsive | `docs/framework/responsive-system.md` | Breakpoints, safe zones, fluid sizing |

---

## Phase 0: Foundation - Shared UI Components

**Goal:** Create reusable UI primitives that will be used across multiple sections.

### Task 0.1: Create BorderedViewport Component

**Files:**
- Create: `src/experience/components/ui/BorderedViewport.svelte`

**Step 1: Create the component**

```svelte
<!--
  BorderedViewport.svelte

  Cinematic bordered viewport for media content.
  Used in Film and About sections for video/image display.

  Design: 1px accent border, 4px radius, dark background
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import type { Snippet } from 'svelte'

  interface Props {
    aspectRatio?: '2.39/1' | '16/9' | '4/3'
    children: Snippet
  }

  let {
    aspectRatio = '2.39/1',
    children
  }: Props = $props()

  const viewportStyles = css({
    position: 'relative',
    width: '100%',
    aspectRatio: 'var(--aspect-ratio)',
    border: '1px solid',
    borderColor: 'brand.accent',
    borderRadius: '4px',
    backgroundColor: 'brand.surface',
    overflow: 'hidden',
    // Ensure media fills container
    '& > img, & > video, & > iframe': {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })
</script>

<div class={viewportStyles} style:--aspect-ratio={aspectRatio}>
  {@render children()}
</div>
```

**Step 2: Verify component renders**

Run: `npm run dev`
Expected: Dev server starts without errors

---

### Task 0.2: Create ContentSlab Component

**Files:**
- Create: `src/experience/components/ui/ContentSlab.svelte`

**Step 1: Create the component**

```svelte
<!--
  ContentSlab.svelte

  Right-side text panel for two-column layouts.
  Contains eyebrow, title, description, metadata.

  Design: Solid dark panel with text hierarchy
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'

  interface Props {
    eyebrow?: string
    title: string
    description: string
    metadata?: string
    year?: string
  }

  let {
    eyebrow,
    title,
    description,
    metadata,
    year
  }: Props = $props()

  const slabStyles = css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '2rem',
    minHeight: '320px',
    backgroundColor: 'brand.surface',

    '@media (max-width: 1023px)': {
      padding: '1.5rem',
      minHeight: '280px',
    },
    '@media (max-width: 767px)': {
      padding: '1.25rem',
      minHeight: 'auto',
    },
  })

  const eyebrowStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: '500',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'brand.accent',
    marginBottom: '0.75rem',
  })

  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', sans-serif",
    fontSize: 'clamp(1.25rem, 2vw, 1.85rem)',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'brand.text',
    marginBottom: '1rem',
    lineHeight: '1.1',
  })

  const dividerStyles = css({
    width: '60px',
    height: '1px',
    backgroundColor: 'brand.phantom',
    marginBottom: '1rem',
  })

  const descriptionStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.9rem, 1.1vw, 1rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    color: 'brand.textMuted',
    marginBottom: '1.5rem',
  })

  const metadataStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.75rem',
    fontWeight: '400',
    letterSpacing: '0.1em',
    color: 'brand.phantom',
    textTransform: 'uppercase',
  })
</script>

<div class={slabStyles}>
  {#if eyebrow}
    <span class={eyebrowStyles}>{eyebrow}</span>
  {/if}

  <h3 class={titleStyles}>{title}</h3>

  <div class={dividerStyles}></div>

  <p class={descriptionStyles}>{description}</p>

  {#if metadata || year}
    <span class={metadataStyles}>
      {#if metadata}{metadata}{/if}
      {#if metadata && year} · {/if}
      {#if year}{year}{/if}
    </span>
  {/if}
</div>
```

---

### Task 0.3: Create ScrollHint Component

**Files:**
- Create: `src/experience/components/ui/ScrollHint.svelte`

**Step 1: Create the component**

```svelte
<!--
  ScrollHint.svelte

  Persistent scroll indicator showing users they can scroll.
  Subtle pulsing chevron, positioned bottom-center.
  Fades during active scroll, reappears on pause.

  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import { onMount, onDestroy } from 'svelte'
  import { gsap } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'

  interface Props {
    show?: boolean
  }

  let { show = true }: Props = $props()

  let chevronEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  onMount(() => {
    if (!chevronEl) return

    ctx = gsap.context(() => {
      // Gentle pulse animation
      gsap.to(chevronEl, {
        y: 4,
        opacity: 0.6,
        duration: 1,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, chevronEl)
  })

  onDestroy(() => {
    ctx?.revert()
  })

  const containerStyles = css({
    position: 'absolute',
    bottom: 'env(safe-area-inset-bottom, 40px)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    zIndex: '20',
    pointerEvents: 'none',
    transition: `opacity ${DURATION.standard}s`,

    '@media (max-width: 767px)': {
      bottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
    },
  })

  const chevronStyles = css({
    width: '24px',
    height: '24px',
    color: 'brand.textMuted',
    opacity: '0.8',

    '@media (max-width: 767px)': {
      width: '18px',
      height: '18px',
    },
  })

  const labelStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.625rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
  })
</script>

{#if show}
  <div class={containerStyles} style:opacity={show ? 1 : 0}>
    <svg
      bind:this={chevronEl}
      class={chevronStyles}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class={labelStyles}>Scroll</span>
  </div>
{/if}
```

---

### Task 0.4: Create StepIndicator Component

**Files:**
- Create: `src/experience/components/ui/StepIndicator.svelte`

**Step 1: Create the component**

```svelte
<!--
  StepIndicator.svelte

  Dot navigation with optional labels for Film section.
  Click to navigate between projects.

  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import { DURATION } from '$lib/animation/easing'

  interface Step {
    id: string
    label?: string
  }

  interface Props {
    steps: Step[]
    activeIndex: number
    showLabels?: boolean
    onSelect?: (index: number) => void
  }

  let {
    steps,
    activeIndex,
    showLabels = true,
    onSelect
  }: Props = $props()

  function handleClick(index: number) {
    if (onSelect) {
      onSelect(index)
    }
  }

  const containerStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  })

  const stepStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '0.5rem',
  })

  const dotStyles = css({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'brand.phantom',
    transition: `all ${DURATION.micro}s`,

    '&[data-active="true"]': {
      backgroundColor: 'brand.accent',
      transform: 'scale(1.25)',
    },
  })

  const labelStyles = css({
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.625rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'brand.phantom',
    whiteSpace: 'nowrap',
    transition: `color ${DURATION.micro}s`,

    '&[data-active="true"]': {
      color: 'brand.textMuted',
    },
  })
</script>

<div class={containerStyles}>
  {#each steps as step, i}
    <button
      type="button"
      class={stepStyles}
      onclick={() => handleClick(i)}
      aria-label="Go to {step.label || `step ${i + 1}`}"
      aria-current={i === activeIndex ? 'step' : undefined}
    >
      <span class={dotStyles} data-active={i === activeIndex}></span>
      {#if showLabels && step.label}
        <span class={labelStyles} data-active={i === activeIndex}>{step.label}</span>
      {/if}
    </button>
  {/each}
</div>
```

---

### Task 0.5: Update UI Component Barrel Export

**Files:**
- Modify: `src/experience/components/ui/index.ts`

**Step 1: Add new exports**

```typescript
// Existing exports
export { default as SectionLabel } from './SectionLabel.svelte'
export { default as MetadataStrip } from './MetadataStrip.svelte'
export { default as LogoStrip } from './LogoStrip.svelte'
export { default as FilmCard } from './FilmCard.svelte'
export { default as AboutBeat } from './AboutBeat.svelte'
export { default as StoryCard } from './StoryCard.svelte'
export { default as ServicesCredits } from './ServicesCredits.svelte'
export { default as ContactBlock } from './ContactBlock.svelte'

// New exports
export { default as BorderedViewport } from './BorderedViewport.svelte'
export { default as ContentSlab } from './ContentSlab.svelte'
export { default as ScrollHint } from './ScrollHint.svelte'
export { default as StepIndicator } from './StepIndicator.svelte'
```

---

### Task 0.6: Commit Phase 0

**Step 1: Verify all components exist**

Run: `ls src/experience/components/ui/`
Expected: Lists BorderedViewport.svelte, ContentSlab.svelte, ScrollHint.svelte, StepIndicator.svelte

**Step 2: Run build to check for errors**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add src/experience/components/ui/
git commit -m "$(cat <<'EOF'
feat(ui): add shared UI components for aesthetic redesign

- BorderedViewport: Cinematic bordered media container
- ContentSlab: Right-side text panel for two-column layouts
- ScrollHint: Animated scroll indicator with chevron
- StepIndicator: Dot navigation with optional labels

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 0

**Before proceeding to Phase 1, verify:**

- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Build completes successfully (`npm run build`)
- [ ] All 4 new component files exist in `src/experience/components/ui/`
- [ ] Components are exported from the barrel file

---

## Phase 1: Hero Section Updates

**Goal:** Update Hero section with correct copy and prepare for Showreel transition.

### Task 1.1: Update HeroSection Copy and Layout

**Files:**
- Modify: `src/experience/sections/HeroSection.svelte`

**Step 1: Read current implementation**

Read: `src/experience/sections/HeroSection.svelte`

**Step 2: Update the component**

Key changes:
- Title: `SANDRO` → `sandrogh` (lowercase)
- Add secondary description line
- Add ScrollHint component
- Prepare overlay for transition to Showreel

```svelte
<!--
  HeroSection.svelte

  Hero section content for Sandro's portfolio.
  Full-bleed showreel video with name, tagline, and client logos.

  Design: Alpine Noir - "controlled fall: precise, cinematic"
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import LogoStrip from '../components/ui/LogoStrip.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  interface Props {
    videoSrc?: string
  }

  let {
    videoSrc = '/videos/showreel.mp4'
  }: Props = $props()

  // Copy from design spec
  const title = 'sandrogh'
  const tagline = 'HIGH ALTITUDE & HOSTILE ENVIRONMENT'
  const description = "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering."
  const secondary = "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners."

  // Container - full bleed
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  // Video background layer
  const videoStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // Desaturate and increase contrast per brand spec
    filter: 'saturate(0.3) contrast(1.1)',
  })

  // Dark gradient overlay for text legibility
  const overlayStyles = css({
    position: 'absolute',
    inset: '0',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.4) 0%, rgba(15, 23, 26, 0.7) 50%, rgba(15, 23, 26, 0.9) 100%)',
    pointerEvents: 'none',
  })

  // Content wrapper - centered slab
  const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 2rem',
    zIndex: '10',
  })

  // Title - lowercase per design spec
  const titleStyles = css({
    fontFamily: "'IBM Plex Sans Condensed', 'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(2.5rem, 15vw, 10rem)',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '0.9',
    // Lowercase per design spec
    textTransform: 'lowercase',
    color: 'brand.accent',
    margin: '0',

    '@media (min-width: 768px)': {
      fontSize: 'clamp(3rem, 10vw, 5rem)',
    },
    '@media (min-width: 1024px)': {
      fontSize: 'clamp(4rem, 12vw, 10rem)',
    },
  })

  // Tagline - IBM Plex Sans
  const taglineStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.75rem, 1.5vw, 1rem)',
    fontWeight: '500',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: 'brand.text',
    marginTop: '1.5rem',
    opacity: '0.8',

    '@media (max-width: 767px)': {
      fontSize: '0.75rem',
      letterSpacing: '0.2em',
    },
  })

  // Description - body copy
  const descriptionStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    color: 'brand.textMuted',
    marginTop: '1.5rem',
    maxWidth: '600px',

    '@media (max-width: 767px)': {
      fontSize: '0.9rem',
    },
  })

  // Secondary description
  const secondaryStyles = css({
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 'clamp(0.85rem, 1.1vw, 1rem)',
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: 'brand.phantom',
    marginTop: '1rem',
    maxWidth: '550px',
  })

  // Logos container - bottom positioned
  const logosContainerStyles = css({
    position: 'absolute',
    bottom: '12vh',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    zIndex: '10',

    '@media (max-width: 767px)': {
      bottom: '15vh',
    },
  })
</script>

<div class={containerStyles} data-scene="hero">
  <!-- Video Background -->
  <video
    class={videoStyles}
    src={videoSrc}
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
    data-hero-video
  ></video>

  <!-- Dark Overlay (will animate during transition) -->
  <div class={overlayStyles} data-hero-overlay></div>

  <!-- Content -->
  <div class={contentStyles} data-hero-content>
    <h1 class={titleStyles} data-animate="text">{title}</h1>
    <p class={taglineStyles} data-animate="text">{tagline}</p>
    <p class={descriptionStyles} data-animate="text">{description}</p>
    <p class={secondaryStyles} data-animate="text">{secondary}</p>
  </div>

  <div class={logosContainerStyles} data-hero-logos>
    <LogoStrip />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
```

---

### Task 1.2: Commit Phase 1

**Step 1: Verify changes**

Run: `npm run dev`
Expected: Hero section displays with lowercase "sandrogh" title

**Step 2: Commit**

```bash
git add src/experience/sections/HeroSection.svelte
git commit -m "$(cat <<'EOF'
feat(hero): update Hero section with correct copy

- Title changed to lowercase 'sandrogh' per design spec
- Added secondary description line
- Added ScrollHint component
- Added data attributes for transition hooks
- Responsive typography adjustments

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 1

**Before proceeding to Phase 2, verify:**

- [ ] Hero section displays with lowercase "sandrogh" title
- [ ] Tagline reads "HIGH ALTITUDE & HOSTILE ENVIRONMENT"
- [ ] Both description paragraphs are visible
- [ ] Logo strip appears at bottom
- [ ] ScrollHint chevron animates at bottom center
- [ ] Portal zoom transition to next section still works

---

## Phase 2: New Showreel Section

**Goal:** Create new Showreel section that receives the Hero → Showreel fade transition.

### Task 2.1: Create ShowreelSection Component

**Files:**
- Create: `src/experience/sections/ShowreelSection.svelte`

**Step 1: Create the component**

```svelte
<!--
  ShowreelSection.svelte

  Full-bleed showreel video with minimal chrome.
  Continues the same video from Hero, but in full color (no desaturation).

  Transition from Hero:
  - Hero content fades out
  - Overlay fades to transparent
  - Desaturation filter animates to full color

  Design: Alpine Noir - cinematic full-bleed
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  interface Props {
    videoSrc?: string
  }

  let {
    videoSrc = '/videos/showreel.mp4'
  }: Props = $props()

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  // Video background - FULL COLOR (no desaturation)
  const videoStyles = css({
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    // No filter - full color showreel
  })

  // Subtle gradient for section label legibility
  const gradientStyles = css({
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '200px',
    background: 'linear-gradient(180deg, rgba(15, 23, 26, 0.6) 0%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: '5',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })
</script>

<div class={containerStyles} data-scene="showreel">
  <!-- Video Background (full color) -->
  <video
    class={videoStyles}
    src={videoSrc}
    autoplay
    loop
    muted
    playsinline
    disablepictureinpicture
  ></video>

  <!-- Top gradient for label legibility -->
  <div class={gradientStyles}></div>

  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="SHOWREEL" />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
```

---

### Task 2.2: Add ShowreelSection to Exports

**Files:**
- Modify: `src/experience/sections/index.ts`

**Step 1: Read current exports**

Read: `src/experience/sections/index.ts`

**Step 2: Add ShowreelSection export**

Add after HeroSection export:
```typescript
export { default as ShowreelSection } from './ShowreelSection.svelte'
```

---

### Task 2.3: Update Page to Include Showreel

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Update imports and add ShowreelSection**

```svelte
<script lang="ts">
  import { browser } from '$app/environment'
  import { registerGSAP } from '$lib/core/gsap'
  import { PortalContainer } from '$lib/components'

  // Import section components
  import {
    HeroSection,
    ShowreelSection,
    FilmSection,
    // StoriesSection removed - merged into Film
    AboutSection,
    ServicesSection,
    ContactSection
  } from '$experience/sections'

  // Register GSAP immediately on client (before any components mount)
  if (browser) {
    registerGSAP()
  }
</script>

<svelte:head>
  <title>Sandro Gromen-Hayes | High Altitude DOP</title>
  <meta name="description" content="High altitude and hostile environment cinematographer. Netflix, BBC, Red Bull. Documenting the world's most extreme stories." />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #0f171a;
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
  </style>
  <!-- Load IBM Plex fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<PortalContainer
  totalDuration={36}
  scrollSpeed={65}
  markers={false}
  debug={false}
>
  <!-- Scene 1: Hero -->
  <HeroSection />

  <!-- Scene 2: Showreel (NEW) -->
  <ShowreelSection />

  <!-- Scene 3: Film -->
  <FilmSection />

  <!-- Scene 4: About -->
  <AboutSection />

  <!-- Scene 5: Services -->
  <ServicesSection />

  <!-- Scene 6: Contact -->
  <ContactSection />
</PortalContainer>
```

---

### Task 2.4: Commit Phase 2

**Step 1: Verify Showreel section**

Run: `npm run dev`
Expected: Scrolling past Hero shows Showreel with full-color video

**Step 2: Commit**

```bash
git add src/experience/sections/ShowreelSection.svelte src/experience/sections/index.ts src/routes/+page.svelte
git commit -m "$(cat <<'EOF'
feat(showreel): add new Showreel section

- Full-bleed video without desaturation filter
- Section label with top gradient for legibility
- ScrollHint component
- Removed StoriesSection import (merged into Film)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 2

**Before proceeding to Phase 3, verify:**

- [ ] Showreel section appears after Hero
- [ ] Video plays in full color (no desaturation)
- [ ] "SHOWREEL" label visible in top-left
- [ ] Portal zoom transition works: Showreel → Film
- [ ] No errors in console

---

## Phase 3: Film Section Redesign

**Goal:** Implement two-column layout with bordered viewport and content slab.

### Task 3.1: Create FilmProject Type and Data

**Files:**
- Modify: `src/experience/sections/FilmSection.svelte`

**Step 1: Update film data with correct projects**

The 4 projects per design spec:
1. 14 Peaks (Netflix) - YouTube embed
2. No Days Off (RedBull TV) - Image + external link
3. Grace (Montane) - Local video
4. Afghanistan (Charles Schwab) - Local video

```typescript
interface FilmProject {
  id: string
  title: string
  client: string
  year?: string
  description: string
  media: {
    type: 'youtube' | 'video' | 'image'
    src: string
    poster?: string
    externalLink?: string
  }
}

const films: FilmProject[] = [
  {
    id: '14-peaks',
    title: '14 PEAKS',
    client: 'NETFLIX',
    year: '2021',
    description: "I worked as lead cinematographer on Netflix's smash hit 14 Peaks. I shot most of the drone footage along with key scenes including the intro, Nims visiting his family and the K2 drama. I then worked as DOP on the first successful K2 winter expedition.",
    media: {
      type: 'youtube',
      src: 'https://www.youtube.com/embed/8QH5hBOoz08',
    }
  },
  {
    id: 'no-days-off',
    title: 'NO DAYS OFF',
    client: 'REDBULL TV',
    year: '2022',
    description: "In 2022 I filmed episode 1 of Sasha DiGiulian's 'No Days Off' series for RedBull TV. During preparation for Petzl's RocTrip Sasha, Alex Megos, Steve McClure & Neil Gresham developed new routes in a remote and undeveloped corner of Greece's mainland.",
    media: {
      type: 'image',
      src: 'https://static.wixstatic.com/media/37d07c_5ed3218453264242ab5e39b7c013c723~mv2.jpg',
      externalLink: 'https://www.redbull.com/us-en/episodes/no-days-off-s1-e1',
    }
  },
  {
    id: 'grace',
    title: 'GRACE',
    client: 'MONTANE',
    description: 'I directed, shot and edited the story of Grace, a recovering climber searching for a bigger life. Focusing on mental health and community the film was supported by Montane and played at film festivals world wide.',
    media: {
      type: 'video',
      src: '/videos/grace.mp4',
    }
  },
  {
    id: 'afghanistan',
    title: 'AFGHANISTAN',
    client: 'CHARLES SCHWAB',
    description: 'Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m.',
    media: {
      type: 'video',
      src: '/videos/shwab.mp4',
    }
  },
]
```

---

### Task 3.2: Implement Two-Column Layout

**Files:**
- Modify: `src/experience/sections/FilmSection.svelte`

**Step 1: Complete FilmSection rewrite**

Due to the significant changes, this requires a full rewrite. Key patterns:
- Use gsap.context() for all animations (see `docs/framework/patterns.md`)
- Two-column grid: viewport (60%) + content slab (40%)
- Scroll-driven beat navigation
- StepIndicator component

The full implementation is extensive - see design spec for layout details.
Reference: `docs/framework/patterns.md` for gsap.context() usage

```svelte
<!--
  FilmSection.svelte

  Film section with two-column layout.
  Left: Bordered viewport with video/image/embed
  Right: Content slab with project details

  Design: Two-column grid, scroll-driven beats
  Motion: Machine archetype - precise pan transitions
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import { BRAND, DURATION } from '$lib/animation/easing'
  import SectionLabel from '../components/ui/SectionLabel.svelte'
  import BorderedViewport from '../components/ui/BorderedViewport.svelte'
  import ContentSlab from '../components/ui/ContentSlab.svelte'
  import StepIndicator from '../components/ui/StepIndicator.svelte'
  import ScrollHint from '../components/ui/ScrollHint.svelte'

  // Film data - see Task 3.1 for interface
  interface FilmProject {
    id: string
    title: string
    client: string
    year?: string
    description: string
    media: {
      type: 'youtube' | 'video' | 'image'
      src: string
      poster?: string
      externalLink?: string
    }
  }

  const films: FilmProject[] = [
    {
      id: '14-peaks',
      title: '14 PEAKS',
      client: 'NETFLIX',
      year: '2021',
      description: "I worked as lead cinematographer on Netflix's smash hit 14 Peaks. I shot most of the drone footage along with key scenes including the intro, Nims visiting his family and the K2 drama. I then worked as DOP on the first successful K2 winter expedition.",
      media: { type: 'youtube', src: 'https://www.youtube.com/embed/8QH5hBOoz08' }
    },
    {
      id: 'no-days-off',
      title: 'NO DAYS OFF',
      client: 'REDBULL TV',
      year: '2022',
      description: "In 2022 I filmed episode 1 of Sasha DiGiulian's 'No Days Off' series for RedBull TV. During preparation for Petzl's RocTrip Sasha, Alex Megos, Steve McClure & Neil Gresham developed new routes in a remote and undeveloped corner of Greece's mainland.",
      media: {
        type: 'image',
        src: 'https://static.wixstatic.com/media/37d07c_5ed3218453264242ab5e39b7c013c723~mv2.jpg',
        externalLink: 'https://www.redbull.com/us-en/episodes/no-days-off-s1-e1'
      }
    },
    {
      id: 'grace',
      title: 'GRACE',
      client: 'MONTANE',
      description: 'I directed, shot and edited the story of Grace, a recovering climber searching for a bigger life. Focusing on mental health and community the film was supported by Montane and played at film festivals world wide.',
      media: { type: 'video', src: '/videos/grace.mp4' }
    },
    {
      id: 'afghanistan',
      title: 'AFGHANISTAN',
      client: 'CHARLES SCHWAB',
      description: 'Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m.',
      media: { type: 'video', src: '/videos/shwab.mp4' }
    },
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let activeIndex = $state(0)
  let ctx: gsap.Context | null = $state(null)
  let isScrollDriven = $state(true)
  let isAnimating = $state(false)

  // Step indicator data
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // Handle step selection
  function handleStepSelect(index: number) {
    if (index === activeIndex || isAnimating) return
    isScrollDriven = false
    activeIndex = index
    setTimeout(() => { isScrollDriven = true }, DURATION.standard * 1000 + 100)
  }

  // Scroll-driven navigation
  onMount(() => {
    if (!containerEl) return

    const portalContainer = document.querySelector('[data-portal-container]') as HTMLElement
    if (!portalContainer) return

    const viewport = portalContainer.querySelector('[style*="position: fixed"]')
    if (!viewport) return

    const allScenes = viewport.querySelectorAll('[data-scene]')
    let sectionIndex = -1
    allScenes.forEach((scene, i) => {
      if (scene === containerEl) sectionIndex = i
    })

    if (sectionIndex < 0) return

    const totalHeight = portalContainer.scrollHeight - window.innerHeight
    const sceneCount = allScenes.length
    const sceneHeight = totalHeight / sceneCount
    const sectionStart = sectionIndex * sceneHeight
    const sectionEnd = (sectionIndex + 1) * sceneHeight

    ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: portalContainer,
        start: `top+=${sectionStart} top`,
        end: `top+=${sectionEnd} top`,
        onUpdate: (self) => {
          if (!isScrollDriven || isAnimating) return
          const progress = self.progress
          const beatIndex = Math.min(Math.floor(progress * films.length), films.length - 1)
          if (beatIndex !== activeIndex) {
            activeIndex = beatIndex
          }
        },
      })
    })
  })

  onDestroy(() => {
    ctx?.revert()
  })

  // Styles
  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    backgroundColor: 'brand.bg',
  })

  const labelContainerStyles = css({
    position: 'absolute',
    top: '8vh',
    left: '8vw',
    zIndex: '10',
  })

  const gridStyles = css({
    display: 'grid',
    gridTemplateColumns: '0.6fr 0.4fr',
    gap: '2rem',
    width: '100%',
    height: '100%',
    padding: '12vh 8vw',
    boxSizing: 'border-box',

    '@media (max-width: 1023px)': {
      gridTemplateColumns: '0.55fr 0.45fr',
      gap: '1.5rem',
      padding: '10vh 6vw',
    },
    '@media (max-width: 767px)': {
      gridTemplateColumns: '1fr',
      gap: '1rem',
      padding: '10vh 4vw',
    },
  })

  const viewportContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const slabContainerStyles = css({
    display: 'flex',
    alignItems: 'center',
  })

  const indicatorContainerStyles = css({
    position: 'absolute',
    bottom: '8vh',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10',
  })

  // Get current film
  const currentFilm = $derived(films[activeIndex])
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text="FILM -- HIGH ALTITUDE FEATURES" />
  </div>

  <!-- Two-Column Grid -->
  <div class={gridStyles}>
    <!-- Left: Bordered Viewport -->
    <div class={viewportContainerStyles}>
      <BorderedViewport aspectRatio="2.39/1">
        {#if currentFilm.media.type === 'youtube'}
          <iframe
            src={currentFilm.media.src}
            title={currentFilm.title}
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else if currentFilm.media.type === 'video'}
          <video
            src={currentFilm.media.src}
            autoplay
            loop
            muted
            playsinline
          ></video>
        {:else if currentFilm.media.type === 'image'}
          {#if currentFilm.media.externalLink}
            <a href={currentFilm.media.externalLink} target="_blank" rel="noopener noreferrer">
              <img src={currentFilm.media.src} alt={currentFilm.title} />
              <!-- Play button overlay -->
              <div class={css({
                position: 'absolute',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                transition: 'background-color 0.2s',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' },
              })}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </a>
          {:else}
            <img src={currentFilm.media.src} alt={currentFilm.title} />
          {/if}
        {/if}
      </BorderedViewport>
    </div>

    <!-- Right: Content Slab -->
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
  <div class={indicatorContainerStyles}>
    <StepIndicator
      {steps}
      activeIndex={activeIndex}
      showLabels={true}
      onSelect={handleStepSelect}
    />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>
```

---

### Task 3.3: Commit Phase 3

**Step 1: Verify Film section**

Run: `npm run dev`
Expected: Film section shows two-column layout with bordered viewport

**Step 2: Commit**

```bash
git add src/experience/sections/FilmSection.svelte
git commit -m "$(cat <<'EOF'
feat(film): redesign Film section with two-column layout

- Two-column grid: viewport (60%) + content slab (40%)
- BorderedViewport component for media
- ContentSlab component for project details
- StepIndicator with project labels
- Correct projects: 14 Peaks, No Days Off, Grace, Afghanistan
- Scroll-driven beat navigation preserved
- Responsive: stacks on mobile

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 3

**Before proceeding to Phase 4, verify:**

- [ ] Film section displays two-column layout (desktop)
- [ ] BorderedViewport has 1px yellow border, 4px radius
- [ ] Content slab shows eyebrow, title, description, year
- [ ] 4 projects are correct: 14 Peaks, No Days Off, Grace, Afghanistan
- [ ] Step indicator dots work (click to navigate)
- [ ] YouTube embed plays for 14 Peaks
- [ ] Image with play button for No Days Off (links to RedBull)
- [ ] Local videos play for Grace and Afghanistan
- [ ] Scroll-driven navigation between beats works
- [ ] Portal zoom transition works: Film → About
- [ ] Responsive: stacks vertically on mobile (<768px)

---

## Phase 4: About Section Redesign

**Goal:** Implement two-column layout matching Film section pattern.

### Task 4.1: Update AboutSection with Two-Column Layout

**Files:**
- Modify: `src/experience/sections/AboutSection.svelte`

Key changes:
- Two-column grid matching Film section
- 3 beats with correct copy from design spec
- Bar-style progress indicator (differentiates from Film dots)
- Static images in viewport

**Step 1: Read current implementation**

Read: `src/experience/sections/AboutSection.svelte`

**Step 2: Update with two-column layout**

Follow the same pattern as FilmSection but with:
- Bar indicators instead of dots
- Static images (no video)
- 3 beats from design spec copy

---

### Task 4.2: Commit Phase 4

**Step 1: Verify About section**

Run: `npm run dev`
Expected: About section shows two-column layout with bar indicators

**Step 2: Commit**

```bash
git add src/experience/sections/AboutSection.svelte
git commit -m "$(cat <<'EOF'
feat(about): redesign About section with two-column layout

- Two-column grid matching Film section
- 3 beats: Front-line perspective, Origin story, Values
- Bar-style progress indicators (differentiates from Film)
- Correct copy from design spec

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 4

**Before proceeding to Phase 5, verify:**

- [ ] About section displays two-column layout
- [ ] 3 beats with correct copy
- [ ] Bar indicators (not dots) for progress
- [ ] Images display in bordered viewport
- [ ] Portal zoom transition works: About → Services

---

## Phase 5: Services Section Update

**Goal:** Implement staggered card reveal.

### Task 5.1: Update ServicesSection

**Files:**
- Modify: `src/experience/sections/ServicesSection.svelte`

Key changes:
- 4 service cards per design spec
- Staggered reveal animation using gsap.context()
- External link for Shutterstock
- Bordered cards with accent color

---

### Task 5.2: Commit Phase 5

```bash
git add src/experience/sections/ServicesSection.svelte
git commit -m "$(cat <<'EOF'
feat(services): update Services section with card layout

- 4 service cards: Mountain DOP, Photography, Aerial, Stock
- Staggered reveal animation
- External link for Shutterstock stock footage

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 5

**Before proceeding to Phase 6, verify:**

- [ ] Services section displays 4 cards
- [ ] Cards have 1px accent border
- [ ] Staggered reveal animation on scroll
- [ ] Shutterstock link opens in new tab
- [ ] Portal zoom transition works: Services → Contact

---

## Phase 6: Contact Section Update

**Goal:** Update copy and layout.

### Task 6.1: Update ContactSection

**Files:**
- Modify: `src/experience/sections/ContactSection.svelte`

Key changes:
- Correct copy from design spec
- Clickable phone and email links
- No scroll hint (final section)

---

### Task 6.2: Commit Phase 6

```bash
git add src/experience/sections/ContactSection.svelte
git commit -m "$(cat <<'EOF'
feat(contact): update Contact section with correct copy

- Updated headline from design spec
- Clickable tel: and mailto: links
- Removed scroll hint (final section)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 6

**Before proceeding to Phase 7, verify:**

- [ ] Contact section displays correct copy
- [ ] Phone number is clickable (tel: link)
- [ ] Email is clickable (mailto: link)
- [ ] No scroll hint at bottom

---

## Phase 7: Remove StoriesSection

**Goal:** Clean up unused code.

### Task 7.1: Delete StoriesSection File

**Files:**
- Delete: `src/experience/sections/StoriesSection.svelte`

**Step 1: Remove file**

Run: `rm src/experience/sections/StoriesSection.svelte`

**Step 2: Update barrel export**

Modify: `src/experience/sections/index.ts`
Remove: `export { default as StoriesSection } from './StoriesSection.svelte'`

---

### Task 7.2: Commit Phase 7

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: remove StoriesSection (merged into Film)

Stories content has been consolidated into the Film section.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 7

- [ ] No errors in console
- [ ] Build succeeds (`npm run build`)
- [ ] All 6 sections work: Hero, Showreel, Film, About, Services, Contact

---

## Phase 8: Hero → Showreel Transition

**Goal:** Implement the fade reveal transition (NOT portal zoom).

### Task 8.1: Implement Custom Transition

This requires modifying the PortalContainer or adding a custom transition handler. The transition should:
1. Fade out Hero content
2. Fade overlay to transparent
3. Animate filter from `saturate(0.3)` to `saturate(1.0)`

**Reference:**
- `docs/framework/patterns.md` for gsap.context() pattern
- `docs/Brand Physics Archtype.md` for timing (DURATION.cinematic = 550ms)

**Files:**
- Modify: `src/experience/sections/HeroSection.svelte` - Add transition logic
- May need: Custom transition in PortalContainer

---

### Task 8.2: Commit Phase 8

```bash
git add src/experience/sections/HeroSection.svelte
git commit -m "$(cat <<'EOF'
feat(transition): implement Hero → Showreel fade reveal

- Hero content fades out
- Overlay fades to transparent
- Desaturation filter animates to full color
- Uses brand-cinematic duration (550ms)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## User Verification: Phase 8

- [ ] Scrolling from Hero to Showreel triggers fade reveal (NOT portal zoom)
- [ ] Hero content fades out smoothly
- [ ] Video transitions from desaturated to full color
- [ ] Overlay fades to transparent
- [ ] Transition duration feels cinematic (~550ms)

---

## Final Verification Checklist

Before considering this implementation complete:

### Functional Requirements
- [ ] All 6 sections render correctly
- [ ] Portal zoom transitions work between all sections EXCEPT Hero → Showreel
- [ ] Hero → Showreel uses fade reveal transition
- [ ] Two-column layouts work on Film and About sections
- [ ] Bordered viewports have correct styling
- [ ] All copy matches design spec
- [ ] Video/YouTube/Image media types work correctly
- [ ] External links open in new tabs
- [ ] ScrollHint appears on all sections except Contact

### Responsive Requirements
- [ ] Desktop (≥1024px): Two-column layouts, full functionality
- [ ] Tablet (768-1023px): Slightly adjusted proportions
- [ ] Mobile (<768px): Single column, stacked layouts

### Performance Requirements
- [ ] No console errors
- [ ] Build succeeds
- [ ] Videos load and play smoothly
- [ ] Animations don't cause layout thrashing

### Brand Alignment
- [ ] Colors match brand tokens (Egg Toast accent, Black Stallion bg)
- [ ] Typography uses IBM Plex family
- [ ] Motion uses brand duration tokens (micro/standard/cinematic)
- [ ] Easing uses brand curves (lockOn/release)

---

## Appendix: Brand Token Quick Reference

From `src/lib/animation/easing.ts`:

```typescript
// Easing curves
BRAND.lockOn = 'cubic-bezier(0.19, 1.0, 0.22, 1.0)'  // Elements entering
BRAND.release = 'cubic-bezier(0.25, 0.0, 0.35, 1.0)' // Elements exiting

// Durations (seconds)
DURATION.micro = 0.175      // Small state changes
DURATION.standard = 0.315   // Most UI transitions
DURATION.cinematic = 0.55   // Major transitions
```

From PandaCSS tokens (assumed from Brand Design System):
```
brand.accent = #f6c605     // Egg Toast
brand.bg = #0f171a         // Black Stallion
brand.surface = #20292b    // Black Pearl
brand.text = #c0bfb6       // Silverplate
brand.textMuted = #939c9a  // Walrus
brand.phantom = #707977    // Phantom
```
