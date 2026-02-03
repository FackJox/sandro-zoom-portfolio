import type { ScrollytellingConfig } from 'svelte-scrollytelling'

/**
 * svelte-scrollytelling Configuration
 *
 * This is the root configuration for your scrollytelling experience.
 * All timing is in seconds, all sizing follows the fluid scale.
 */
const config: ScrollytellingConfig = {
  /**
   * Total duration of the experience in seconds.
   * This defines how long the entire scroll journey takes at the perfect pace.
   */
  totalDuration: 60,

  /**
   * Scroll speed in pixels per second.
   * Research suggests 50-80px/s is comfortable for reading.
   * Default: 65px/s
   */
  scrollSpeed: 65,

  /**
   * Experience configurations for different devices/orientations.
   * The system detects which experience to use based on media queries.
   */
  experiences: {
    desktop: {
      match: '(orientation: landscape), (pointer: fine)',
      frame: {
        width: 1920,
        height: 1080,
        scaling: 'cover',
      },
    },
    mobile: {
      match: '(orientation: portrait) and (pointer: coarse)',
      frame: {
        width: 390,
        height: 844,
        scaling: 'contain',
      },
    },
  },

  /**
   * Fluid sizing configuration (Utopia-style).
   * Generates CSS custom properties for responsive typography and spacing.
   */
  fluid: {
    minViewport: 320,
    maxViewport: 1920,
    type: {
      base: [16, 20],
      scale: 1.25,
      steps: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl'],
    },
    space: {
      base: [8, 12],
      scale: 1.5,
      steps: ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl'],
    },
  },

  /**
   * Safe zones for different device types.
   * These insets keep content away from edges, notches, and system UI.
   */
  safeZones: {
    mobile: {
      top: 'env(safe-area-inset-top, 44px)',
      bottom: 'env(safe-area-inset-bottom, 34px)',
      left: '16px',
      right: '16px',
    },
    tablet: {
      top: '24px',
      bottom: '24px',
      left: '32px',
      right: '32px',
    },
    desktop: {
      top: '48px',
      bottom: '48px',
      left: '64px',
      right: '64px',
    },
  },

  /**
   * Capability detection and performance settings.
   */
  capabilities: {
    detectGPU: true,
    respectReducedMotion: true,
  },

  /**
   * Hot Module Replacement settings (dev only).
   */
  hmr: {
    preserveScroll: true,
    preserveSection: true,
    animationReset: 'soft',
  },
}

export default config
