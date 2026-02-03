/**
 * Features Section
 *
 * Demonstrates staggered animations and layer groups.
 */

import type { SectionConfig } from 'svelte-scrollytelling'
import { Title, Paragraph } from '../components'

export const features: SectionConfig = {
  id: 'features',

  layers: [
    {
      id: 'bg',
      src: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
      alt: 'Purple gradient background',
      parallax: { speed: 0.5 },
    },
    {
      id: 'feature-1',
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      alt: 'Feature illustration 1',
      initialOpacity: 0,
      position: { anchor: 'left', x: '10%', y: '50%' },
      size: { width: '300px' },
    },
    {
      id: 'feature-2',
      src: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&q=80',
      alt: 'Feature illustration 2',
      initialOpacity: 0,
      position: { anchor: 'center', y: '50%' },
      size: { width: '300px' },
    },
    {
      id: 'feature-3',
      src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80',
      alt: 'Feature illustration 3',
      initialOpacity: 0,
      position: { anchor: 'right', x: '10%', y: '50%' },
      size: { width: '300px' },
    },
  ],

  content: [
    {
      id: 'section-title',
      component: Title,
      props: { text: 'Powerful Features', size: '2xl' },
      position: { preset: 'center-top' },
      at: 0,
    },
    {
      id: 'section-desc',
      component: Paragraph,
      props: {
        text: 'Everything you need to create stunning scrollytelling experiences.',
      },
      position: { preset: 'center', offset: { y: 100 } },
      at: 0.5,
    },
  ],

  animations: [
    // Background
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },

    // Title and description
    { target: 'section-title', action: 'fadeIn', duration: 0.6, at: 0 },
    { target: 'section-title', action: 'slideIn', direction: 'down', distance: 30, duration: 0.6, at: 0 },
    { target: 'section-desc', action: 'fadeIn', duration: 0.5, at: 0.5 },

    // Staggered feature cards
    { target: 'feature-1', action: 'fadeIn', duration: 0.5, at: 1 },
    { target: 'feature-1', action: 'slideIn', direction: 'left', distance: 50, duration: 0.5, at: 1 },

    { target: 'feature-2', action: 'fadeIn', duration: 0.5, at: 1.2 },
    { target: 'feature-2', action: 'slideIn', direction: 'up', distance: 50, duration: 0.5, at: 1.2 },

    { target: 'feature-3', action: 'fadeIn', duration: 0.5, at: 1.4 },
    { target: 'feature-3', action: 'slideIn', direction: 'right', distance: 50, duration: 0.5, at: 1.4 },

    // Scale animation on features
    { target: 'feature-1', action: 'scale', scale: [0.9, 1], duration: 0.5, at: 1 },
    { target: 'feature-2', action: 'scale', scale: [0.9, 1], duration: 0.5, at: 1.2 },
    { target: 'feature-3', action: 'scale', scale: [0.9, 1], duration: 0.5, at: 1.4 },

    // Exit
    { target: 'section-title', action: 'fadeOut', duration: 0.5, at: 7 },
    { target: 'section-desc', action: 'fadeOut', duration: 0.5, at: 7 },
    { target: 'feature-1', action: 'fadeOut', duration: 0.4, at: 7.2 },
    { target: 'feature-2', action: 'fadeOut', duration: 0.4, at: 7.3 },
    { target: 'feature-3', action: 'fadeOut', duration: 0.4, at: 7.4 },
  ],
}
