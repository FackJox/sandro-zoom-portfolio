# Portal Zoom Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement scroll-scrubbed portal zoom transitions between 6 sections for Sandro's portfolio.

**Architecture:**
- Create a `PortalTransition` component that wraps two scenes and manages the circular mask + scale animations
- Use GSAP timelines with ScrollTrigger scrub to tie animation progress to scroll position
- Each section pair shares a transition zone where the portal zoom plays

**Tech Stack:** SvelteKit 5, GSAP 3.14, ScrollTrigger, CustomEase, PandaCSS

---

## Task 1: Register CustomEase Plugin

**Files:**
- Modify: `src/lib/core/gsap.ts`

**Step 1: Add CustomEase import and registration**

```typescript
// src/lib/core/gsap.ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

let isRegistered = false

export function registerGSAP(): void {
  if (isRegistered) return

  gsap.registerPlugin(
    ScrollTrigger,
    CustomEase,
  )

  // Register portal transition easings
  CustomEase.create('irisMask', 'M0,0 C0.65,0 0.35,1 1,1')
  CustomEase.create('portalScale', 'M0,0 C0.4,0 0.2,1 1,1')
  CustomEase.create('portalIn', 'M0,0 C0,0 0.2,1 1,1')

  isRegistered = true
}

export function isGSAPRegistered(): boolean {
  return isRegistered
}

export { gsap, ScrollTrigger, CustomEase }
```

**Step 2: Run dev server and verify**

```bash
npm run dev
```

**MANUAL CHECK 1:**
- Open browser console
- Navigate to `/example`
- Type: `gsap.parseEase('irisMask')`
- Expected: Should return a function, not `undefined`
- Type: `CustomEase.get('irisMask')`
- Expected: Should return the CustomEase instance

---

## Task 2: Create Portal Transition Primitive

**Files:**
- Create: `src/lib/animation/primitives/portal.ts`
- Modify: `src/lib/animation/primitives/index.ts`

**Step 1: Create the portal transition factory**

