/**
 * Hero Section
 *
 * Opening section with dramatic entrance animations.
 */

import type { SectionConfig } from 'svelte-scrollytelling'
import { Title, Paragraph } from '../components'

export const hero: SectionConfig = {
  id: 'hero',

  // Visual layers (back to front)
  layers: [
    {
      id: 'bg',
      src: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80',
      alt: 'Abstract dark background',
      parallax: { speed: 0.6 },
    },
    {
      id: 'mg',
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
      alt: 'Gradient overlay',
      initialOpacity: 0.5,
    },
  ],

  // Content components
  content: [
    {
      id: 'title',
      component: Title,
      props: { text: 'Welcome to the Journey', size: '3xl' },
      position: { preset: 'center' },
      at: 0.5,
    },
    {
      id: 'subtitle',
      component: Paragraph,
      props: {
        text: 'Scroll to discover the story',
        maxWidth: '500px',
      },
      position: { preset: 'center-bottom' },
      at: 1.5,
    },
  ],

  // Time-based animations (in seconds)
  animations: [
    // Background entrance
    { target: 'bg', action: 'fadeIn', duration: 1.5, at: 0 },
    { target: 'bg', action: 'zoom', scale: [1.1, 1], duration: 8, at: 0 },

    // Midground parallax
    { target: 'mg', action: 'fadeIn', duration: 1, at: 0.3 },

    // Title entrance
    { target: 'title', action: 'fadeIn', duration: 0.8, at: 0.5 },
    { target: 'title', action: 'slideIn', direction: 'up', distance: 30, duration: 0.8, at: 0.5 },

    // Subtitle entrance
    { target: 'subtitle', action: 'fadeIn', duration: 0.6, at: 1.5 },
    { target: 'subtitle', action: 'slideIn', direction: 'up', distance: 20, duration: 0.6, at: 1.5 },

    // Exit animations
    { target: 'title', action: 'fadeOut', duration: 0.5, at: 6 },
    { target: 'subtitle', action: 'fadeOut', duration: 0.5, at: 6.2 },
  ],

  // Mobile variant
  mobile: {
    content: [
      {
        id: 'title',
        component: Title,
        props: { text: 'Welcome', size: 'xl' },
        position: { preset: 'center-top' },
        at: 0.5,
      },
    ],
  },
}
