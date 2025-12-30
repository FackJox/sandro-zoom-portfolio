/**
 * Outro Section
 *
 * Closing section with elegant exit animations.
 */

import type { SectionConfig } from 'svelte-scrollytelling'
import { Title, Paragraph, ProgressIndicator } from '../components'

export const outro: SectionConfig = {
  id: 'outro',

  layers: [
    {
      id: 'bg',
      src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
      alt: 'Mountain landscape at night',
      parallax: { speed: 0.4 },
    },
    {
      id: 'fg-gradient',
      src: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1920&q=80',
      alt: 'Atmospheric gradient overlay',
      initialOpacity: 0,
      z: 80,
    },
  ],

  content: [
    {
      id: 'farewell',
      component: Title,
      props: { text: 'The End', size: '3xl' },
      position: { preset: 'center' },
      at: 1,
    },
    {
      id: 'thanks',
      component: Paragraph,
      props: {
        text: 'Thank you for exploring with us.',
        maxWidth: '400px',
      },
      position: { preset: 'center-bottom' },
      at: 2,
    },
    {
      id: 'progress',
      component: ProgressIndicator,
      props: {},
      position: { x: '0', y: '100%', anchor: 'bottom-left' },
      at: 0,
      injectScrollState: true,
    },
  ],

  animations: [
    // Background zoom out effect
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },
    { target: 'bg', action: 'zoom', scale: [1, 1.1], duration: 10, at: 0 },

    // Foreground gradient fade in
    { target: 'fg-gradient', action: 'fadeIn', duration: 2, at: 2 },

    // Title with bounce effect
    { target: 'farewell', action: 'fadeIn', duration: 0.8, at: 1 },
    {
      target: 'farewell',
      action: 'gsap',
      at: 1,
      gsap: {
        scale: 1,
        duration: 1,
        ease: 'elastic.out(1, 0.4)',
        startAt: { scale: 0.5 },
      },
    },

    // Thanks paragraph
    { target: 'thanks', action: 'fadeIn', duration: 0.6, at: 2 },
    { target: 'thanks', action: 'slideIn', direction: 'up', distance: 20, duration: 0.6, at: 2 },

    // Final fade to black (all elements fade out)
    { target: 'farewell', action: 'fadeOut', duration: 1, at: 8 },
    { target: 'thanks', action: 'fadeOut', duration: 1, at: 8 },
    { target: 'bg', action: 'fadeOut', duration: 2, at: 8.5 },
  ],
}
