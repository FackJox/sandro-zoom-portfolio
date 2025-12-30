/**
 * Experience Detection
 *
 * Detects device type, capabilities, and user preferences.
 * Provides reactive experience state using Svelte 5 runes.
 *
 * @module core/experience
 */

import type { ExperienceType, Capabilities, ExperiencesConfig } from '../types'

/**
 * Check if we're in a browser environment.
 */
const isBrowser = typeof window !== 'undefined'

// ============================================================================
// Experience Detection
// ============================================================================

/**
 * Default media queries for experience detection.
 */
export const DEFAULT_EXPERIENCE_QUERIES = {
  desktop: '(orientation: landscape), (pointer: fine)',
  mobile: '(orientation: portrait) and (pointer: coarse)',
} as const

/**
 * Detects the current experience type (desktop or mobile).
 *
 * Uses media queries to determine the appropriate experience based on:
 * - Screen orientation (landscape vs portrait)
 * - Pointer type (fine/mouse vs coarse/touch)
 *
 * @param experiences - Optional custom experience configurations
 * @returns Current experience type
 *
 * @example
 * ```ts
 * const experience = detectExperience()
 * // 'desktop' or 'mobile'
 *
 * // With custom queries
 * const experience = detectExperience({
 *   desktop: { match: '(min-width: 1024px)', frame: {...} },
 *   mobile: { match: '(max-width: 1023px)', frame: {...} }
 * })
 * ```
 */
export function detectExperience(experiences?: ExperiencesConfig): ExperienceType {
  if (!isBrowser) {
    // Default to desktop on server
    return 'desktop'
  }

  const desktopQuery = experiences?.desktop?.match ?? DEFAULT_EXPERIENCE_QUERIES.desktop
  const mobileQuery = experiences?.mobile?.match ?? DEFAULT_EXPERIENCE_QUERIES.mobile

  // Check desktop first (typically the default for larger screens)
  if (window.matchMedia(desktopQuery).matches) {
    return 'desktop'
  }

  // Check mobile
  if (window.matchMedia(mobileQuery).matches) {
    return 'mobile'
  }

  // Fallback to desktop
  return 'desktop'
}

// ============================================================================
// Experience State (Svelte 5 Runes)
// ============================================================================

/**
 * Reactive experience state.
 */
export interface ExperienceState {
  /** Current experience type */
  type: ExperienceType
  /** Detected capabilities */
  capabilities: Capabilities
  /** Whether state is initialized */
  isReady: boolean
}

/**
 * Creates a reactive experience state store using Svelte 5 runes.
 * Automatically updates when device conditions change.
 *
 * Must be called within a component context.
 *
 * @param experiences - Optional custom experience configurations
 * @returns Reactive experience state object
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createExperienceState } from 'svelte-scrollytelling'
 *
 *   const experience = createExperienceState()
 *
 *   $effect(() => {
 *     console.log('Experience:', experience.type)
 *     if (experience.capabilities.prefersReducedMotion) {
 *       // Reduce animations
 *     }
 *   })
 * </script>
 * ```
 */
export function createExperienceState(experiences?: ExperiencesConfig): ExperienceState {
  let type = $state<ExperienceType>(detectExperience(experiences))
  let capabilities = $state<Capabilities>(detectCapabilities())
  let isReady = $state(false)

  // Set up media query listeners in browser
  if (isBrowser) {
    const desktopQuery = experiences?.desktop?.match ?? DEFAULT_EXPERIENCE_QUERIES.desktop
    const mobileQuery = experiences?.mobile?.match ?? DEFAULT_EXPERIENCE_QUERIES.mobile
    const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

    const desktopMql = window.matchMedia(desktopQuery)
    const mobileMql = window.matchMedia(mobileQuery)
    const reducedMotionMql = window.matchMedia(reducedMotionQuery)

    /**
     * Update experience type when media queries change.
     */
    function updateExperience(): void {
      type = detectExperience(experiences)
    }

    /**
     * Update capabilities when preferences change.
     */
    function updateCapabilities(): void {
      capabilities = detectCapabilities()
    }

    // Add listeners
    desktopMql.addEventListener('change', updateExperience)
    mobileMql.addEventListener('change', updateExperience)
    reducedMotionMql.addEventListener('change', updateCapabilities)

    // Mark as ready after initial detection
    isReady = true

    // Note: Cleanup should be handled by the calling component via $effect cleanup
    // The returned object includes a destroy method for explicit cleanup if needed
  }

  return {
    get type() {
      return type
    },
    get capabilities() {
      return capabilities
    },
    get isReady() {
      return isReady
    },
  }
}

// ============================================================================
// Capability Detection
// ============================================================================

/**
 * GPU tier detection result.
 */
export type GPUTier = 'high' | 'medium' | 'low'

/**
 * Detects device capabilities including GPU, memory, and preferences.
 *
 * @returns Detected capabilities object
 *
 * @example
 * ```ts
 * const caps = detectCapabilities()
 * if (caps.tier === 'low' || caps.prefersReducedMotion) {
 *   // Use simpler animations
 * }
 * ```
 */
export function detectCapabilities(): Capabilities {
  if (!isBrowser) {
    // Conservative defaults for SSR
    return {
      tier: 'medium',
      prefersReducedMotion: false,
    }
  }

  const gpu = detectGPU()
  const memory = detectMemory()
  const connection = detectConnection()
  const prefersReducedMotion = detectReducedMotion()
  const tier = calculateTier(gpu, memory, connection)

  return {
    tier,
    gpu: gpu ?? undefined,
    memory: memory ?? undefined,
    connection: connection ?? undefined,
    prefersReducedMotion,
  }
}

