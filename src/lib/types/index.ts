/**
 * svelte-scrollytelling Type System
 *
 * Core types for the scrollytelling framework.
 * All types are fully documented with JSDoc for IDE IntelliSense.
 */

import type { Component } from 'svelte'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Root configuration for the scrollytelling experience.
 */
export interface ScrollytellingConfig {
  /** Total duration of the experience in seconds */
  totalDuration: number
  /** Scroll speed in pixels per second (default: 65) */
  scrollSpeed: number
  /** Experience configurations for different devices */
  experiences: ExperiencesConfig
  /** Fluid sizing configuration */
  fluid: FluidConfig
  /** Safe zone insets */
  safeZones: SafeZonesConfig
  /** Capability detection settings */
  capabilities: CapabilitiesConfig
  /** HMR settings (dev only) */
  hmr: HMRConfig
}

/**
 * Experience configurations for desktop and mobile.
 */
export interface ExperiencesConfig {
  desktop: ExperienceConfig
  mobile: ExperienceConfig
}

/**
 * Single experience configuration.
 */
export interface ExperienceConfig {
  /** Media query to match this experience */
  match: string
  /** Frame configuration */
  frame: FrameConfig
}

/**
 * Reference frame configuration.
 */
export interface FrameConfig {
  /** Reference width in pixels */
  width: number
  /** Reference height in pixels */
  height: number
  /** How to scale the frame to fit viewport */
  scaling: 'cover' | 'contain' | 'fill'
  /** Minimum scale factor (default: 0.5) */
  minScale?: number
  /** Maximum scale factor (default: 1.5) */
  maxScale?: number
}

/**
 * Fluid sizing configuration (Utopia-style).
 */
export interface FluidConfig {
  /** Minimum viewport width for scaling */
  minViewport: number
  /** Maximum viewport width for scaling */
  maxViewport: number
  /** Typography scale */
  type: FluidScaleConfig
  /** Spacing scale */
  space: FluidScaleConfig
}

/**
 * Fluid scale configuration.
 */
export interface FluidScaleConfig {
  /** [min, max] base size in pixels */
  base: [number, number]
  /** Scale ratio between steps (e.g., 1.25 = major third) */
  scale: number
  /** Named steps in the scale */
  steps: string[]
}

/**
 * Safe zone configuration per device type.
 */
export interface SafeZonesConfig {
  mobile: SafeZoneInsets
  tablet: SafeZoneInsets
  desktop: SafeZoneInsets
}

/**
 * Safe zone insets.
 */
export interface SafeZoneInsets {
  top: string
  bottom: string
  left: string
  right: string
}

/**
 * Capability detection settings.
 */
export interface CapabilitiesConfig {
  /** Detect GPU tier */
  detectGPU: boolean
  /** Respect prefers-reduced-motion */
  respectReducedMotion: boolean
}

/**
 * HMR configuration.
 */
export interface HMRConfig {
  /** Preserve scroll position on HMR */
  preserveScroll: boolean
  /** Preserve current section on HMR */
  preserveSection: boolean
  /** How to reset animations: 'soft' | 'hard' | 'none' */
  animationReset: 'soft' | 'hard' | 'none'
}

// ============================================================================
// Section Types
// ============================================================================

/**
 * Section configuration.
 */
export interface SectionConfig<
  LayerIDs extends string = string,
  ContentIDs extends string = string
> {
  /** Unique section identifier */
  id: string
  /** Layers in this section */
  layers: LayerConfig<LayerIDs>[]
  /** Content components in this section */
  content: ContentConfig<ContentIDs>[]
  /** Animations for this section */
  animations: AnimationConfig<LayerIDs | ContentIDs>[]
  /** Mobile variant (optional) */
  mobile?: Partial<Omit<SectionConfig<LayerIDs, ContentIDs>, 'id'>>
}

// ============================================================================
// Layer Types
// ============================================================================

/** Standard layer z-index values */
export const LAYER_Z = {
  BG: 0,
  MG: 50,
  FG: 100,
} as const

/**
 * Layer configuration.
 */
