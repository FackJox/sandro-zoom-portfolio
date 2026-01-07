# Film Overview Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace FilmSection with FilmOverviewSection - a scroll-driven overview grid that expands each film individually with smooth transitions.

**Architecture:** Single component with internal scroll-driven state machine. Uses gsap.context() for all animations, time-based positioning, and brand physics tokens. Reuses existing UI components (BorderedViewport, ContentSlab, SectionLabel, StepIndicator).

**Tech Stack:** SvelteKit, GSAP (ScrollTrigger), PandaCSS, TypeScript

**Commit Strategy:** User commits manually after verification passes for each task.

---

## Task 1: Register Brand Physics Custom Easings

**Files:**
- Modify: `src/lib/core/gsap.ts`

**Context:** The brand physics easings `ease-lock-on` and `ease-release` need to be registered as CustomEase curves so they can be referenced by name in animations. The `BRAND` constants in `easing.ts` already exist but are CSS cubic-bezier strings, not GSAP CustomEase names.

**Step 1: Read current gsap.ts to understand registration pattern**

Check how plugins are currently registered.

**Step 2: Add DURATION constants to easing.ts**

Add brand physics duration tokens to `src/lib/animation/easing.ts`:

```typescript
/**
 * Brand physics duration tokens (in seconds)
 * From: docs/Brand Physics Archtype.md
 */
export const DURATION = {
  /** 175ms - Border color changes, micro interactions */
  micro: 0.175,
  /** 315ms - Content animations, standard transitions */
  standard: 0.315,
  /** 550ms - Major state changes, layout shifts */
  cinematic: 0.55,
} as const

export type DurationToken = keyof typeof DURATION
```

**Step 3: Add CustomEase registration for brand easings**

After the `gsap.registerPlugin()` call in `src/lib/core/gsap.ts`, add:

```typescript
import { CustomEase } from 'gsap/CustomEase'

// In registerGSAP() after gsap.registerPlugin():

// Register brand physics easings as CustomEase
// From: docs/Brand Physics Archtype.md
CustomEase.create('ease-lock-on', 'M0,0 C0.19,1 0.22,1 1,1')
CustomEase.create('ease-release', 'M0,0 C0.25,0 0.35,1 1,1')
```

### Verification & Validation

**V1.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors related to CustomEase
- [ ] No TypeScript errors related to DURATION export

**V1.2: Dev Server Check**
```bash
npm run dev
```
- [ ] Dev server starts without errors
- [ ] No GSAP registration errors in browser console

**V1.3: Easing Registration Test**

Open browser console and run:
```javascript
gsap.to(document.body, { x: 0, ease: 'ease-lock-on', duration: 0.001 })
gsap.to(document.body, { x: 0, ease: 'ease-release', duration: 0.001 })
```
- [ ] No "ease not found" errors thrown
- [ ] Both commands execute without console errors

**V1.4: DURATION Import Test**

In a component or browser console, verify:
```typescript
import { DURATION } from '$lib/animation/easing'

console.log(DURATION.micro)      // 0.175
console.log(DURATION.standard)   // 0.315
console.log(DURATION.cinematic)  // 0.55
```
- [ ] All three values log correctly
- [ ] TypeScript recognizes DURATION type

**Ready to commit when all V1.x checks pass.**

---

## Task 2: Create FilmOverviewSection Base Component

**Files:**
- Create: `src/experience/sections/FilmOverviewSection.svelte`

**Context:** Create the component shell with film data, container binding, and basic state. Follow the pattern from `FilmSection.svelte` but with the new overview structure.

**Step 1: Create component with film data and state**