/**
 * Detects GPU renderer string.
 *
 * @returns GPU renderer string or null if not available
 */
export function detectGPU(): string | null {
  if (!isBrowser) return null

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return null
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) {
      return null
    }

    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
  } catch {
    return null
  }
}

/**
 * Detects device memory in GB.
 *
 * @returns Memory in GB or null if not available
 */
export function detectMemory(): number | null {
  if (!isBrowser) return null

  // @ts-expect-error - deviceMemory is not in all TypeScript DOM definitions
  const memory = navigator.deviceMemory
  return typeof memory === 'number' ? memory : null
}

/**
 * Detects network connection type.
 *
 * @returns Connection type string or null if not available
 */
export function detectConnection(): string | null {
  if (!isBrowser) return null

  // @ts-expect-error - connection is not in all TypeScript DOM definitions
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  return connection?.effectiveType ?? null
}

/**
 * Detects if user prefers reduced motion.
 *
 * @returns True if reduced motion is preferred
 */
export function detectReducedMotion(): boolean {
  if (!isBrowser) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Calculate GPU tier based on renderer string.
 *
 * @param gpu - GPU renderer string
 * @returns GPU tier
 */
function getGPUTier(gpu: string | null): GPUTier {
  if (!gpu) return 'medium'

  const gpuLower = gpu.toLowerCase()

  // High-end GPUs
  const highEndIndicators = [
    'nvidia geforce rtx',
    'nvidia geforce gtx 10',
    'nvidia geforce gtx 16',
    'nvidia geforce gtx 20',
    'nvidia geforce gtx 30',
    'nvidia geforce gtx 40',
    'amd radeon rx 5',
    'amd radeon rx 6',
    'amd radeon rx 7',
    'apple m1',
    'apple m2',
    'apple m3',
    'apple gpu',
    'adreno (tm) 6',
    'adreno (tm) 7',
    'mali-g7',
    'mali-g8',
  ]

  for (const indicator of highEndIndicators) {
    if (gpuLower.includes(indicator)) {
      return 'high'
    }
  }

  // Low-end GPUs
  const lowEndIndicators = [
    'intel hd graphics',
    'intel uhd graphics',
    'mesa',
    'llvmpipe',
    'swiftshader',
    'adreno (tm) 3',
    'adreno (tm) 4',
    'mali-4',
    'mali-t',
    'powervr',
  ]

  for (const indicator of lowEndIndicators) {
    if (gpuLower.includes(indicator)) {
      return 'low'
    }
  }

  return 'medium'
}

/**
 * Calculate overall performance tier.
 *
 * @param gpu - GPU renderer string
 * @param memory - Device memory in GB
 * @param connection - Network connection type
 * @returns Performance tier
 */
function calculateTier(gpu: string | null, memory: number | null, connection: string | null): GPUTier {
  const gpuTier = getGPUTier(gpu)

  // Start with GPU tier as baseline
  let score = gpuTier === 'high' ? 3 : gpuTier === 'medium' ? 2 : 1

  // Adjust based on memory
  if (memory !== null) {
    if (memory >= 8) score += 1
    else if (memory <= 2) score -= 1
  }

  // Adjust based on connection (for loading considerations)
  if (connection === '4g' || connection === 'wifi') {
    // Good connection, no penalty
  } else if (connection === '3g') {
    score -= 0.5
  } else if (connection === '2g' || connection === 'slow-2g') {
    score -= 1
  }

  // Map score to tier
  if (score >= 3) return 'high'
  if (score >= 1.5) return 'medium'
  return 'low'
}

// ============================================================================
// Media Query Utilities
// ============================================================================

/**
 * Creates a media query matcher with reactive state.
 *
 * @param query - Media query string
 * @returns Reactive matches state
 *
 * @example
 * ```ts
 * const isLandscape = createMediaQueryMatcher('(orientation: landscape)')
 *
 * $effect(() => {
 *   console.log('Is landscape:', isLandscape.matches)
 * })
 * ```
 */
export function createMediaQueryMatcher(query: string): { matches: boolean } {
  let matches = $state(isBrowser ? window.matchMedia(query).matches : false)

  if (isBrowser) {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => {
      matches = e.matches
    }
    mql.addEventListener('change', handler)

    // Note: Cleanup should be handled externally
  }

  return {
    get matches() {
      return matches
    },
  }
}

/**
 * Common media query presets.
 */
export const mediaQueries = {
  /** Portrait orientation */
  portrait: '(orientation: portrait)',
  /** Landscape orientation */
  landscape: '(orientation: landscape)',
  /** Touch device (coarse pointer) */
  touch: '(pointer: coarse)',
  /** Mouse device (fine pointer) */
  mouse: '(pointer: fine)',
  /** Hover capable */
  hover: '(hover: hover)',
  /** No hover (touch) */
  noHover: '(hover: none)',
  /** Prefers reduced motion */
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** Prefers dark color scheme */
  darkMode: '(prefers-color-scheme: dark)',
  /** Prefers light color scheme */
  lightMode: '(prefers-color-scheme: light)',
  /** High contrast mode */
  highContrast: '(prefers-contrast: more)',
} as const

/**
 * Check if a media query matches (one-time check).
 *
 * @param query - Media query string
 * @returns True if query matches
 */
export function matchMedia(query: string): boolean {
  if (!isBrowser) return false
  return window.matchMedia(query).matches
}
