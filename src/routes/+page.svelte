<script lang="ts">
  import { browser } from '$app/environment'
  import { registerGSAP } from '$lib/core/gsap'
  import { PortalContainer } from '$lib/components'

  // Import section components
  import {
    HeroSection,
    FilmSection,
    StoriesSection,
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

  <!-- Scene 2: Film -->
  <FilmSection />

  <!-- Scene 3: Stories -->
  <StoriesSection />

  <!-- Scene 4: About -->
  <AboutSection />

  <!-- Scene 5: Services -->
  <ServicesSection />

  <!-- Scene 6: Contact -->
  <ContactSection />
</PortalContainer>