```svelte
<!--
  FilmOverviewSection.svelte

  Scroll-driven overview grid that expands each film individually.
  Replaces FilmSection with overview → focus → overview cycle.

  Design: docs/plans/2025-01-07-film-overview-section-design.md
  Patterns: docs/framework/patterns.md (gsap.context, cleanup, autoAlpha)
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

  // Film project data (same as FilmSection)
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
        src: 'https://www.youtube.com/embed/8QH5hBOoz08'
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
        externalLink: 'https://www.redbull.com/us-en/episodes/no-days-off-s1-e1'
      }
    },
    {
      id: 'grace',
      title: 'GRACE',
      client: 'MONTANE',
      description: 'I directed, shot and edited the story of Grace, a recovering climber searching for a bigger life. Focusing on mental health and community the film was supported by Montane and played at film festivals world wide.',
      media: {
        type: 'video',
        src: '/videos/grace.mp4'
      }
    },
    {
      id: 'afghanistan',
      title: 'AFGHANISTAN',
      client: 'CHARLES SCHWAB',
      description: 'Filmed during one of six trips to Afghanistan this commercial for Charles Schwab bank depicts preparation for our record breaking expedition to Mt Noshaq, the countries highest peak at 7,495m.',
      media: {
        type: 'video',
        src: '/videos/shwab.mp4'
      }
    },
  ]

  // State
  let containerEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)
  let activeIndex = $state(0)
  let phase = $state<'overview' | 'focus' | 'transition'>('overview')

  // Derived state
  const currentFilm = $derived(films[activeIndex])
  const labelText = $derived(
    phase === 'overview' ? 'FILM' : 'FILM — HIGH ALTITUDE FEATURES'
  )
  const steps = films.map(f => ({ id: f.id, label: f.title }))

  // Mobile detection
  let isMobile = $state(false)

  $effect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia('(max-width: 767px)')
    isMobile = mql.matches

    const handler = (e: MediaQueryListEvent) => {
      isMobile = e.matches
    }

    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  })

  // Cleanup
  onDestroy(() => {
    ctx?.revert()
  })
</script>

<div bind:this={containerEl} class={containerStyles} data-scene="film-overview">
  <!-- Section Label -->
  <div class={labelContainerStyles}>
    <SectionLabel text={labelText} />
  </div>

  <!-- Placeholder for content - will be built in next tasks -->
  <div style="color: white; padding: 2rem;">
    FilmOverviewSection placeholder - {films.length} films loaded
  </div>

  <!-- Step Indicator -->
  <div class={indicatorContainerStyles}>
    <StepIndicator
      {steps}
      {activeIndex}
      showLabels={true}
    />
  </div>

  <!-- Scroll Hint -->
  <ScrollHint />
</div>

<style>
  /* Base styles defined in script with css() */
</style>

<script context="module" lang="ts">
  // Styles using PandaCSS
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

  const indicatorContainerStyles = css({
    position: 'absolute',
    bottom: '8vh',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10',

    '@media (max-width: 767px)': {
      bottom: '10vh',
    },
  })
</script>
```

### Verification & Validation

**V2.1: TypeScript Check**
```bash
npm run check
```
- [ ] No TypeScript errors in FilmOverviewSection.svelte
- [ ] All imports resolve correctly

**V2.2: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors

**V2.3: Visual Inspection (not wired up yet)**

Temporarily add to `+page.svelte` to test rendering:
```svelte
import FilmOverviewSection from '$experience/sections/FilmOverviewSection.svelte'
<!-- Add somewhere visible -->
<div style="position: fixed; inset: 0; z-index: 9999;">
  <FilmOverviewSection />
</div>
```

- [ ] Component renders without crashing
- [ ] "FILM" label visible in top-left
- [ ] Placeholder text shows "4 films loaded"
- [ ] Step indicator visible at bottom with 4 steps
- [ ] Scroll hint visible

**V2.4: State Validation**

Open browser console and inspect component:
```javascript
// Check films array loaded
document.querySelector('[data-scene="film-overview"]') !== null
```
- [ ] Container element exists with correct data attribute

**Remove temporary test code before committing.**

**Ready to commit when all V2.x checks pass.**

---

## Task 3: Add Overview Grid Layout

**Files:**
- Modify: `src/experience/sections/FilmOverviewSection.svelte`

**Context:** Add the overview grid showing all 4 films with title/client overlays. Desktop: horizontal row. Mobile: vertical stack.

**Step 1: Add overview grid styles**

Add to the `<script context="module">` section:

```typescript
const overviewGridStyles = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1.5rem',
  padding: '12vh 8vw',
  height: '100%',
  alignItems: 'center',

  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
    gap: '1rem',
    padding: '14vh 4vw 16vh',
    overflowY: 'auto',
  },
})

const filmFrameStyles = css({
  position: 'relative',
  width: '100%',
})

const overlayStyles = css({
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  padding: '1.5rem 1rem 1rem',
  background: 'linear-gradient(to top, rgba(15, 23, 26, 0.95) 0%, rgba(15, 23, 26, 0) 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
})

const filmTitleStyles = css({
  fontFamily: 'IBM Plex Sans Condensed, sans-serif',
  fontWeight: '700',
  fontSize: '1rem',
  letterSpacing: '0.05em',
  color: 'brand.text',
  textTransform: 'uppercase',

  '@media (max-width: 767px)': {
    fontSize: '0.875rem',
  },
})

const filmClientStyles = css({
  fontFamily: 'IBM Plex Sans, sans-serif',
  fontWeight: '400',
  fontSize: '0.75rem',
  letterSpacing: '0.1em',
  color: 'brand.textMuted',
  textTransform: 'uppercase',
})
```

**Step 2: Add overview grid markup**

Replace the placeholder div with:

```svelte
<!-- Overview Grid (all 4 films) -->
<div class={overviewGridStyles} data-overview-grid>
  {#each films as film, i}
    <div
      class={filmFrameStyles}
      data-film={film.id}
      data-index={i}
      data-border
    >
      <BorderedViewport aspectRatio={isMobile ? '16/9' : '2.39/1'}>
        {#if film.media.type === 'youtube'}
          <img
            src={`https://img.youtube.com/vi/${film.media.src.split('/').pop()}/maxresdefault.jpg`}
            alt={film.title}
          />
        {:else if film.media.type === 'video'}
          <video
            src={film.media.src}
            autoplay
            loop
            muted
            playsinline
          ></video>
        {:else if film.media.type === 'image'}
          <img src={film.media.src} alt={film.title} />
        {/if}
      </BorderedViewport>
      <!-- Overlay: Title + Client -->
      <div class={overlayStyles}>
        <span class={filmTitleStyles}>{film.title}</span>
        <span class={filmClientStyles}>{film.client}</span>
      </div>
    </div>
  {/each}