```typescript
// src/lib/animation/primitives/portal.ts
/**
 * Portal Zoom Transition
 *
 * Creates the NatGeo-style circular mask transition between scenes.
 * The mask shrinks faster than the scale, creating an "iris closing" effect.
 */

import { gsap } from '../../core/gsap'

// ============================================================================
// Types
// ============================================================================

export interface PortalTransitionConfig {
  /** Duration in seconds (default: 0.8) */
  duration?: number
  /** Anchor point for the mask (default: { x: '50%', y: '45%' }) */
  anchor?: { x: string; y: string }
  /** Text selectors within scenes for staggered animation */
  textSelector?: string
}

export interface PortalTimeline {
  timeline: gsap.core.Timeline
  duration: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<PortalTransitionConfig> = {
  duration: 0.8,
  anchor: { x: '50%', y: '45%' },
  textSelector: '[data-animate="text"]',
}

// ============================================================================
// Portal Transition Factory
// ============================================================================

/**
 * Create a portal zoom transition timeline between two scenes.
 *
 * @param outgoingScene - DOM element or selector for the scene being masked out
 * @param incomingScene - DOM element or selector for the scene being revealed
 * @param config - Transition configuration
 * @returns Timeline object with the portal transition
 *
 * @example
 * ```typescript
 * const { timeline } = createPortalTransition('#scene-1', '#scene-2')
 *
 * ScrollTrigger.create({
 *   trigger: '.transition-zone',
 *   start: 'top top',
 *   end: '+=500',
 *   scrub: true,
 *   animation: timeline,
 * })
 * ```
 */
export function createPortalTransition(
  outgoingScene: gsap.TweenTarget,
  incomingScene: gsap.TweenTarget,
  config: PortalTransitionConfig = {}
): PortalTimeline {
  const { duration, anchor, textSelector } = { ...DEFAULT_CONFIG, ...config }

  const tl = gsap.timeline({ paused: true })

  const anchorPoint = `${anchor.x} ${anchor.y}`
  const clipStart = `circle(150% at ${anchorPoint})`
  const clipEnd = `circle(0% at ${anchorPoint})`

  // DEBUG: Log transition creation
  console.log('[Portal] Creating transition', {
    outgoingScene,
    incomingScene,
    duration,
    anchor: anchorPoint,
  })

  // -------------------------------------------------------------------------
  // Outgoing Scene: Scale (slower easing)
  // -------------------------------------------------------------------------
  tl.to(outgoingScene, {
    scale: 0.3,
    duration,
    ease: 'portalScale',
    onStart: () => console.log('[Portal] Outgoing scale started'),
    onComplete: () => console.log('[Portal] Outgoing scale complete'),
  }, 0)

  // -------------------------------------------------------------------------
  // Outgoing Scene: Mask (faster easing - creates iris effect)
  // -------------------------------------------------------------------------
  tl.to(outgoingScene, {
    clipPath: clipEnd,
    duration,
    ease: 'irisMask',
    onUpdate: function() {
      // Log at 25%, 50%, 75% progress
      const progress = this.progress()
      if (progress > 0.24 && progress < 0.26) {
        console.log('[Portal] Mask at 25%:', this.targets()[0].style.clipPath)
      }
      if (progress > 0.49 && progress < 0.51) {
        console.log('[Portal] Mask at 50%:', this.targets()[0].style.clipPath)
      }
    },
  }, 0)

  // -------------------------------------------------------------------------
  // Outgoing Scene: Final opacity fade (last 200ms)
  // -------------------------------------------------------------------------
  tl.to(outgoingScene, {
    opacity: 0,
    duration: 0.2,
    ease: 'none',
  }, duration - 0.2)

  // -------------------------------------------------------------------------
  // Incoming Scene: Scale settle + opacity
  // -------------------------------------------------------------------------
  tl.fromTo(incomingScene,
    {
      scale: 1.15,
      opacity: 0.85,
    },
    {
      scale: 1,
      opacity: 1,
      duration,
      ease: 'portalIn',
      onStart: () => console.log('[Portal] Incoming scale started'),
      onComplete: () => console.log('[Portal] Incoming scale complete'),
    },
    0
  )

  // -------------------------------------------------------------------------
  // Outgoing Text: Slide out left with stagger
  // -------------------------------------------------------------------------
  const outgoingText = gsap.utils.toArray(`${outgoingScene} ${textSelector}`)
  if (outgoingText.length > 0) {
    console.log('[Portal] Outgoing text elements:', outgoingText.length)
    tl.to(outgoingText, {
      x: -60,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.in',
    }, 0)
  }

  // -------------------------------------------------------------------------
  // Incoming Text: Slide in from right with stagger (delayed)
  // -------------------------------------------------------------------------
  const incomingText = gsap.utils.toArray(`${incomingScene} ${textSelector}`)
  if (incomingText.length > 0) {
    console.log('[Portal] Incoming text elements:', incomingText.length)
    tl.fromTo(incomingText,
      { x: 60, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.1,
        ease: 'power2.out',
      },
      0.25
    )
  }

  return {
    timeline: tl,
    duration,
  }
}

/**
 * Set up initial state for a scene that will be the outgoing scene.
 * Call this on mount to ensure proper starting state.
 */
export function setupOutgoingScene(scene: gsap.TweenTarget, anchor = { x: '50%', y: '45%' }): void {
  const anchorPoint = `${anchor.x} ${anchor.y}`

  gsap.set(scene, {
    clipPath: `circle(150% at ${anchorPoint})`,
    scale: 1,
    opacity: 1,
    transformOrigin: anchorPoint,
  })

  console.log('[Portal] Setup outgoing scene:', scene)
}

/**
 * Set up initial state for a scene that will be the incoming scene.
 * Call this on mount to ensure proper starting state.
 */
export function setupIncomingScene(scene: gsap.TweenTarget, anchor = { x: '50%', y: '45%' }): void {
  const anchorPoint = `${anchor.x} ${anchor.y}`

  gsap.set(scene, {
    scale: 1.15,
    opacity: 0.85,
    transformOrigin: anchorPoint,
  })

  console.log('[Portal] Setup incoming scene:', scene)
}
```