export interface LayerConfig<ID extends string = string> {
  /** Unique layer identifier */
  id: ID
  /** Image/video source path */
  src?: string
  /** Layer type: individual or group */
  type?: 'layer' | 'group'
  /** Z-index (default: auto from id or explicit) */
  z?: number
  /** Alternative text for accessibility */
  alt?: string
  /** Position configuration */
  position?: LayerPosition
  /** Size configuration */
  size?: LayerSize
  /** Initial opacity (0-1) */
  initialOpacity?: number
  /** Initial scale */
  initialScale?: number
  /** Parallax configuration (shorthand or full) */
  parallax?: boolean | ParallaxConfig
  /** Children (for groups only) */
  children?: LayerConfig[]
}

/**
 * Layer group configuration.
 */
export interface LayerGroupConfig<ID extends string = string> extends Omit<LayerConfig<ID>, 'src' | 'alt'> {
  type: 'group'
  children: LayerConfig[]
}

/**
 * Layer position configuration.
 */
export interface LayerPosition {
  /** Anchor point */
  anchor?: 'left' | 'right' | 'center' | 'top' | 'bottom'
  /** X offset (CSS value) */
  x?: string
  /** Y offset (CSS value) */
  y?: string
  /** Bottom anchor flag */
  bottom?: boolean
}

/**
 * Layer size configuration.
 */
export interface LayerSize {
  width?: string
  height?: string
}

// ============================================================================
// Content Types
// ============================================================================

/**
 * Content configuration.
 */
export interface ContentConfig<ID extends string = string> {
  /** Unique content identifier */
  id: ID
  /** Svelte component to render */
  component: Component<any>
  /** Props to pass to the component */
  props?: Record<string, any>
  /** Position configuration */
  position: Position
  /** When to mount (seconds from section start) */
  at: number
  /** When to unmount (seconds from section start, optional) */
  until?: number
  /** Inject ScrollState to component */
  injectScrollState?: boolean
}

// ============================================================================
// Position Types
// ============================================================================

/**
 * Position configuration.
 */
export interface Position {
  /** Use a named preset */
  preset?: PositionPreset
  /** Semantic region */
  region?: Region
  /** Vertical alignment within region */
  vAlign?: 'top' | 'center' | 'bottom'
  /** Horizontal alignment within region */
  hAlign?: 'left' | 'center' | 'right'
  /** Explicit X position (CSS value) */
  x?: string
  /** Explicit Y position (CSS value) */
  y?: string
  /** Anchor point for the element */
  anchor?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Pixel offset from calculated position */
  offset?: { x?: number; y?: number }
}

/**
 * Semantic regions based on rule of thirds.
 */
export type Region =
  | 'left-third'
  | 'center'
  | 'right-third'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center-center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/**
 * Named position presets based on design fundamentals.
 */
export type PositionPreset =
  // Golden ratio
  | 'golden-left'
  | 'golden-right'
  | 'golden-top'
  | 'golden-bottom'
  // Rule of thirds
  | 'third-left'
  | 'third-right'
  | 'third-top'
  | 'third-bottom'
  | 'thirds-intersect-tl'
  | 'thirds-intersect-tr'
  | 'thirds-intersect-bl'
  | 'thirds-intersect-br'
  // Rule of fifths
  | 'fifth-1'
  | 'fifth-2'
  | 'fifth-3'
  | 'fifth-4'
  // Center variants
  | 'center'
  | 'center-left'
  | 'center-right'
  | 'center-top'
  | 'center-bottom'

// ============================================================================
// Animation Types
// ============================================================================

/**
 * Animation configuration.
 */