</div>
```

### Verification & Validation

**V3.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors

**V3.2: Desktop Layout (viewport > 768px)**

- [ ] 4 film frames visible in a horizontal row
- [ ] Each frame has 2.39:1 aspect ratio (cinematic widescreen)
- [ ] Equal spacing between frames (~1.5rem gap)
- [ ] All frames have yellow (#f6c605) accent border

**V3.3: Desktop Content Check**

For each of the 4 films:
- [ ] 14 PEAKS: YouTube thumbnail visible, "14 PEAKS" title, "NETFLIX" client
- [ ] NO DAYS OFF: Image visible, "NO DAYS OFF" title, "REDBULL TV" client
- [ ] GRACE: Video playing (muted), "GRACE" title, "MONTANE" client
- [ ] AFGHANISTAN: Video playing (muted), "AFGHANISTAN" title, "CHARLES SCHWAB" client

**V3.4: Mobile Layout (viewport < 768px)**

Use browser DevTools to simulate mobile (e.g., iPhone 14 Pro):
- [ ] 4 film frames stacked vertically
- [ ] Each frame has 16:9 aspect ratio
- [ ] Vertical gap between frames (~1rem)
- [ ] All content still visible and readable

**V3.5: Overlay Styling**

- [ ] Title/client overlay has dark gradient background
- [ ] Text is legible over any media content
- [ ] Title uses condensed font, all caps
- [ ] Client uses regular font, smaller size, muted color

**V3.6: DOM Structure Check**

Open DevTools Elements panel:
```javascript
document.querySelectorAll('[data-film]').length === 4
document.querySelectorAll('[data-index]').length === 4
```
- [ ] 4 elements with `data-film` attribute
- [ ] Each has correct `data-index` (0, 1, 2, 3)

**Ready to commit when all V3.x checks pass.**

---

## Task 4: Add Focus Layout Structure

**Files:**
- Modify: `src/experience/sections/FilmOverviewSection.svelte`

**Context:** Add the focus layout (60/40 split) that will be shown when a film is expanded. Initially hidden with autoAlpha: 0.

**Step 1: Add focus layout styles**

Add to the `<script context="module">` section:

```typescript
const focusLayoutStyles = css({
  position: 'absolute',
  inset: '0',
  display: 'grid',
  gridTemplateColumns: '0.6fr 0.4fr',
  gap: '2rem',
  padding: '12vh 8vw',
  boxSizing: 'border-box',
  pointerEvents: 'none', // Hidden initially

  '@media (max-width: 1023px)': {
    gridTemplateColumns: '0.55fr 0.45fr',
    gap: '1.5rem',
    padding: '10vh 6vw',
  },

  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
    padding: '12vh 4vw 16vh',
  },
})

const focusViewportContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const focusSlabContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
})
```

**Step 2: Add focus layout markup**

Add after the overview grid, before the step indicator:

```svelte
<!-- Focus Layout (shown during focus state) -->
<div class={focusLayoutStyles} data-focus-layout>
  <div class={focusViewportContainerStyles}>
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
          </a>
        {:else}
          <img src={currentFilm.media.src} alt={currentFilm.title} />
        {/if}
      {/if}
    </BorderedViewport>
  </div>
  <div class={focusSlabContainerStyles} data-content-slab>
    <ContentSlab
      eyebrow={currentFilm.client}
      title={currentFilm.title}
      description={currentFilm.description}
      year={currentFilm.year}
    />
  </div>