**Step 2: Export from primitives index**

Add to `src/lib/animation/primitives/index.ts`:

```typescript
// Add this export
export * from './portal'
```

**MANUAL CHECK 2:**
- In browser console, verify module loads:
```javascript
import { createPortalTransition } from '/src/lib/animation/primitives/portal.ts'
console.log(typeof createPortalTransition) // Should be 'function'
```

---

## Task 3: Create Scene Component

**Files:**
- Create: `src/lib/components/Scene.svelte`
- Modify: `src/lib/components/index.ts`

**Step 1: Create Scene component for portal transitions**

```svelte
<!-- src/lib/components/Scene.svelte -->
<!--
  Scene.svelte

  A scene container for portal transitions.
  Manages z-index and transform-origin for the portal zoom effect.
-->
<script lang="ts" module>
  export interface SceneProps {
    /** Unique scene identifier */
    id: string
    /** Scene role in transition: 'active', 'outgoing', 'incoming', or 'hidden' */
    role?: 'active' | 'outgoing' | 'incoming' | 'hidden'
    /** Z-index override */
    zIndex?: number
    /** Additional CSS class */
    class?: string
  }
</script>

<script lang="ts">
  import { css } from 'styled-system/css'

  let {
    id,
    role = 'active',
    zIndex,
    class: className = '',
    children
  }: SceneProps & { children: any } = $props()

  // Z-index based on role
  const roleZIndex = $derived(() => {
    if (zIndex !== undefined) return zIndex
    switch (role) {
      case 'outgoing': return 20
      case 'incoming': return 10
      case 'active': return 20
      case 'hidden': return 0
      default: return 10
    }
  })

  // Styles using PandaCSS
  const sceneStyles = $derived(css({
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    zIndex: roleZIndex().toString(),
    // Visibility based on role
    visibility: role === 'hidden' ? 'hidden' : 'visible',
    pointerEvents: role === 'hidden' ? 'none' : 'auto',
  }))

  // DEBUG: Log role changes
  $effect(() => {
    console.log(`[Scene ${id}] Role changed:`, role, 'z-index:', roleZIndex())
  })
</script>

<div
  class="{sceneStyles} {className}"
  data-scene={id}
  data-role={role}
>
  {@render children()}
</div>
```

**Step 2: Export from components index**

Add to `src/lib/components/index.ts`:

```typescript
export { default as Scene } from './Scene.svelte'
export type { SceneProps } from './Scene.svelte'
```

**MANUAL CHECK 3:**
- Create a test in `/example` route temporarily:
```svelte
<Scene id="test" role="outgoing">
  <div>Test content</div>
</Scene>
```
- Inspect element in DevTools
- Verify: `data-scene="test"`, `data-role="outgoing"`, z-index is 20
- Check console for: `[Scene test] Role changed: outgoing z-index: 20`

---

## Task 4: Create PortalContainer Component

**Files:**
- Create: `src/lib/components/PortalContainer.svelte`
- Modify: `src/lib/components/index.ts`

**Step 1: Create PortalContainer that manages scene transitions**

