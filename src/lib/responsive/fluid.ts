/**
 * Fluid Sizing System (Utopia-style)
 *
 * Generates fluid typography and spacing scales using CSS clamp().
 * Based on Utopia's fluid type/space methodology.
 *
 * @see https://utopia.fyi/
 */

import type { FluidConfig, FluidScaleConfig } from '../types'

// ============================================================================
// Types
// ============================================================================

/**
 * Generated scale values with CSS clamp() expressions.
 */
export interface FluidScale {
  /** Map of step name to CSS clamp() value */
  values: Map<string, string>
  /** The base (middle) step name */
  baseStep: string
  /** Scale ratio used */
  ratio: number
}

/**
 * Configuration for generating a single clamp() value.
 */
export interface ClampConfig {
  /** Minimum viewport width (px) */
  minViewport: number
  /** Maximum viewport width (px) */
  maxViewport: number
  /** Minimum size (px) */
  minSize: number
  /** Maximum size (px) */
  maxSize: number
}

/**
 * Full CSS generation result.
 */
export interface FluidCSSResult {
  /** Typography scale CSS variables */
  type: string
  /** Spacing scale CSS variables */
  space: string
  /** Combined CSS string */
  combined: string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default typography scale steps.
 */
export const DEFAULT_TYPE_STEPS = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl']

/**
 * Default spacing scale steps.
 */
export const DEFAULT_SPACE_STEPS = ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl']

/**
 * Common scale ratios with names.
 */
export const SCALE_RATIOS = {
  minorSecond: 1.067,
  majorSecond: 1.125,
  minorThird: 1.2,
  majorThird: 1.25,
  perfectFourth: 1.333,
  augmentedFourth: 1.414,
  perfectFifth: 1.5,
  goldenRatio: 1.618,
} as const

// ============================================================================
// Core Calculations
// ============================================================================

/**
 * Generate a CSS clamp() value for fluid sizing.
 *
 * Formula: clamp(minSize, fluidCalc, maxSize)
 * where fluidCalc = minSize + (maxSize - minSize) * ((100vw - minViewport) / (maxViewport - minViewport))
 *
 * Simplified to: clamp(minRem, calc(base + slope * (100vw - minViewport)), maxRem)
 *
 * @param config - Clamp configuration
 * @returns CSS clamp() expression
 */
export function generateFluidScale(config: ClampConfig): string {
  const { minViewport, maxViewport, minSize, maxSize } = config

  // Convert to rem (assuming 16px base)
  const minRem = minSize / 16
  const maxRem = maxSize / 16

  // Calculate the slope (change per viewport unit)
  const slope = (maxSize - minSize) / (maxViewport - minViewport)

  // Calculate the y-intercept (base value at 0vw)
  const yIntercept = minSize - slope * minViewport

  // Convert to rem for the calculation
  const slopeVw = slope * 100 // Convert to per-100vw
  const yInterceptRem = yIntercept / 16

  // Format numbers nicely (trim trailing zeros)
  const formatNum = (n: number, decimals: number = 4): string => {
    return parseFloat(n.toFixed(decimals)).toString()
  }

  // Build the clamp expression
  // clamp(min, yIntercept + slope * 100vw, max)
  const minValue = `${formatNum(minRem, 3)}rem`
  const maxValue = `${formatNum(maxRem, 3)}rem`

  // Preferred value: yInterceptRem + (slopeVw)vw
  const preferredParts: string[] = []

  if (Math.abs(yInterceptRem) > 0.001) {
    preferredParts.push(`${formatNum(yInterceptRem, 4)}rem`)
  }

  if (Math.abs(slopeVw) > 0.001) {
    const sign = slopeVw >= 0 && preferredParts.length > 0 ? '+' : ''
    preferredParts.push(`${sign}${formatNum(slopeVw, 4)}vw`)
  }

  const preferred = preferredParts.join(' ') || '0rem'

  return `clamp(${minValue}, ${preferred}, ${maxValue})`
}

/**
 * Calculate a size at a specific scale step.
 *
 * @param baseSize - Base size (step 0)
 * @param step - Step number (positive = larger, negative = smaller)
 * @param ratio - Scale ratio
 * @returns Size at the step
 */
export function calculateScaleStep(baseSize: number, step: number, ratio: number): number {
  return baseSize * Math.pow(ratio, step)
}

// ============================================================================
// Scale Generation
// ============================================================================

/**
 * Generate a complete typography scale.
 *
 * @param config - Fluid configuration
 * @returns Map of step names to clamp() values
 */
export function generateTypeScale(config: FluidConfig): FluidScale {
  const { minViewport, maxViewport, type } = config
  const { base, scale, steps = DEFAULT_TYPE_STEPS } = type

  const [minBase, maxBase] = base
  const values = new Map<string, string>()

  // Find the middle index (base step)
  const middleIndex = Math.floor(steps.length / 2)
  const baseStep = steps[middleIndex]

  steps.forEach((stepName, index) => {
    // Calculate step offset from middle
    const stepOffset = index - middleIndex

    // Calculate sizes at this step
    const minSize = calculateScaleStep(minBase, stepOffset, scale)
    const maxSize = calculateScaleStep(maxBase, stepOffset, scale)

    const clampValue = generateFluidScale({
      minViewport,
      maxViewport,
      minSize,
      maxSize,
    })

    values.set(stepName, clampValue)
  })

  return { values, baseStep, ratio: scale }
}

/**
 * Generate a complete spacing scale.
 *
 * @param config - Fluid configuration
 * @returns Map of step names to clamp() values
 */
export function generateSpaceScale(config: FluidConfig): FluidScale {
  const { minViewport, maxViewport, space } = config
  const { base, scale, steps = DEFAULT_SPACE_STEPS } = space

  const [minBase, maxBase] = base
  const values = new Map<string, string>()

  // Find the middle index (base step, usually 'm')
  const middleIndex = Math.floor(steps.length / 2)
  const baseStep = steps[middleIndex]

  steps.forEach((stepName, index) => {
    // Calculate step offset from middle
    const stepOffset = index - middleIndex

    // Calculate sizes at this step
    const minSize = calculateScaleStep(minBase, stepOffset, scale)
    const maxSize = calculateScaleStep(maxBase, stepOffset, scale)

    const clampValue = generateFluidScale({
      minViewport,
      maxViewport,
      minSize,
      maxSize,
    })

    values.set(stepName, clampValue)
  })

  return { values, baseStep, ratio: scale }
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate CSS custom properties for typography scale.
 *
 * @param scale - Generated type scale
 * @param prefix - CSS variable prefix (default: 'text')
 * @returns CSS string with custom properties
 */
export function generateTypeCSSVariables(scale: FluidScale, prefix: string = 'text'): string {
  const lines: string[] = []

  scale.values.forEach((value, step) => {
    lines.push(`  --${prefix}-${step}: ${value};`)
  })

  return lines.join('\n')
}

/**
 * Generate CSS custom properties for spacing scale.
 *
 * @param scale - Generated space scale
 * @param prefix - CSS variable prefix (default: 'space')
 * @returns CSS string with custom properties
 */
export function generateSpaceCSSVariables(scale: FluidScale, prefix: string = 'space'): string {
  const lines: string[] = []

  scale.values.forEach((value, step) => {
    lines.push(`  --${prefix}-${step}: ${value};`)
  })

  return lines.join('\n')
}

/**
 * Generate complete CSS with all fluid scales.
 *
 * @param config - Fluid configuration
 * @returns Full CSS string with :root block
 */
export function generateFluidCSS(config: FluidConfig): string {
  const typeScale = generateTypeScale(config)
  const spaceScale = generateSpaceScale(config)

  const typeVars = generateTypeCSSVariables(typeScale)
  const spaceVars = generateSpaceCSSVariables(spaceScale)

  return `:root {
  /* Typography Scale (fluid) */
${typeVars}

  /* Spacing Scale (fluid) */
${spaceVars}
}`
}

/**
 * Generate separate CSS strings for type and space.
 *
 * @param config - Fluid configuration
 * @returns Object with separate CSS strings
 */
export function generateFluidCSSParts(config: FluidConfig): FluidCSSResult {
  const typeScale = generateTypeScale(config)
  const spaceScale = generateSpaceScale(config)

  const type = generateTypeCSSVariables(typeScale)
  const space = generateSpaceCSSVariables(spaceScale)
  const combined = generateFluidCSS(config)

  return { type, space, combined }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a specific fluid value from the config.
 *
 * @param config - Fluid configuration
 * @param type - 'type' or 'space'
 * @param step - Step name (e.g., 'm', 'xl')
 * @returns CSS clamp() value or undefined
 */
export function getFluidValue(config: FluidConfig, type: 'type' | 'space', step: string): string | undefined {
  const scale = type === 'type' ? generateTypeScale(config) : generateSpaceScale(config)
  return scale.values.get(step)
}

/**
 * Create a custom fluid value with arbitrary min/max.
 *
 * @param minSize - Minimum size in pixels
 * @param maxSize - Maximum size in pixels
 * @param config - Fluid config for viewport bounds
 * @returns CSS clamp() value
 */
export function createCustomFluid(minSize: number, maxSize: number, config: FluidConfig): string {
  return generateFluidScale({
    minViewport: config.minViewport,
    maxViewport: config.maxViewport,
    minSize,
    maxSize,
  })
}

/**
 * Parse a CSS clamp() value back to min/max values.
 * Useful for debugging or testing.
 *
 * @param clampValue - CSS clamp() expression
 * @returns Parsed min/max values in rem, or null if parsing fails
 */
export function parseClampValue(clampValue: string): { min: number; max: number } | null {
  const match = clampValue.match(/clamp\(\s*([\d.]+)rem\s*,\s*[^,]+\s*,\s*([\d.]+)rem\s*\)/)
  if (!match) return null

  return {
    min: parseFloat(match[1]),
    max: parseFloat(match[2]),
  }
}

/**
 * Generate a viewport-specific size from a clamp value.
 * Useful for debugging to see what size renders at a specific viewport.
 *
 * @param clampValue - CSS clamp() expression
 * @param viewportWidth - Viewport width in pixels
 * @param config - Fluid config for viewport bounds
 * @returns Size in pixels at the given viewport
 */
export function getValueAtViewport(clampValue: string, viewportWidth: number, config: FluidConfig): number | null {
  const parsed = parseClampValue(clampValue)
  if (!parsed) return null

  const { min, max } = parsed
  const { minViewport, maxViewport } = config

  // Linear interpolation between viewports
  const progress = Math.max(0, Math.min(1, (viewportWidth - minViewport) / (maxViewport - minViewport)))

  // Calculate actual value (in rem)
  const valueRem = min + (max - min) * progress

  // Convert to pixels (assuming 16px base)
  return valueRem * 16
}
