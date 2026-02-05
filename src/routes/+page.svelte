<script lang="ts">
  import { browser } from '$app/environment'
  import { registerGSAP } from '$lib/core/gsap'
  import { PortalContainer } from '$lib/components'
  import { NavMenu } from '$experience/components/ui'

  // Import section components
  import {
    HeroShowreelScene,
    FilmOverviewSection,
    AboutScene,
    ServicesSection,
    ContactSection
  } from '$experience/sections'

  // Navigation sections config
  const navSections = [
    { id: 'showreel', label: 'SHOWREEL', sceneIndex: 0 },
    { id: 'film', label: 'FILM', sceneIndex: 1 },
    { id: 'about', label: 'ABOUT', sceneIndex: 2 },
    { id: 'services', label: 'SERVICES', sceneIndex: 5 },
    { id: 'contact', label: 'CONTACT', sceneIndex: 6 },
  ]

  // Register GSAP immediately on client (before any components mount)
  if (browser) {
    registerGSAP()
  }

  // Loading state management
  let isLoading = $state(true)
  let entranceReady = $state(false)
  const loadStartTime = Date.now()

  function handleVideoReady() {
    // Ensure minimum 300ms loader display to prevent jarring instant load on cached video
    const elapsed = Date.now() - loadStartTime
    const minLoadTime = 300
    const delay = Math.max(0, minLoadTime - elapsed)

    // Single timeout for minimum display - both states change together
    // HeroShowreelScene's timeline handles the coordination with loader fade
    setTimeout(() => {
      isLoading = false
      entranceReady = true
    }, delay)
  }

  // About section beat data
  const aboutBeats = [
    {
      id: 'frontline',
      subtitle: 'FRONT-LINE PERSPECTIVE',
      text: "Over the past decade I've documented some of the biggest stories from the world of high altitude mountaineering. I stood on the highest peak in Afghanistan, Mt Noshaq as the first Afghan woman summited and the highest peak in Pakistan, K2 as the first Pakistani woman summited. I filmed Nirmal Purja as he set a blazing speed record on the 14 8,000ers and filmed Kristin Harila as she smashed it.",
      imageSrc: '/pictures/heli rescue (1 of 2).jpg'
    },
    {
      id: 'origin',
      subtitle: 'ORIGIN STORY',
      text: "A winding path brought me to the mountains. After dropping out of uni I spent 3 years in Birmingham filming raves, music videos and weddings. Wanting to see more of the world I joined the British army reserve and soon the commando training combined with my passion for story telling provided opportunities to do just that. I filmed army expeds to Dhaulagiri in 2016 and Everest in 2017, began building a basecamp network and haven't really stopped carrying cameras up mountains since.",
      imageSrc: '/pictures/IMG_1101.JPG'
    },
    {
      id: 'values',
      subtitle: 'VALUES + ONGOING WORK',
      text: "With feeling and fortitude I have the experience to bring human stories from the world's most inhumane corners. I believe deeply in representation and hope the projects I've worked on show people what's possible when you look up and believe. Stories from the mountains and the people in between are slowly being collected on my Youtube channel.",
      imageSrc: '/pictures/push (19 of 22).jpg'
    }
  ]
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
  <!-- Preload critical assets for instant loader display -->
  <link rel="preload" href="/sandro-logo.png" as="image" type="image/png" />
  <link rel="preload" href="/videos/showreel-poster.webp" as="image" type="image/webp" />
  <!-- Load IBM Plex fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<PortalContainer
  sceneDurations={[16, 36, 8, 8, 8, 12, 12]}
  scrollSpeed={65}
  markers={false}
  debug={true}
>
  {#snippet chrome()}
    <div class="nav-chrome" class:visible={!isLoading}>
      <NavMenu sections={navSections} />
    </div>
  {/snippet}

  <!-- Scene 1: Hero + Showreel (combined with internal fade transition) -->
  <HeroShowreelScene onVideoReady={handleVideoReady} {entranceReady} {isLoading} />

  <!-- Scene 2: Film Overview -->
  <FilmOverviewSection />

  <!-- Scenes 3-5: About (3 full-screen beats) -->
  {#each aboutBeats as beat, i}
    <AboutScene
      id={beat.id}
      beatIndex={i}
      totalBeats={aboutBeats.length}
      subtitle={beat.subtitle}
      text={beat.text}
      imageSrc={beat.imageSrc}
    />
  {/each}

  <!-- Scene 6: Services -->
  <ServicesSection />

  <!-- Scene 7: Contact -->
  <ContactSection />
</PortalContainer>

<style>
  .nav-chrome {
    position: absolute;
    top: clamp(24px, 5vh, 48px);
    right: clamp(16px, 5vw, 64px);
    /* Match loader fade-out timing - hidden during loading */
    opacity: 0;
    transition: opacity 550ms cubic-bezier(0.25, 0.0, 0.35, 1.0);
    pointer-events: none;
  }

  .nav-chrome.visible {
    opacity: 1;
    pointer-events: auto;
  }

  @media (max-width: 767px) {
    .nav-chrome {
      top: clamp(16px, 4vh, 32px);
      right: clamp(12px, 4vw, 24px);
    }
  }
</style>