```svelte
<!-- src/lib/components/PortalContainer.svelte -->
<!--
  PortalContainer.svelte

  Manages portal zoom transitions between multiple scenes.
  Handles scroll-linked animation and scene state management.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface PortalScene {
    id: string
    content: Snippet
  }

  export interface PortalContainerProps {
    /** Array of scenes to transition between */
    scenes: PortalScene[]
    /** Total scroll duration in seconds */
    totalDuration: number
    /** Scroll speed in px/s (default: 65) */
    scrollSpeed?: number
    /** Duration of each portal transition in seconds (default: 0.8) */
    transitionDuration?: number
    /** Show debug markers */
    markers?: boolean
  }
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap, ScrollTrigger } from '../core/gsap'
  import { createPortalTransition, setupOutgoingScene, setupIncomingScene } from '../animation/primitives/portal'
  import Scene from './Scene.svelte'
  import { css } from 'styled-system/css'

  let {
    scenes,
    totalDuration,
    scrollSpeed = 65,
    transitionDuration = 0.8,
    markers = false,
  }: PortalContainerProps = $props()

  // ============================================================================
  // State
  // ============================================================================

  let containerEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)
  let currentSceneIndex = $state(0)

  // Scene roles based on current index
  const sceneRoles = $derived(() => {
    return scenes.map((_, i) => {
      if (i < currentSceneIndex) return 'hidden'
      if (i === currentSceneIndex) return 'active'
      if (i === currentSceneIndex + 1) return 'incoming'
      return 'hidden'
    })
  })

  // Calculate scroll distance
  const scrollDistance = $derived(totalDuration * scrollSpeed)

  // Duration per scene (excluding transitions)
  const sceneDuration = $derived(totalDuration / scenes.length)

  // ============================================================================
  // Styles
  // ============================================================================

  const containerStyles = css({
    position: 'relative',
    width: '100%',
    height: '100vh',
  })

  // ============================================================================
  // Animation Setup
  // ============================================================================

  onMount(() => {
    if (!containerEl || scenes.length < 2) return

    // Create GSAP context for cleanup
    ctx = gsap.context(() => {
      // DEBUG: Log setup
      console.log('[PortalContainer] Setting up transitions', {
        sceneCount: scenes.length,
        totalDuration,
        scrollDistance,
        transitionDuration,
      })

      // Get all scene elements
      const sceneElements = containerEl!.querySelectorAll('[data-scene]')
      console.log('[PortalContainer] Found scene elements:', sceneElements.length)

      // Set up initial states
      sceneElements.forEach((el, i) => {
        if (i === 0) {
          // First scene is active
          setupOutgoingScene(el)
        } else {
          // Other scenes are incoming (hidden behind)
          setupIncomingScene(el)
          gsap.set(el, { visibility: 'hidden' })
        }
      })

      // Create transitions between each pair of scenes
      for (let i = 0; i < scenes.length - 1; i++) {
        const outgoing = sceneElements[i]
        const incoming = sceneElements[i + 1]

        if (!outgoing || !incoming) continue

        // Calculate trigger points
        const transitionStart = (i + 1) * sceneDuration - transitionDuration / 2
        const scrollStart = transitionStart * scrollSpeed

        console.log(`[PortalContainer] Transition ${i} -> ${i + 1}`, {
          transitionStart,
          scrollStart,
          scrollEnd: scrollStart + transitionDuration * scrollSpeed,
        })

        // Create the portal transition
        const { timeline } = createPortalTransition(
          outgoing,
          incoming,
          { duration: transitionDuration }
        )

        // Make incoming visible just before transition
        gsap.set(incoming, { visibility: 'visible' })

        // Create ScrollTrigger for this transition
        ScrollTrigger.create({
          trigger: containerEl,
          start: `top+=${scrollStart} top`,
          end: `+=${transitionDuration * scrollSpeed}`,
          scrub: true,
          markers: markers ? { startColor: 'green', endColor: 'red' } : false,
          animation: timeline,
          onEnter: () => {
            console.log(`[PortalContainer] Entering transition ${i} -> ${i + 1}`)
            currentSceneIndex = i
          },
          onLeave: () => {
            console.log(`[PortalContainer] Leaving transition ${i} -> ${i + 1}`)
            currentSceneIndex = i + 1
            // Hide the outgoing scene after transition
            gsap.set(outgoing, { visibility: 'hidden' })
          },
          onEnterBack: () => {
            console.log(`[PortalContainer] Entering back transition ${i + 1} -> ${i}`)
            currentSceneIndex = i + 1
            // Show the outgoing scene when scrolling back
            gsap.set(outgoing, { visibility: 'visible' })
          },
          onLeaveBack: () => {
            console.log(`[PortalContainer] Leaving back transition ${i + 1} -> ${i}`)
            currentSceneIndex = i
          },
        })
      }

    }, containerEl)
  })

  onDestroy(() => {
    ctx?.revert()
  })
</script>

<div
  bind:this={containerEl}
  class={containerStyles}
  data-portal-container
  style="height: {scrollDistance + window.innerHeight}px;"
>
  <div class={css({ position: 'fixed', inset: 0, overflow: 'hidden' })}>
    {#each scenes as scene, i (scene.id)}
      <Scene id={scene.id} role={sceneRoles()[i]}>
        {@render scene.content()}
      </Scene>
    {/each}
  </div>
</div>
```

