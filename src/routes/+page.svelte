<script lang="ts">
  import { browser } from '$app/environment'
  import { registerGSAP } from '$lib/core/gsap'
  import { PortalContainer } from '$lib/components'

  // Import section components
  import {
    HeroShowreelScene,
    FilmOverviewSection,
    AboutScene,
    ServicesSection,
    ContactSection
  } from '$experience/sections'

  // Register GSAP immediately on client (before any components mount)
  if (browser) {
    registerGSAP()
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
  <!-- Load IBM Plex fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<PortalContainer
  sceneDurations={[16, 36, 8, 8, 8, 16, 16]}
  scrollSpeed={65}
  markers={false}
  debug={true}
>
  <!-- Scene 1: Hero + Showreel (combined with internal fade transition) -->
  <HeroShowreelScene />

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
