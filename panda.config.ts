import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx,svelte}"],

  // Files to exclude
  exclude: [],

  // Watch mode outputs CSS here
  emitCss: true,

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        // ============================================================================
        // ALPINE NOIR - Brand Colors
        // From: docs/Brand Design System.md
        // ============================================================================
        colors: {
          // Primary
          'brand.primary': { value: '#0f171a' },        // Black Stallion - base of everything
          'brand.accent': { value: '#f6c605' },         // Egg Toast - danger/highlight color

          // Surfaces
          'brand.surface': { value: '#20292b' },        // Black Pearl - cards, UI elements
          'brand.surfaceAlt': { value: '#464f4c' },     // Cover of Night - subtle layering

          // Text
          'brand.text': { value: '#c0bfb6' },           // Silverplate - primary text
          'brand.textMuted': { value: '#939c9a' },      // Walrus - secondary text

          // Support / Utility
          'brand.phantom': { value: '#707977' },        // Metadata, grids
          'brand.walrus': { value: '#939c9a' },         // Metadata
          'brand.tradewind': { value: '#b7c6cc' },      // Subtle elements

          // Scene backgrounds
          'scene.bg': { value: '#0a0a0a' },
          'scene.bgDark': { value: '#050505' },
        },

        // ============================================================================
        // MOTION TOKENS - Easing
        // From: docs/Brand Physics Archtype.md
        // ============================================================================
        easings: {
          // Brand easings - machine/camera metaphor
          'brand.lockOn': { value: 'cubic-bezier(0.19, 1.0, 0.22, 1.0)' },   // Fast acquisition, smooth settle
          'brand.release': { value: 'cubic-bezier(0.25, 0.0, 0.35, 1.0)' },  // Gentler departure

          // Portal transition easings
          'portal.scale': { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },         // Outgoing scene scale
          'portal.mask': { value: 'cubic-bezier(0.65, 0, 0.35, 1)' },        // Iris mask (faster than scale)
          'portal.in': { value: 'cubic-bezier(0, 0, 0.2, 1)' },              // Incoming scene settle
          'portal.out': { value: 'cubic-bezier(0.4, 0, 1, 1)' },             // Outgoing elements

          // UI standard (from Brand Design System - 220-260ms timing)
          'ui.standard': { value: 'cubic-bezier(0.19, 1, 0.22, 1)' },        // Stabilized camera ease
        },

        // ============================================================================
        // MOTION TOKENS - Durations
        // From: docs/Brand Physics Archtype.md
        // ============================================================================
        durations: {
          // Brand durations - tight tolerances
          'brand.micro': { value: '175ms' },      // 150-200ms range - opacity, focus snap
          'brand.standard': { value: '315ms' },   // 280-350ms range - most UI transitions
          'brand.cinematic': { value: '550ms' },  // 500-600ms range - section changes, portal zooms

          // Portal-specific durations
          'portal.transition': { value: '800ms' },  // Full portal transition
          'portal.text': { value: '400ms' },        // Text slide animations
          'portal.fade': { value: '200ms' },        // Final opacity fade

          // Strip transitions (from Brand Physics Archtype)
          'strip.sweep': { value: '550ms' },        // Scan line wipe
          'strip.blink': { value: '410ms' },        // Shutter blink total
          'strip.crossfade': { value: '265ms' },    // Metadata update
        },

        // ============================================================================
        // SPACING & SIZING
        // From: docs/Brand Design System.md - brutal margins
        // ============================================================================
        spacing: {
          'brand.marginMobile': { value: '32px' },
          'brand.marginDesktop': { value: '96px' },
        },

        // ============================================================================
        // BORDER RADIUS
        // From: docs/Brand Design System.md - "metal and rock, not wellness"
        // ============================================================================
        radii: {
          'brand.none': { value: '0px' },
          'brand.subtle': { value: '2px' },
          'brand.max': { value: '4px' },
        },

        // ============================================================================
        // BORDER WIDTH
        // From: docs/Brand Design System.md - technical schematics
        // ============================================================================
        borderWidths: {
          'brand.keyline': { value: '1.5px' },
        },

        // ============================================================================
        // Z-INDEX SCALE
        // From: docs/plans/2025-12-30-portal-zoom-portfolio-design.md
        // ============================================================================
        zIndex: {
          'layer.back': { value: '0' },
          'layer.incoming': { value: '10' },
          'layer.outgoing': { value: '20' },
          'layer.mid': { value: '50' },
          'layer.front': { value: '100' },
          'ui.persistent': { value: '100' },
        },
      },

      // ============================================================================
      // SEMANTIC TOKENS
      // ============================================================================
      semanticTokens: {
        colors: {
          // Background contexts
          'bg.base': { value: '{colors.brand.primary}' },
          'bg.surface': { value: '{colors.brand.surface}' },
          'bg.elevated': { value: '{colors.brand.surfaceAlt}' },

          // Text contexts
          'text.primary': { value: '{colors.brand.text}' },
          'text.secondary': { value: '{colors.brand.textMuted}' },
          'text.accent': { value: '{colors.brand.accent}' },

          // Interactive states
          'interactive.focus': { value: '{colors.brand.accent}' },
          'interactive.hover': { value: '{colors.brand.accent}' },

          // Portal transition colors
          'portal.mask': { value: '{colors.scene.bgDark}' },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",

  // Emit CSS file for import
  emitTokensOnly: false,

  // Important: Match the import paths used in components
  // Components use $styled/css alias which maps to styled-system/css
  importMap: {
    css: "$styled/css",
    recipes: "$styled/recipes",
    patterns: "$styled/patterns",
    jsx: "$styled/jsx",
  },
});