**Step 2: Export from components index**

Add to `src/lib/components/index.ts`:

```typescript
export { default as PortalContainer } from './PortalContainer.svelte'
export type { PortalContainerProps, PortalScene } from './PortalContainer.svelte'
```

**MANUAL CHECK 4:**
- Add a test route to verify the container works
- Create `src/routes/portal-test/+page.svelte`:

```svelte
<script>
  import { PortalContainer } from '$lib/components'

  const scenes = [
    { id: 'scene-1', content: () => import('./Scene1.svelte') },
    { id: 'scene-2', content: () => import('./Scene2.svelte') },
  ]
</script>

<PortalContainer
  {scenes}
  totalDuration={10}
  markers={true}
/>
```

- Scroll through the page
- Verify in console:
  - `[PortalContainer] Setting up transitions`
  - `[Portal] Creating transition`
  - `[PortalContainer] Entering transition 0 -> 1`
  - `[Portal] Mask at 25%`, `[Portal] Mask at 50%`
- Verify visually:
  - First scene shrinks with circular mask
  - Second scene scales from 1.15 to 1.0
  - Transition is smooth and reversible

---

## Task 5: Create Test Scenes for Verification

**Files:**
- Create: `src/routes/portal-test/+page.svelte`
- Create: `src/routes/portal-test/TestScene.svelte`

**Step 1: Create test scene component**

```svelte
<!-- src/routes/portal-test/TestScene.svelte -->
<script lang="ts">
  import { css } from 'styled-system/css'

  interface Props {
    title: string
    color: string
    number: number
  }

  let { title, color, number }: Props = $props()

  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
  })

  const titleStyles = css({
    fontSize: '4rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1rem',
  })

  const subtitleStyles = css({
    fontSize: '1.5rem',
    color: 'rgba(255,255,255,0.7)',
  })
</script>

<div class={containerStyles} style="background: {color};">
  <h1 class={titleStyles} data-animate="text">{title}</h1>
  <p class={subtitleStyles} data-animate="text">Scene {number}</p>
  <p class={subtitleStyles} data-animate="text">Scroll to transition</p>
</div>
```

**Step 2: Create portal test page**

```svelte
<!-- src/routes/portal-test/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { registerGSAP } from '$lib/core/gsap'
  import PortalContainer from '$lib/components/PortalContainer.svelte'
  import TestScene from './TestScene.svelte'

  // Register GSAP on mount
  onMount(() => {
    registerGSAP()
    console.log('[PortalTest] GSAP registered')
  })

  // Define scenes with snippets
</script>

<svelte:head>
  <title>Portal Transition Test</title>
</svelte:head>

<PortalContainer
  totalDuration={20}
  scrollSpeed={65}
  transitionDuration={0.8}
  markers={true}
>
  {#snippet scenes()}
    <!-- This won't work with snippets like this, need to refactor -->
  {/snippet}
</PortalContainer>
```

**Note:** The PortalContainer needs to be refactored to use children properly. Let me revise Task 4.

---

## Task 4 (Revised): Create PortalContainer with Children

**Files:**
- Create: `src/lib/components/PortalContainer.svelte`