</div>
```

**Step 3: Initialize focus layout as hidden**

Add to onMount:

```typescript
onMount(() => {
  if (!containerEl) return

  ctx = gsap.context(() => {
    // Initialize focus layout as hidden
    const focusLayout = containerEl!.querySelector('[data-focus-layout]')
    if (focusLayout) {
      gsap.set(focusLayout, { autoAlpha: 0 })
    }

    // Initialize content slab as hidden
    const contentSlab = containerEl!.querySelector('[data-content-slab]')
    if (contentSlab) {
      gsap.set(contentSlab, { autoAlpha: 0, x: 40 })
    }
  }, containerEl)
})
```

### Verification & Validation

**V4.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors

**V4.2: DOM Existence Check**

Open DevTools Elements panel:
```javascript
document.querySelector('[data-focus-layout]') !== null
document.querySelector('[data-content-slab]') !== null
```
- [ ] Focus layout element exists in DOM
- [ ] Content slab element exists in DOM

**V4.3: Hidden State Verification**

Open DevTools and inspect `[data-focus-layout]`:
- [ ] Element has `visibility: hidden` (from autoAlpha: 0)
- [ ] Element has `opacity: 0`

Inspect `[data-content-slab]`:
- [ ] Element has `visibility: hidden`
- [ ] Element has `opacity: 0`
- [ ] Element has `transform` with `translateX(40px)` or similar

**V4.4: Focus Layout Structure (temporarily make visible for inspection)**

Temporarily in DevTools, set on `[data-focus-layout]`:
```css
visibility: visible !important;
opacity: 1 !important;
```

Desktop (> 768px):
- [ ] 60/40 grid layout visible
- [ ] Left side: BorderedViewport with media
- [ ] Right side: ContentSlab with film details
- [ ] ContentSlab shows: NETFLIX, 14 PEAKS, description, 2021

Mobile (< 768px):
- [ ] Single column layout
- [ ] Video/image on top
- [ ] ContentSlab below

**V4.5: ContentSlab Content Check**

With focus layout visible:
- [ ] Eyebrow shows client name (e.g., "NETFLIX")
- [ ] Title shows film name (e.g., "14 PEAKS")
- [ ] Description text is fully visible (not truncated)
- [ ] Year shows if available (e.g., "2021")

**Reset visibility back to hidden after inspection.**

**V4.6: gsap.context Check**

Verify context is created:
```javascript
// In browser console after component mounts
// The ctx variable should be defined (internal state)
```
- [ ] No console errors about GSAP context

**Ready to commit when all V4.x checks pass.**

---

## Task 5: Build Scroll-Driven Animation Timeline

**Files:**
- Modify: `src/experience/sections/FilmOverviewSection.svelte`
- Verify: `src/experience/components/ui/BorderedViewport.svelte` has `data-bordered-viewport` attribute

**Context:** Build the main animation timeline that drives the overview → focus → overview cycle for each film. Uses time-based positioning with brand physics tokens.

**Prerequisite:** Ensure `BorderedViewport.svelte` has `data-bordered-viewport` on its border container element. If not, add it:
```svelte
<!-- In BorderedViewport.svelte, on the border wrapper div -->
<div class={borderStyles} data-bordered-viewport>
  ...
</div>
```

**Step 1: Create timeline builder function**

Add this function before onMount:

```typescript
/**
 * Build the scroll-driven timeline for film overview transitions.
 * Each film gets ~9s of scroll time. Total: 36s.
 *
 * Sequence per film:
 * 0.0s - Overview visible (all films)
 * 0.8s - Non-focused borders fade to phantom
 * 1.2s - Non-focused films scale down + fade out
 * 1.8s - Label transitions to full text
 * 2.0s - Focused film expands to 60% width
 * 2.6s - Content slab fades in
 * 5.6s - Content slab fades out
 * 6.0s - Focused film shrinks back to 25%
 * 6.5s - Other films scale up + fade in
 * 7.2s - Accent border shifts to next film
 * 9.0s - Next film cycle begins
 */
