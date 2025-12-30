/**
 * Example Scrollytelling Configuration
 *
 * Demonstrates all configuration options with sensible defaults.
 */

import type { ScrollytellingConfig } from 'svelte-scrollytelling'

export const config: ScrollytellingConfig = {
  // Total experience duration in seconds
  // Each section's animations are authored relative to this
  totalDuration: 30,

  // Pixels scrolled per second of animation
  // Higher = faster scrolling, lower = more granular control
  scrollSpeed: 65,

  // Experience configurations for different devices
  experiences: {
    desktop: {
      match: '(min-width: 768px)',
      frame: {
        width: 1920,
        height: 1080,
        scaling: 'cover',
        minScale: 0.5,
        maxScale: 1.5,
      },
    },
    mobile: {
      match: '(max-width: 767px)',
      frame: {
        width: 390,
        height: 844,
        scaling: 'cover',
        minScale: 0.8,
        maxScale: 1.2,
      },
    },
  },

  // Fluid typography and spacing (Utopia-style)
  fluid: {
    minViewport: 320,
    maxViewport: 1920,
    type: {
      base: [16, 20],
      scale: 1.25,
      steps: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'],
    },
    space: {
      base: [4, 8],
      scale: 1.5,
      steps: ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
  },

  // Safe zones for different device types
  safeZones: {
    mobile: {
      top: 'env(safe-area-inset-top, 44px)',
      bottom: 'env(safe-area-inset-bottom, 34px)',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)',
    },
    tablet: {
      top: '24px',
      bottom: '24px',
      left: '24px',
      right: '24px',
    },
    desktop: {
      top: '32px',
      bottom: '32px',
      left: '48px',
      right: '48px',
    },
  },

  // Capability detection
  capabilities: {
    detectGPU: true,
    respectReducedMotion: true,
  },

  // HMR settings for development
  hmr: {
    preserveScroll: true,
    preserveSection: true,
    animationReset: 'soft',
  },
}

export default config