**Step 1: Revised PortalContainer using children**

```svelte
<!-- src/lib/components/PortalContainer.svelte -->
<!--
  PortalContainer.svelte

  Manages portal zoom transitions between Scene children.
-->
<script lang="ts" module>
  export interface PortalContainerProps {
    /** Total scroll duration in seconds */
    totalDuration: number
    /** Scroll speed in px/s (default: 65) */
    scrollSpeed?: number
    /** Duration of each portal transition in seconds (default: 0.8) */
    transitionDuration?: number
    /** Show debug markers */
    markers?: boolean
  }
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { gsap, ScrollTrigger } from '../core/gsap'
  import { createPortalTransition, setupOutgoingScene, setupIncomingScene } from '../animation/primitives/portal'
  import { css } from 'styled-system/css'

  let {
    totalDuration,
    scrollSpeed = 65,
    transitionDuration = 0.8,
    markers = false,
    children,
  }: PortalContainerProps & { children: any } = $props()

  // ============================================================================
  // State
  // ============================================================================

  let containerEl: HTMLElement | null = $state(null)
  let viewportEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = $state(null)

  // Calculate scroll distance
  const scrollDistance = $derived(totalDuration * scrollSpeed)

  // ============================================================================
  // Styles
  // ============================================================================

  const containerStyles = css({
    position: 'relative',
    width: '100%',
  })

  const viewportStyles = css({
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  })

  // ============================================================================
  // Animation Setup
  // ============================================================================

  onMount(() => {
    if (!containerEl || !viewportEl) return

    // Create GSAP context for cleanup
    ctx = gsap.context(() => {
      // Get all scene elements
      const sceneElements = viewportEl!.querySelectorAll('[data-scene]')
      const sceneCount = sceneElements.length

      console.log('[PortalContainer] Setting up', {
        sceneCount,
        totalDuration,
        scrollDistance,
        transitionDuration,
      })

      if (sceneCount < 2) {
        console.warn('[PortalContainer] Need at least 2 scenes for transitions')
        return
      }

      // Duration per scene
      const sceneDuration = totalDuration / sceneCount

      // Set up initial states
      sceneElements.forEach((el, i) => {
        const sceneEl = el as HTMLElement
        if (i === 0) {
          setupOutgoingScene(sceneEl)
          sceneEl.style.zIndex = '20'
        } else {
          setupIncomingScene(sceneEl)
          sceneEl.style.visibility = 'hidden'
          sceneEl.style.zIndex = '10'
        }
      })

      // Create transitions between each pair of scenes
      for (let i = 0; i < sceneCount - 1; i++) {
        const outgoing = sceneElements[i] as HTMLElement
        const incoming = sceneElements[i + 1] as HTMLElement

        // Calculate trigger points
        const transitionStart = (i + 1) * sceneDuration - transitionDuration / 2
        const scrollStart = transitionStart * scrollSpeed

        console.log(`[PortalContainer] Transition ${i} -> ${i + 1}`, {
          transitionStart: transitionStart.toFixed(2) + 's',
          scrollStart: scrollStart.toFixed(0) + 'px',
        })

        // Create the portal transition
        const { timeline } = createPortalTransition(
          outgoing,
          incoming,
          { duration: transitionDuration }
        )

        // Create ScrollTrigger for this transition
        ScrollTrigger.create({
          trigger: containerEl,
          start: `top+=${scrollStart} top`,
          end: `+=${transitionDuration * scrollSpeed}`,
          scrub: true,
          markers: markers,
          animation: timeline,
          onEnter: () => {
            console.log(`[Portal] Enter: ${i} -> ${i + 1}`)
            incoming.style.visibility = 'visible'
          },
          onLeave: () => {
            console.log(`[Portal] Leave: ${i} -> ${i + 1}`)
            outgoing.style.visibility = 'hidden'
            outgoing.style.zIndex = '0'
            incoming.style.zIndex = '20'
          },
          onEnterBack: () => {
            console.log(`[Portal] EnterBack: ${i + 1} -> ${i}`)
            outgoing.style.visibility = 'visible'
            outgoing.style.zIndex = '20'
            incoming.style.zIndex = '10'
          },
          onLeaveBack: () => {
            console.log(`[Portal] LeaveBack: ${i + 1} -> ${i}`)
            incoming.style.visibility = 'hidden'
          },
        })
      }

    }, containerEl)

    // Refresh ScrollTrigger after setup
    ScrollTrigger.refresh()
  })

  onDestroy(() => {
    ctx?.revert()
  })
</script>

<div
  bind:this={containerEl}
  class={containerStyles}
  data-portal-container
  style="min-height: calc({scrollDistance}px + 100vh);"
>
  <div
    bind:this={viewportEl}
    class={viewportStyles}
  >
    {@render children()}
  </div>
</div>
```

