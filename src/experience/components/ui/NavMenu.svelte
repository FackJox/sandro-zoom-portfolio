<!--
  NavMenu.svelte

  Brutalist navigation menu - solid Egg Toast slab that slides down from top.
  No fancy effects, just bold graphic design.

  Design: Alpine Noir Brutalist
  - Solid yellow slab slides down from top
  - Black block text on yellow
  - Current section: yellow text, no background (inverted)
  From: docs/plans/2025-02-04-nav-menu-design.md
-->
<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import { browser } from '$app/environment'
  import { css } from '$styled/css'
  import { gsap, ScrollTrigger } from '$lib/core/gsap'
  import NavMenuButton from './NavMenuButton.svelte'
  import NavMenuItem from './NavMenuItem.svelte'
  import { PORTAL_CONTEXT_KEY, type PortalSceneConfig } from '$lib/components/PortalContainer.svelte'

  interface Section {
    id: string
    label: string
    sceneIndex: number
  }

  interface Props {
    sections: Section[]
  }

  let { sections }: Props = $props()

  // Get portal config for scroll calculations
  const portalConfig = getContext<PortalSceneConfig>(PORTAL_CONTEXT_KEY)

  // State
  let isOpen = $state(false)
  let currentSectionIndex = $state(0)
  let menuEl: HTMLElement | null = $state(null)
  let panelEl: HTMLElement | null = $state(null)
  let backdropEl: HTMLElement | null = $state(null)
  let itemsContainerEl: HTMLElement | null = $state(null)
  let ctx: gsap.Context | null = null

  // Calculate current section from scroll position
  function updateCurrentSection(): void {
    if (!portalConfig) return

    const scrollY = window.scrollY
    const { startTimes, scrollSpeed } = portalConfig

    for (let i = startTimes.length - 1; i >= 0; i--) {
      const sceneStart = startTimes[i] * scrollSpeed
      if (scrollY >= sceneStart - 100) {
        const section = sections.find((s) => {
          if (s.id === 'about') {
            return i >= 2 && i <= 4
          }
          return s.sceneIndex === i
        })
        if (section) {
          currentSectionIndex = sections.indexOf(section)
        }
        break
      }
    }
  }

  // Scroll to a specific scene - lands AFTER transition completes
  // Uses instant scroll to avoid conflicts with scrubbed ScrollTriggers
  function scrollToScene(sceneIndex: number): void {
    if (!portalConfig) return

    const { startTimes, durations, scrollSpeed } = portalConfig
    const sceneDuration = durations[sceneIndex] || 1

    // Add 10% of scene duration to skip past the portal transition buffer
    // This ensures we land when the scene is fully visible, not mid-transition
    const TRANSITION_BUFFER = 0.10
    const bufferOffset = sceneDuration * TRANSITION_BUFFER * scrollSpeed
    const targetScroll = (startTimes[sceneIndex] * scrollSpeed) + bufferOffset

    closeMenu()

    setTimeout(() => {
      // Scroll instantly - scrubbed ScrollTriggers will animate to match
      // This avoids conflicts between scroll animation and scrub animation
      window.scrollTo({ top: targetScroll, behavior: 'instant' })
    }, 150)
  }

  function handleItemClick(section: Section): void {
    scrollToScene(section.sceneIndex)
  }

  // Open menu - stagger items from alternating left/right
  function openMenu(): void {
    if (isOpen || !panelEl || !backdropEl || !itemsContainerEl) return

    isOpen = true
    updateCurrentSection()

    const items = itemsContainerEl.querySelectorAll('.nav-item')

    ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Backdrop fades in
      tl.to(backdropEl, {
        autoAlpha: 1,
        duration: 0.2,
        ease: 'ease-lock-on',
      }, 0)

      // Show panel immediately (it's transparent anyway)
      tl.set(panelEl, { autoAlpha: 1 }, 0)

      // Stagger items from alternating directions
      items.forEach((item, i) => {
        const fromLeft = i % 2 === 0 // 0, 2, 4 from left; 1, 3 from right
        const xStart = fromLeft ? -120 : 120

        tl.fromTo(item,
          { x: xStart, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.3, ease: 'ease-lock-on' },
          0.05 + (i * 0.06) // Stagger
        )
      })

    }, menuEl)
  }

  // Close menu - items slide out to alternating directions
  function closeMenu(): void {
    if (!isOpen || !panelEl || !backdropEl || !itemsContainerEl) return

    isOpen = false

    const items = itemsContainerEl.querySelectorAll('.nav-item')

    ctx?.revert()
    ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Items slide out (reverse order, back to original directions)
      const itemsArray = Array.from(items).reverse()
      itemsArray.forEach((item, i) => {
        const originalIndex = items.length - 1 - i
        const toLeft = originalIndex % 2 === 0
        const xEnd = toLeft ? -120 : 120

        tl.to(item,
          { x: xEnd, autoAlpha: 0, duration: 0.2, ease: 'ease-release' },
          i * 0.04
        )
      })

      // Backdrop fades out
      tl.to(backdropEl, {
        autoAlpha: 0,
        duration: 0.2,
        ease: 'ease-release',
      }, 0.1)

      // Hide panel at end
      tl.set(panelEl, { autoAlpha: 0 })

    }, menuEl)
  }

  function toggleMenu(): void {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && isOpen) {
      closeMenu()
    }
  }

  function handleBackdropClick(): void {
    if (isOpen) {
      closeMenu()
    }
  }

  // Auto-close on scroll
  let lastScrollY = 0
  function handleScroll(): void {
    if (!isOpen) {
      lastScrollY = window.scrollY
      return
    }

    const delta = Math.abs(window.scrollY - lastScrollY)
    if (delta > 10) {
      closeMenu()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('scroll', handleScroll, { passive: true })
    lastScrollY = window.scrollY

    // Initial hidden state - panel hidden, items will animate in
    if (panelEl) gsap.set(panelEl, { autoAlpha: 0 })
    if (backdropEl) gsap.set(backdropEl, { autoAlpha: 0 })

    // Hide all items initially
    if (itemsContainerEl) {
      const items = itemsContainerEl.querySelectorAll('.nav-item')
      gsap.set(items, { autoAlpha: 0 })
    }
  })

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('scroll', handleScroll)
    }
    ctx?.revert()
  })

  // Styles
  const containerStyles = css({
    position: 'relative',
    zIndex: '1000',
  })

  const backdropStyles = css({
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(15, 23, 26, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: '999',
    cursor: 'pointer',
  })

  const panelStyles = css({
    position: 'fixed',
    top: '0',
    right: '0',
    zIndex: '1005',

    // NO background - fully transparent panel
    backgroundColor: 'transparent',

    // Size
    width: '320px',
    maxWidth: '85vw',

    // No padding - items go edge to edge
    padding: '0',
    paddingTop: '80px', // Space for the hamburger button area

    // Mobile
    '@media (max-width: 767px)': {
      width: '100vw',
      maxWidth: '100vw',
      paddingTop: '72px',
    },
  })

  const itemsContainerStyles = css({
    display: 'block',
  })
</script>

<div class={containerStyles} bind:this={menuEl}>
  <!-- Backdrop -->
  <div
    class={backdropStyles}
    bind:this={backdropEl}
    onclick={handleBackdropClick}
    role="presentation"
  ></div>

  <!-- Toggle Button -->
  <NavMenuButton {isOpen} onClick={toggleMenu} />

  <!-- Menu Panel - slides from top -->
  <nav
    class={panelStyles}
    bind:this={panelEl}
    role="navigation"
    aria-label="Section navigation"
  >
    <div class={itemsContainerStyles} bind:this={itemsContainerEl}>
      {#each sections as section, i}
        <NavMenuItem
          label={section.label}
          isCurrent={i === currentSectionIndex}
          onClick={() => handleItemClick(section)}
        />
      {/each}
    </div>
  </nav>
</div>
