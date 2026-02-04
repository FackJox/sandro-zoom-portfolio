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
  import { gsap } from '$lib/core/gsap'
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

  // Scroll to a specific scene
  function scrollToScene(sceneIndex: number): void {
    if (!portalConfig) return

    const { startTimes, scrollSpeed } = portalConfig
    const targetScroll = startTimes[sceneIndex] * scrollSpeed

    closeMenu()

    setTimeout(() => {
      gsap.to(window, {
        scrollTo: { y: targetScroll, autoKill: false },
        duration: 0.8,
        ease: 'ease-lock-on',
      })
    }, 150)
  }

  function handleItemClick(section: Section): void {
    scrollToScene(section.sceneIndex)
  }

  // Open menu - slide down from top
  function openMenu(): void {
    if (isOpen || !panelEl || !backdropEl) return

    isOpen = true
    updateCurrentSection()

    ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Backdrop fades in
      tl.to(backdropEl, {
        autoAlpha: 1,
        duration: 0.2,
        ease: 'ease-lock-on',
      }, 0)

      // Panel slides down from top
      tl.fromTo(panelEl,
        { y: '-100%', autoAlpha: 1 },
        { y: '0%', duration: 0.35, ease: 'ease-lock-on' },
        0
      )

    }, menuEl)
  }

  // Close menu - slide up
  function closeMenu(): void {
    if (!isOpen || !panelEl || !backdropEl) return

    isOpen = false

    ctx?.revert()
    ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Panel slides up
      tl.to(panelEl, {
        y: '-100%',
        duration: 0.25,
        ease: 'ease-release',
      }, 0)

      // Backdrop fades out
      tl.to(backdropEl, {
        autoAlpha: 0,
        duration: 0.2,
        ease: 'ease-release',
      }, 0.1)

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

    // Initial hidden state
    if (panelEl) gsap.set(panelEl, { y: '-100%', autoAlpha: 1 })
    if (backdropEl) gsap.set(backdropEl, { autoAlpha: 0 })
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
    <div class={itemsContainerStyles}>
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