---

## Task 5 (Revised): Create Portal Test Page

**Files:**
- Create: `src/routes/portal-test/+page.svelte`

**Step 1: Create portal test page**

```svelte
<!-- src/routes/portal-test/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { registerGSAP } from '$lib/core/gsap'
  import { css } from 'styled-system/css'

  // Import components
  import PortalContainer from '$lib/components/PortalContainer.svelte'

  onMount(() => {
    registerGSAP()
    console.log('[PortalTest] Page mounted, GSAP registered')
  })

  // Scene styles
  const sceneStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
  })

  const titleStyles = css({
    fontSize: '4rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '1rem',
  })

  const subtitleStyles = css({
    fontSize: '1.5rem',
    color: 'rgba(255,255,255,0.7)',
  })
</script>

<svelte:head>
  <title>Portal Transition Test</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #000;
    }
  </style>
</svelte:head>

<PortalContainer
  totalDuration={20}
  scrollSpeed={65}
  transitionDuration={0.8}
  markers={true}
>
  <!-- Scene 1: Hero -->
  <div class={sceneStyles} data-scene="hero" style="background: linear-gradient(135deg, #1a1a2e, #16213e);">
    <h1 class={titleStyles} data-animate="text">HERO</h1>
    <p class={subtitleStyles} data-animate="text">Scene 1 - Scroll to transition</p>
  </div>

  <!-- Scene 2: Film -->
  <div class={sceneStyles} data-scene="film" style="background: linear-gradient(135deg, #0f3460, #16213e);">
    <h1 class={titleStyles} data-animate="text">FILM</h1>
    <p class={subtitleStyles} data-animate="text">Scene 2 - 14 Peaks, K2</p>
  </div>

  <!-- Scene 3: Stories -->
  <div class={sceneStyles} data-scene="stories" style="background: linear-gradient(135deg, #533483, #16213e);">
    <h1 class={titleStyles} data-animate="text">STORIES</h1>
    <p class={subtitleStyles} data-animate="text">Scene 3 - Sasha, Grace</p>
  </div>

  <!-- Scene 4: About -->
  <div class={sceneStyles} data-scene="about" style="background: linear-gradient(135deg, #e94560, #16213e);">
    <h1 class={titleStyles} data-animate="text">ABOUT</h1>
    <p class={subtitleStyles} data-animate="text">Scene 4 - The Person</p>
  </div>
</PortalContainer>
```

**MANUAL CHECK 5:**

Run the dev server and navigate to `/portal-test`:

```bash
npm run dev
# Open http://localhost:5173/portal-test
```

**Visual Verification:**
1. Page loads with Scene 1 (HERO) visible
2. Scroll down slowly
3. At ~25% scroll, transition should begin
4. Verify circular mask shrinking on Scene 1
5. Verify Scene 2 scaling from 1.15 to 1.0
6. Text should slide out left (Scene 1) and in from right (Scene 2)
7. Scroll back up - transition should reverse smoothly