export interface AnimationConfig<TargetID extends string = string> {
  /** Target layer or content ID */
  target: TargetID
  /** Animation action (primitive name) */
  action: AnimationAction
  /** When to start (seconds, or relative like '+=0.2') */
  at: number | string
  /** Duration in seconds */
  duration?: number
  /** Easing function */
  ease?: Ease
  /** Direction for slide animations */
  direction?: 'up' | 'down' | 'left' | 'right'
  /** Distance for slide animations */
  distance?: number
  /** Scale range for zoom/scale animations */
  scale?: [number, number]
  /** Pan offset for zoom/mask animations */
  pan?: { x?: number; y?: number }
  /** Rotation in degrees */
  rotate?: number
  /** Target for crossfade */
  toTarget?: string
  /** Speed for parallax */
  speed?: number
  /** Axis for parallax */
  axis?: 'x' | 'y' | 'both'
  /** Trigger for parallax */
  trigger?: 'scroll' | 'mouse'
  /** Shape for mask */
  shape?: 'rect' | 'circle' | 'path'
  /** Content animation within mask */
  content?: {
    pan?: { x?: number; y?: number }
    scale?: [number, number]
    rotate?: [number, number]
  }
  /** Z position for dimension */
  z?: number
  /** Recede (move away) for dimension */
  recede?: boolean
  /** Approach (move closer) for dimension */
  approach?: boolean
  /** Settle amount for followThrough */
  settle?: number
  /** Wobble amount for followThrough */
  wobble?: number
  /** Targets for stagger */
  targets?: string[]
  /** Animation for each stagger target */
  animation?: Omit<AnimationConfig, 'target' | 'at'>
  /** Delay between stagger targets */
  delay?: number
  /** Overlap ratio for stagger */
  overlap?: number
  /** Stagger direction */
  staggerDirection?: 'forward' | 'reverse' | 'center' | 'edges'
  /** Combined animations */
  animations?: AnimationConfig[]
  /** Raw GSAP config (escape hatch) */
  gsap?: Record<string, any>
}

/**
 * Animation action types (primitive names).
 */
export type AnimationAction =
  // Opacity
  | 'fadeIn'
  | 'fadeOut'
  | 'crossfade'
  // Position
  | 'slideIn'
  | 'slideOut'
  | 'pan'
  // Scale
  | 'zoom'
  | 'scale'
  // Parallax
  | 'parallax'
  // Depth
  | 'dimension'
  // Morph
  | 'morph'
  // Mask
  | 'mask'
  // Sequencing
  | 'stagger'
  // Physics
  | 'followThrough'
  // Transform
  | 'transform'
  // Combined
  | 'combined'
  // GSAP escape hatch
  | 'gsap'

/**
 * Easing function types.
 */
export type Ease =
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'cubic'
  | 'power1.in'
  | 'power1.out'
  | 'power1.inOut'
  | 'power2.in'
  | 'power2.out'
  | 'power2.inOut'
  | 'power3.in'
  | 'power3.out'
  | 'power3.inOut'
  | 'power4.in'
  | 'power4.out'
  | 'power4.inOut'
  | 'elastic.in'
  | 'elastic.out'
  | 'elastic.inOut'
  | 'bounce.in'
  | 'bounce.out'
  | 'bounce.inOut'
  | 'back.in'
  | 'back.out'
  | 'back.inOut'
  | string // Allow any GSAP easing string

/**
 * Parallax configuration.
 */
export interface ParallaxConfig {
  /** Speed multiplier (0.5 = half speed, 1.5 = 1.5x speed) */
  speed: number
  /** Movement axis */
  axis?: 'x' | 'y' | 'both'
  /** What triggers the parallax */
  trigger?: 'scroll' | 'mouse'
}

// ============================================================================
// Scroll State Types
// ============================================================================

/**
 * Scroll state passed to components that opt-in.
 */
export interface ScrollState {
  /** Progress within content's lifespan (0-1) */
  progress: number
  /** Whether content is currently visible */
  isVisible: boolean
  /** Scroll direction */
  direction: 'up' | 'down' | null
  /** Scroll velocity (pixels per second) */
  velocity: number
  /** Progress within parent section (0-1) */
  sectionProgress: number
  /** Progress of entire experience (0-1) */
  globalProgress: number
}

// ============================================================================
// Capability Types
// ============================================================================

/**
 * Detected device capabilities.
 */
export interface Capabilities {
  /** GPU performance tier */
  tier: 'high' | 'medium' | 'low'
  /** GPU renderer string */
  gpu?: string
  /** Device memory in GB */
  memory?: number
  /** Network connection type */
  connection?: string
  /** User prefers reduced motion */
  prefersReducedMotion: boolean
}

/**
 * Current experience type.
 */
export type ExperienceType = 'desktop' | 'mobile'