function buildFilmTimeline(container: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline()
  const filmFrames = container.querySelectorAll('[data-film]')
  const focusLayout = container.querySelector('[data-focus-layout]')
  const contentSlab = container.querySelector('[data-content-slab]')
  const overviewGrid = container.querySelector('[data-overview-grid]')

  // Cycle duration per film (in timeline seconds, not real seconds)
  const CYCLE = 9

  films.forEach((film, filmIndex) => {
    const cycleStart = filmIndex * CYCLE
    const currentFrame = filmFrames[filmIndex] as HTMLElement
    const otherFrames = Array.from(filmFrames).filter((_, i) => i !== filmIndex) as HTMLElement[]

    // Get border elements using data attribute (robust selector)
    // BorderedViewport should have data-bordered-viewport on its border element
    const currentBorder = currentFrame?.querySelector('[data-bordered-viewport]') as HTMLElement
    const otherBorders = otherFrames.map(f => f.querySelector('[data-bordered-viewport]') as HTMLElement)

    // ========================================================================
    // PHASE 1: Border fade (0.8s into cycle)
    // ========================================================================
    otherBorders.forEach(border => {
      if (border) {
        tl.to(border, {
          borderColor: '#707977', // brand.phantom
          duration: DURATION.micro,
          ease: 'ease-lock-on',
        }, cycleStart + 0.8)
      }
    })

    // Keep current border accent
    if (currentBorder) {
      tl.to(currentBorder, {
        borderColor: '#f6c605', // brand.accent
        duration: DURATION.micro,
        ease: 'ease-lock-on',
      }, cycleStart + 0.8)
    }

    // ========================================================================
    // PHASE 2: Others exit (1.2s into cycle)
    // ========================================================================
    otherFrames.forEach(frame => {
      tl.to(frame, {
        scale: 0.85,
        autoAlpha: 0,
        duration: DURATION.cinematic,
        ease: 'ease-release',
      }, cycleStart + 1.2)
    })

    // ========================================================================
    // PHASE 3: Layout shift - expand current film (2.0s into cycle)
    // ========================================================================
    // Hide overview grid, show focus layout
    if (overviewGrid) {
      tl.to(overviewGrid, {
        autoAlpha: 0,
        duration: DURATION.cinematic,
        ease: 'ease-release',
      }, cycleStart + 1.8)
    }

    if (focusLayout) {
      tl.to(focusLayout, {
        autoAlpha: 1,
        duration: DURATION.cinematic,
        ease: 'ease-lock-on',
      }, cycleStart + 2.0)
    }

    // Update phase state
    tl.call(() => {
      phase = 'focus'
      activeIndex = filmIndex
    }, [], cycleStart + 2.0)

    // ========================================================================
    // PHASE 4: Content slab enters (2.6s into cycle)
    // ========================================================================
    if (contentSlab) {
      tl.to(contentSlab, {
        autoAlpha: 1,
        x: 0,
        duration: DURATION.standard,
        ease: 'ease-lock-on',
      }, cycleStart + 2.6)
    }

    // ========================================================================
    // PHASE 5: Content slab exits (5.6s into cycle)
    // ========================================================================
    if (contentSlab) {
      tl.to(contentSlab, {
        autoAlpha: 0,
        x: 40,
        duration: DURATION.standard,
        ease: 'ease-release',
      }, cycleStart + 5.6)
    }

    // ========================================================================
    // PHASE 6: Layout reset - shrink back (6.0s into cycle)
    // ========================================================================
    if (focusLayout) {
      tl.to(focusLayout, {
        autoAlpha: 0,
        duration: DURATION.cinematic,
        ease: 'ease-release',
      }, cycleStart + 6.0)
    }

    if (overviewGrid) {
      tl.to(overviewGrid, {
        autoAlpha: 1,
        duration: DURATION.cinematic,
        ease: 'ease-lock-on',
      }, cycleStart + 6.3)
    }

    tl.call(() => {
      phase = 'overview'
    }, [], cycleStart + 6.3)

    // ========================================================================
    // PHASE 7: Others return (6.5s into cycle)
    // ========================================================================
    otherFrames.forEach(frame => {
      tl.to(frame, {
        scale: 1,
        autoAlpha: 1,
        duration: DURATION.cinematic,
        ease: 'ease-lock-on',
      }, cycleStart + 6.5)
    })

    // ========================================================================
    // PHASE 8: Accent shift to next film (7.2s into cycle)
    // ========================================================================
    // Only if there's a next film
    if (filmIndex < films.length - 1) {
      const nextIndex = filmIndex + 1
      const nextFrame = filmFrames[nextIndex] as HTMLElement
      const nextBorder = nextFrame?.querySelector('[data-bordered-viewport]') as HTMLElement

      // Current border fades to phantom
      if (currentBorder) {
        tl.to(currentBorder, {
          borderColor: '#707977',
          duration: DURATION.micro,
          ease: 'ease-release',
        }, cycleStart + 7.2)
      }

      // Next border becomes accent
      if (nextBorder) {
        tl.to(nextBorder, {
          borderColor: '#f6c605',
          duration: DURATION.micro,
          ease: 'ease-lock-on',
        }, cycleStart + 7.2)
      }

      // Other borders stay phantom
      otherBorders.forEach((border, i) => {
        if (border && i !== nextIndex - (filmIndex < nextIndex ? 1 : 0)) {
          tl.to(border, {
            borderColor: '#707977',
            duration: DURATION.micro,
            ease: 'ease-release',
          }, cycleStart + 7.2)
        }
      })
    }
  })

  return tl
}
```

**Step 2: Connect timeline to ScrollTrigger in onMount**

Replace the onMount content:

```typescript
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

  // Synchronous mobile check to avoid race condition with $effect
  const isMobileNow = typeof window !== 'undefined'
    && window.matchMedia('(max-width: 767px)').matches

  ctx = gsap.context(() => {
    // Initialize states
    const focusLayout = containerEl!.querySelector('[data-focus-layout]')
    const contentSlab = containerEl!.querySelector('[data-content-slab]')

    if (focusLayout) gsap.set(focusLayout, { autoAlpha: 0 })
    if (contentSlab) {
      gsap.set(contentSlab, {
        autoAlpha: 0,
        x: isMobileNow ? 0 : 40,
        y: isMobileNow ? 30 : 0
      })
    }

    // Build and attach timeline (pass mobile state)
    const tl = buildFilmTimeline(containerEl!, isMobileNow)

    ScrollTrigger.create({
      trigger: portalContainer,
      start: `top+=${sectionStart} top`,
      end: `top+=${sectionEnd} top`,
      scrub: 1,
      invalidateOnRefresh: true,  // Recalculates on resize
      animation: tl,
      onUpdate: (self) => {
        // Update activeIndex based on progress
        const progress = self.progress
        const filmIndex = Math.min(Math.floor(progress * films.length), films.length - 1)
        if (filmIndex !== activeIndex && phase === 'overview') {
          activeIndex = filmIndex
        }
      },
    })
  }, containerEl)
})
```

### Verification & Validation

**V5.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors

**V5.2: BorderedViewport Data Attribute Check**

Verify BorderedViewport has the required data attribute:
```javascript
document.querySelectorAll('[data-bordered-viewport]').length === 4
```
- [ ] All 4 film frames have `data-bordered-viewport` attribute
- [ ] Attribute is on the border container element (not the media)

**V5.3: Timeline Duration Check**

Open browser console:
```javascript
// After component mounts, check timeline exists
ScrollTrigger.getAll().length > 0
```
- [ ] At least one ScrollTrigger exists for this section

**V5.4: Film 1 (14 PEAKS) Animation Cycle**

Slowly scroll through the Film section and verify for 14 PEAKS:

| Scroll Position | Expected State |
|-----------------|----------------|
| Start of section | All 4 films visible, all yellow borders |
| ~10% into section | Films 2,3,4 borders fade to gray (#707977) |
| ~15% into section | Films 2,3,4 scale down and fade out |
| ~20% into section | Overview grid fades out, focus layout fades in |
| ~25% into section | ContentSlab slides in from right |
| ~35-55% | ContentSlab visible (reading time) |
| ~60% | ContentSlab slides out |
| ~65% | Focus layout fades out, overview returns |
| ~70% | All 4 films visible again |
| ~75% | Accent border shifts from film 1 to film 2 |

- [ ] Border colors change correctly (accent → phantom)
- [ ] Non-focused films scale down smoothly (to 0.85)
- [ ] Overview grid fades out
- [ ] Focus layout fades in with correct film content
- [ ] ContentSlab animates in (fade + slide from right)
- [ ] ContentSlab shows 14 PEAKS content
- [ ] ContentSlab animates out
- [ ] Overview grid returns
- [ ] All films return to full scale
- [ ] Accent border moves to NO DAYS OFF

**V5.5: Film 2-4 Cycle Verification**

Repeat V5.4 pattern for:
- [ ] NO DAYS OFF (film 2) - correct content displays
- [ ] GRACE (film 3) - correct content displays
- [ ] AFGHANISTAN (film 4) - correct content displays

**V5.6: Reverse Scroll Check**

Scroll backwards through the section:
- [ ] Animations reverse smoothly
- [ ] No visual glitches or jumps
- [ ] States return to previous correctly

**V5.7: Easing Character Check**

Observe animation feel:
- [ ] Enter animations feel "snappy then settle" (ease-lock-on)
- [ ] Exit animations feel "gentle release" (ease-release)
- [ ] No bounce or overshoot (brand physics compliance)

**V5.8: Console Error Check**

- [ ] No JavaScript errors in console during scroll
- [ ] No GSAP warnings about missing elements

**Ready to commit when all V5.x checks pass.**

---

## Task 6: Add Mobile Animation Adjustments

**Files:**
- Modify: `src/experience/sections/FilmOverviewSection.svelte`

**Context:** Mobile animations should slide up instead of just scaling, matching the vertical layout.

**Step 1: Modify buildFilmTimeline to accept isMobile parameter**

Update function signature:

```typescript
function buildFilmTimeline(container: HTMLElement, mobile: boolean): gsap.core.Timeline {
```

**Step 2: Add mobile-specific exit/enter animations**

In PHASE 2 (others exit), replace with:

```typescript
// ========================================================================
// PHASE 2: Others exit (1.2s into cycle)
// ========================================================================
otherFrames.forEach(frame => {
  if (mobile) {
    // Mobile: scale + slide up + fade
    tl.to(frame, {
      scale: 0.9,
      y: -30,
      autoAlpha: 0,
      duration: DURATION.cinematic,
      ease: 'ease-release',
    }, cycleStart + 1.2)
  } else {
    // Desktop: scale + fade
    tl.to(frame, {
      scale: 0.85,
      autoAlpha: 0,
      duration: DURATION.cinematic,
      ease: 'ease-release',
    }, cycleStart + 1.2)
  }
})
```

In PHASE 7 (others return), replace with:

```typescript
// ========================================================================
// PHASE 7: Others return (6.5s into cycle)
// ========================================================================
otherFrames.forEach(frame => {
  if (mobile) {
    tl.to(frame, {
      scale: 1,
      y: 0,
      autoAlpha: 1,
      duration: DURATION.cinematic,
      ease: 'ease-lock-on',
    }, cycleStart + 6.5)
  } else {
    tl.to(frame, {
      scale: 1,
      autoAlpha: 1,
      duration: DURATION.cinematic,
      ease: 'ease-lock-on',
    }, cycleStart + 6.5)
  }
})
```

**Step 3: Update onMount to pass isMobile**

```typescript
const tl = buildFilmTimeline(containerEl!, isMobile)
```

**Step 4: Add mobile content slab animation (slide from bottom)**

In PHASE 4, update:

```typescript
if (contentSlab) {
  tl.to(contentSlab, {
    autoAlpha: 1,
    x: mobile ? 0 : 0,
    y: mobile ? 0 : 0,
    duration: DURATION.standard,
    ease: 'ease-lock-on',
  }, cycleStart + 2.6)
}
```

And update initial state in onMount:

```typescript
if (contentSlab) {
  gsap.set(contentSlab, {
    autoAlpha: 0,
    x: isMobile ? 0 : 40,
    y: isMobile ? 30 : 0,
  })
}
```

### Verification & Validation

**V6.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors

**V6.2: Mobile Viewport Setup**

Use browser DevTools to simulate mobile:
- iPhone 14 Pro (393 x 852)
- Or any viewport < 768px wide

**V6.3: Mobile Exit Animation**

Scroll through Film section on mobile:
- [ ] Non-focused films slide UP (y: -30) as they exit
- [ ] Scale is 0.9 (slightly less than desktop's 0.85)
- [ ] Fade out happens simultaneously

**V6.4: Mobile Enter Animation**

Continue scrolling to return to overview:
- [ ] Films slide back DOWN (y: 0) as they return
- [ ] Scale returns to 1
- [ ] Fade in happens simultaneously

**V6.5: Mobile ContentSlab Animation**

- [ ] ContentSlab slides in from BOTTOM (y: 30 → 0) not right
- [ ] ContentSlab slides out to bottom

**V6.6: Desktop Unchanged**

Switch back to desktop viewport (> 768px):
- [ ] Exit animation is scale only (no y movement)
- [ ] ContentSlab slides from right (x: 40 → 0)

**V6.7: Viewport Resize Handling**

Start on desktop, resize to mobile during animation:
- [ ] No crashes or visual glitches
- [ ] Animation continues (may not be perfect, but shouldn't break)

**Ready to commit when all V6.x checks pass.**

---

## Task 7: Export and Wire Up Component

**Files:**
- Modify: `src/experience/sections/index.ts`
- Modify: `src/routes/+page.svelte`

**Context:** Export the new component and replace FilmSection in the page.

**Step 1: Add export to index.ts**

```typescript
export { default as FilmOverviewSection } from './FilmOverviewSection.svelte'
```

**Step 2: Update +page.svelte imports**

Replace:
```typescript
import {
  HeroShowreelScene,
  FilmSection,
  AboutSection,
  ServicesSection,
  ContactSection
} from '$experience/sections'
```

With:
```typescript
import {
  HeroShowreelScene,
  FilmOverviewSection,
  AboutSection,
  ServicesSection,
  ContactSection
} from '$experience/sections'
```

**Step 3: Update +page.svelte markup**

Replace:
```svelte
<!-- Scene 2: Film -->
<FilmSection />
```

With:
```svelte
<!-- Scene 2: Film Overview -->
<FilmOverviewSection />
```

### Verification & Validation

**V7.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No import resolution errors

**V7.2: Page Load Check**
```bash
npm run dev
```
- [ ] Page loads without errors
- [ ] No console errors on initial load

**V7.3: Site Navigation Flow**

Navigate through entire site:
1. [ ] Hero section loads correctly
2. [ ] Scroll transitions to Film Overview section
3. [ ] Film Overview animations work as expected
4. [ ] Scroll transitions to About section
5. [ ] About section works correctly
6. [ ] Services section works correctly
7. [ ] Contact section works correctly

**V7.4: Portal Transition Check**

- [ ] Portal zoom transition INTO Film Overview works
- [ ] Portal zoom transition OUT OF Film Overview works
- [ ] No visual glitches during portal transitions

**V7.5: Scene Index Verification**

Open DevTools console:
```javascript
document.querySelectorAll('[data-scene]').length
// Should show total scene count (5 or similar)

document.querySelector('[data-scene="film-overview"]') !== null
// Should be true
```
- [ ] Film overview scene is properly registered
- [ ] Correct number of scenes in document

**V7.6: Step Indicator Sync**

During Film Overview section:
- [ ] Step indicator shows 4 steps
- [ ] Active step updates as you scroll through films
- [ ] Step 1 active for 14 PEAKS
- [ ] Step 2 active for NO DAYS OFF
- [ ] etc.

**Ready to commit when all V7.x checks pass.**

---

## Task 8: Polish and Bug Fixes

**Files:**
- Modify: `src/experience/sections/FilmOverviewSection.svelte`

**Context:** Final polish pass - fix any visual issues, ensure proper cleanup, verify all states.

**Step 1: Verify gsap.context cleanup**

Ensure onDestroy properly reverts all animations:

```typescript
onDestroy(() => {
  ctx?.revert()
})
```

**Step 2: Verify invalidateOnRefresh is set**

Confirm ScrollTrigger.create includes (already added in Task 5):

```typescript
ScrollTrigger.create({
  // ... existing config
  invalidateOnRefresh: true,  // Already added - verify present
})
```

### Verification & Validation

**V8.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors

**V8.2: HMR Cleanup Test**

1. Make a small change to FilmOverviewSection.svelte (add a comment)
2. Save the file
3. Observe HMR reload

- [ ] No ghost animations (old animations still running)
- [ ] No console errors about GSAP
- [ ] Section re-initializes correctly

**V8.3: Full Animation Cycle Test (Desktop)**

Complete checklist for desktop:

| Check | Pass |
|-------|------|
| Overview state shows all 4 films | [ ] |
| All 4 films have yellow accent border initially | [ ] |
| Border fade to phantom works | [ ] |
| Non-focused films scale down (0.85) + fade | [ ] |
| Focus layout appears smoothly | [ ] |
| ContentSlab slides in from right | [ ] |
| ContentSlab displays correct film content | [ ] |
| ContentSlab slides out | [ ] |
| Focus layout fades out | [ ] |
| Overview grid returns | [ ] |
| All films return to full scale | [ ] |
| Accent border shifts to next film | [ ] |
| Cycle repeats for all 4 films | [ ] |
| Final film (AFGHANISTAN) completes properly | [ ] |

**V8.4: Full Animation Cycle Test (Mobile)**

Repeat V8.3 on mobile viewport with these differences:

| Check | Pass |
|-------|------|
| Films stacked vertically | [ ] |
| Films slide UP when exiting | [ ] |
| Films slide DOWN when returning | [ ] |
| ContentSlab slides from bottom | [ ] |
| 16:9 aspect ratio on film frames | [ ] |

**V8.5: Resize Handling Test**

1. Start at desktop width
2. Scroll to middle of Film section
3. Resize window to mobile width
4. Continue scrolling

- [ ] No crashes
- [ ] ScrollTrigger recalculates (may need scroll to see changes)

**V8.6: Memory Leak Check**

1. Navigate away from page (if SPA) or refresh
2. Open DevTools > Memory tab
3. Take heap snapshot

- [ ] No orphaned GSAP instances
- [ ] No growing memory on repeated visits

**V8.7: Performance Check**

Open DevTools > Performance tab:
1. Start recording
2. Scroll through Film section
3. Stop recording

- [ ] Frame rate stays above 30fps
- [ ] No major jank or dropped frames
- [ ] Smooth scrubbing

**V8.8: Accessibility Quick Check**

- [ ] Focus layout has pointer-events when visible
- [ ] Videos have muted attribute (autoplay requirement)
- [ ] Images have alt text

**Ready to commit when all V8.x checks pass.**

---

## Task 9: Archive Old FilmSection (Optional)

**Files:**
- Move: `src/experience/sections/FilmSection.svelte` → `src/experience/sections/_archive/FilmSection.svelte`

**Context:** Keep the old component as reference but remove from active codebase.

**Step 1: Create archive directory and move file**

```bash
mkdir -p src/experience/sections/_archive
mv src/experience/sections/FilmSection.svelte src/experience/sections/_archive/
```

**Step 2: Update index.ts to remove old export**

Remove this line from `src/experience/sections/index.ts`:
```typescript
export { default as FilmSection } from './FilmSection.svelte'
```

### Verification & Validation

**V9.1: Build Check**
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No "module not found" errors for FilmSection

**V9.2: No Broken Imports**

```bash
npm run check
```
- [ ] No TypeScript errors about FilmSection imports

**V9.3: Site Still Works**

```bash
npm run dev
```
- [ ] Site loads correctly
- [ ] Film Overview section works
- [ ] No console errors

**V9.4: Archive Verification**

- [ ] `src/experience/sections/_archive/FilmSection.svelte` exists
- [ ] Original FilmSection no longer in main sections folder

**Ready to commit when all V9.x checks pass.**

---

## Summary

| Task | Description | Files | Key Verifications |
|------|-------------|-------|-------------------|
| 1 | Register brand physics easings | `gsap.ts` | V1.3: Console easing test |
| 2 | Create base component | `FilmOverviewSection.svelte` | V2.3: Visual render test |
| 3 | Add overview grid layout | `FilmOverviewSection.svelte` | V3.2-V3.4: Layout checks |
| 4 | Add focus layout structure | `FilmOverviewSection.svelte` | V4.3: Hidden state check |
| 5 | Build scroll-driven timeline | `FilmOverviewSection.svelte` | V5.3-V5.6: Full cycle test |
| 6 | Add mobile adjustments | `FilmOverviewSection.svelte` | V6.3-V6.5: Mobile animations |
| 7 | Export and wire up | `index.ts`, `+page.svelte` | V7.3: Site navigation |
| 8 | Polish and bug fixes | `FilmOverviewSection.svelte` | V8.2-V8.7: Comprehensive test |
| 9 | Archive old component | Move `FilmSection.svelte` | V9.1-V9.3: No broken imports |

**Total tasks:** 9
**Key patterns used:** gsap.context(), autoAlpha, time-based positioning, brand physics tokens, mobile variant merging
**Commit strategy:** User commits manually after verification passes