**Console Verification:**
```
[PortalTest] Page mounted, GSAP registered
[PortalContainer] Setting up { sceneCount: 4, totalDuration: 20, ... }
[Portal] Setup outgoing scene: [div]
[Portal] Setup incoming scene: [div]
[Portal] Creating transition { outgoing, incoming, duration: 0.8, ... }
[PortalContainer] Transition 0 -> 1 { transitionStart: "4.60s", scrollStart: "299px" }
...
[Portal] Enter: 0 -> 1
[Portal] Outgoing scale started
[Portal] Mask at 25%: circle(XX% at 50% 45%)
[Portal] Mask at 50%: circle(XX% at 50% 45%)
[Portal] Leave: 0 -> 1
```

**Timing Verification:**
- At scroll progress ~23-27%, mask should be at ~80% radius
- At scroll progress ~48-52%, mask should be at ~50% radius
- At scroll progress ~73-77%, mask should be at ~25% radius

---

## Task 6: Add PandaCSS Tokens for Portal Transitions

**Files:**
- Modify: `panda.config.ts`

**Step 1: Add easing and duration tokens**

```typescript
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ... existing config

  theme: {
    extend: {
      tokens: {
        easings: {
          'portal.scale': { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
          'portal.mask': { value: 'cubic-bezier(0.65, 0, 0.35, 1)' },
          'portal.in': { value: 'cubic-bezier(0, 0, 0.2, 1)' },
          'portal.out': { value: 'cubic-bezier(0.4, 0, 1, 1)' },
          'brand.enter': { value: 'cubic-bezier(0.19, 1, 0.22, 1)' },
        },
        durations: {
          'portal': { value: '800ms' },
          'portal.text': { value: '400ms' },
          'portal.fade': { value: '200ms' },
        },
      },
      semanticTokens: {
        colors: {
          'scene.bg.dark': { value: '#0a0a0a' },
          'scene.bg.darker': { value: '#050505' },
        },
      },
    },
  },
})
```

**Step 2: Regenerate PandaCSS**

```bash
npx panda codegen
```

**MANUAL CHECK 6:**
- Verify tokens are generated in `styled-system/tokens/index.d.ts`
- Use in a component: `token('easings.portal.scale')`

---

## Task 7: Create Section Content Components

**Files:**
- Create: `src/experience/sections/hero.svelte`
- Create: `src/experience/sections/film.svelte`
- (Additional section components as needed)

**Step 1: Create Hero section component**

```svelte
<!-- src/experience/sections/hero.svelte -->
<script lang="ts">
  import { css } from 'styled-system/css'

  const containerStyles = css({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
  })

  const titleStyles = css({
    fontSize: '3rem',
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
  })

  const taglineStyles = css({
    fontSize: '1.25rem',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '1rem',
  })

  const logosStyles = css({
    display: 'flex',
    gap: '2rem',
    marginTop: '3rem',
    opacity: '0.5',
  })
</script>

<div class={containerStyles} data-scene="hero">
  <h1 class={titleStyles} data-animate="text">sandrogh</h1>
  <p class={taglineStyles} data-animate="text">HIGH ALTITUDE & HOSTILE ENVIRONMENT</p>
  <div class={logosStyles} data-animate="text">
    <span>Netflix</span>
    <span>BBC</span>
    <span>Red Bull</span>
  </div>
</div>
```

This task can be expanded for each section as needed.

---

## Summary: Manual Verification Checklist

| Check | Location | What to Verify |
|-------|----------|----------------|
| CHECK 1 | Console | `gsap.parseEase('irisMask')` returns function |
| CHECK 2 | Console | `createPortalTransition` is a function |
| CHECK 3 | DevTools | Scene element has correct data attributes and z-index |
| CHECK 4 | Console | `[PortalContainer] Setting up...` logs appear |
| CHECK 5 | Visual | Portal transition plays on scroll, reverses on scroll back |
| CHECK 6 | Code | PandaCSS tokens generated in styled-system |

---

**Plan complete and saved to `docs/plans/2025-12-30-portal-zoom-implementation.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
