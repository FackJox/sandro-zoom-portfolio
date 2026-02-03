/**
 * Config Validation
 *
 * TypeScript-powered validation for scrollytelling configurations.
 * Provides helpful error messages during development.
 *
 * @module dev/validation
 */

import type {
  ScrollytellingConfig,
  SectionConfig,
  LayerConfig,
  ContentConfig,
  AnimationConfig,
  Position,
  PositionPreset,
} from '../types'

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationError {
  /** Error severity */
  severity: 'error' | 'warning' | 'info'
  /** Error code for programmatic handling */
  code: string
  /** Human-readable message */
  message: string
  /** Path to the problematic value */
  path: string
  /** Suggestion for fixing the error */
  suggestion?: string
}

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** Array of validation errors/warnings */
  errors: ValidationError[]
  /** Array of warnings */
  warnings: ValidationError[]
}

// ============================================================================
// Valid Presets (for validation)
// ============================================================================

const VALID_PRESETS: Set<PositionPreset> = new Set([
  'golden-left',
  'golden-right',
  'golden-top',
  'golden-bottom',
  'third-left',
  'third-right',
  'third-top',
  'third-bottom',
  'thirds-intersect-tl',
  'thirds-intersect-tr',
  'thirds-intersect-bl',
  'thirds-intersect-br',
  'fifth-1',
  'fifth-2',
  'fifth-3',
  'fifth-4',
  'center',
  'center-left',
  'center-right',
  'center-top',
  'center-bottom',
])

const VALID_ACTIONS: Set<string> = new Set([
  'fadeIn',
  'fadeOut',
  'crossfade',
  'slideIn',
  'slideOut',
  'pan',
  'zoom',
  'scale',
  'parallax',
  'dimension',
  'morph',
  'mask',
  'stagger',
  'followThrough',
  'transform',
  'combined',
  'gsap',
])

// ============================================================================
// Root Config Validation
// ============================================================================

/**
 * Validate the root scrollytelling configuration.
 *
 * @param config - Configuration to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```ts
 * import { validateConfig } from 'svelte-scrollytelling/dev/validation'
 *
 * const result = validateConfig(myConfig)
 * if (!result.valid) {
 *   console.error('Config errors:', result.errors)
 * }
 * ```
 */
export function validateConfig(config: ScrollytellingConfig): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Required fields
  if (typeof config.totalDuration !== 'number' || config.totalDuration <= 0) {
    errors.push({
      severity: 'error',
      code: 'INVALID_DURATION',
      message: 'totalDuration must be a positive number',
      path: 'totalDuration',
      suggestion: 'Set totalDuration to the total length of your experience in seconds (e.g., 60)',
    })
  }

  if (typeof config.scrollSpeed !== 'number' || config.scrollSpeed <= 0) {
    errors.push({
      severity: 'error',
      code: 'INVALID_SCROLL_SPEED',
      message: 'scrollSpeed must be a positive number',
      path: 'scrollSpeed',
      suggestion: 'Set scrollSpeed to pixels per second (recommended: 65)',
    })
  }

  // Validate experiences
  if (!config.experiences) {
    errors.push({
      severity: 'error',
      code: 'MISSING_EXPERIENCES',
      message: 'experiences configuration is required',
      path: 'experiences',
    })
  } else {
    if (!config.experiences.desktop) {
      errors.push({
        severity: 'error',
        code: 'MISSING_DESKTOP_EXPERIENCE',
        message: 'desktop experience configuration is required',
        path: 'experiences.desktop',
      })
    } else {
      validateExperienceConfig(config.experiences.desktop, 'experiences.desktop', errors, warnings)
    }

    if (!config.experiences.mobile) {
      errors.push({
        severity: 'error',
        code: 'MISSING_MOBILE_EXPERIENCE',
        message: 'mobile experience configuration is required',
        path: 'experiences.mobile',
      })
    } else {
      validateExperienceConfig(config.experiences.mobile, 'experiences.mobile', errors, warnings)
    }
  }

  // Validate fluid config
  if (config.fluid) {
    if (config.fluid.minViewport >= config.fluid.maxViewport) {
      errors.push({
        severity: 'error',
        code: 'INVALID_VIEWPORT_RANGE',
        message: 'minViewport must be less than maxViewport',
        path: 'fluid',
        suggestion: 'Use minViewport: 320 and maxViewport: 1920 for standard range',
      })
    }
  }

  // Performance warnings
  if (config.totalDuration > 300) {
    warnings.push({
      severity: 'warning',
      code: 'LONG_DURATION',
      message: 'Very long durations (>5 minutes) may cause performance issues',
      path: 'totalDuration',
      suggestion: 'Consider breaking into multiple pages or reducing duration',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function validateExperienceConfig(
  config: { match: string; frame: { width: number; height: number; scaling: string } },
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!config.match) {
    errors.push({
      severity: 'error',
      code: 'MISSING_MATCH',
      message: 'Media query match string is required',
      path: `${path}.match`,
    })
  }

  if (!config.frame) {
    errors.push({
      severity: 'error',
      code: 'MISSING_FRAME',
      message: 'Frame configuration is required',
      path: `${path}.frame`,
    })
  } else {
    if (config.frame.width <= 0 || config.frame.height <= 0) {
      errors.push({
        severity: 'error',
        code: 'INVALID_FRAME_SIZE',
        message: 'Frame width and height must be positive numbers',
        path: `${path}.frame`,
      })
    }

    if (!['cover', 'contain', 'fill'].includes(config.frame.scaling)) {
      errors.push({
        severity: 'error',
        code: 'INVALID_SCALING',
        message: `Invalid scaling mode: ${config.frame.scaling}`,
        path: `${path}.frame.scaling`,
        suggestion: "Use 'cover', 'contain', or 'fill'",
      })
    }
  }
}

// ============================================================================
// Section Validation
// ============================================================================

/**
 * Validate a section configuration.
 *
 * @param section - Section configuration to validate
 * @returns Validation result
 */
export function validateSection(section: SectionConfig): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Required fields
  if (!section.id || typeof section.id !== 'string') {
    errors.push({
      severity: 'error',
      code: 'INVALID_SECTION_ID',
      message: 'Section must have a string id',
      path: 'id',
    })
  }

  // Validate layers
  if (section.layers) {
    const layerIds = new Set<string>()
    section.layers.forEach((layer, index) => {
      validateLayer(layer, `layers[${index}]`, errors, warnings)

      // Check for duplicate IDs
      if (layerIds.has(layer.id)) {
        errors.push({
          severity: 'error',
          code: 'DUPLICATE_LAYER_ID',
          message: `Duplicate layer id: ${layer.id}`,
          path: `layers[${index}].id`,
        })
      }
      layerIds.add(layer.id)
    })
  }

  // Validate content
  if (section.content) {
    const contentIds = new Set<string>()
    section.content.forEach((item, index) => {
      validateContent(item, `content[${index}]`, errors, warnings)

      // Check for duplicate IDs
      if (contentIds.has(item.id)) {
        errors.push({
          severity: 'error',
          code: 'DUPLICATE_CONTENT_ID',
          message: `Duplicate content id: ${item.id}`,
          path: `content[${index}].id`,
        })
      }
      contentIds.add(item.id)
    })
  }

  // Validate animations
  if (section.animations) {
    const allIds = new Set([
      ...(section.layers?.map((l) => l.id) ?? []),
      ...(section.content?.map((c) => c.id) ?? []),
    ])

    section.animations.forEach((anim, index) => {
      validateAnimation(anim, `animations[${index}]`, allIds, errors, warnings)
    })
  }

  // Performance warnings
  if (section.layers && section.layers.length > 7) {
    warnings.push({
      severity: 'warning',
      code: 'MANY_LAYERS',
      message: `Section has ${section.layers.length} layers. Consider reducing for performance.`,
      path: 'layers',
      suggestion: 'Limit to 5-7 layers per section',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function validateLayer(
  layer: LayerConfig,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!layer.id) {
    errors.push({
      severity: 'error',
      code: 'MISSING_LAYER_ID',
      message: 'Layer must have an id',
      path: `${path}.id`,
    })
  }

  if (layer.type !== 'group' && !layer.src) {
    errors.push({
      severity: 'error',
      code: 'MISSING_LAYER_SRC',
      message: 'Layer must have a src (unless type is group)',
      path: `${path}.src`,
    })
  }

  if (layer.type === 'group' && (!layer.children || layer.children.length === 0)) {
    errors.push({
      severity: 'error',
      code: 'EMPTY_GROUP',
      message: 'Group layer must have children',
      path: `${path}.children`,
    })
  }

  // Accessibility warning
  if (layer.src && !layer.alt) {
    warnings.push({
      severity: 'warning',
      code: 'MISSING_ALT',
      message: 'Layer should have alt text for accessibility',
      path: `${path}.alt`,
    })
  }
}

function validateContent(
  content: ContentConfig,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!content.id) {
    errors.push({
      severity: 'error',
      code: 'MISSING_CONTENT_ID',
      message: 'Content must have an id',
      path: `${path}.id`,
    })
  }

  if (!content.component) {
    errors.push({
      severity: 'error',
      code: 'MISSING_COMPONENT',
      message: 'Content must have a component',
      path: `${path}.component`,
    })
  }

  if (!content.position) {
    errors.push({
      severity: 'error',
      code: 'MISSING_POSITION',
      message: 'Content must have a position',
      path: `${path}.position`,
    })
  } else {
    validatePosition(content.position, `${path}.position`, errors, warnings)
  }

  if (typeof content.at !== 'number') {
    errors.push({
      severity: 'error',
      code: 'MISSING_AT',
      message: 'Content must have an "at" time value',
      path: `${path}.at`,
    })
  }
}

function validatePosition(
  position: Position,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (position.preset && !VALID_PRESETS.has(position.preset)) {
    errors.push({
      severity: 'error',
      code: 'INVALID_PRESET',
      message: `Invalid position preset: ${position.preset}`,
      path: `${path}.preset`,
      suggestion: `Valid presets: ${Array.from(VALID_PRESETS).join(', ')}`,
    })
  }
}

function validateAnimation(
  anim: AnimationConfig,
  path: string,
  validTargets: Set<string>,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!anim.target && anim.action !== 'stagger') {
    errors.push({
      severity: 'error',
      code: 'MISSING_TARGET',
      message: 'Animation must have a target',
      path: `${path}.target`,
    })
  }

  if (anim.target && !validTargets.has(anim.target)) {
    warnings.push({
      severity: 'warning',
      code: 'UNKNOWN_TARGET',
      message: `Animation target "${anim.target}" not found in layers or content`,
      path: `${path}.target`,
      suggestion: 'Ensure the target id matches a layer or content id',
    })
  }

  if (!VALID_ACTIONS.has(anim.action)) {
    errors.push({
      severity: 'error',
      code: 'INVALID_ACTION',
      message: `Invalid animation action: ${anim.action}`,
      path: `${path}.action`,
      suggestion: `Valid actions: ${Array.from(VALID_ACTIONS).join(', ')}`,
    })
  }

  if (anim.at === undefined) {
    errors.push({
      severity: 'error',
      code: 'MISSING_AT',
      message: 'Animation must have an "at" time value',
      path: `${path}.at`,
    })
  }

  // Action-specific validation
  if (anim.action === 'slideIn' || anim.action === 'slideOut') {
    if (anim.direction && !['up', 'down', 'left', 'right'].includes(anim.direction)) {
      errors.push({
        severity: 'error',
        code: 'INVALID_DIRECTION',
        message: `Invalid slide direction: ${anim.direction}`,
        path: `${path}.direction`,
        suggestion: "Use 'up', 'down', 'left', or 'right'",
      })
    }
  }

  if (anim.action === 'stagger' && (!anim.targets || anim.targets.length === 0)) {
    errors.push({
      severity: 'error',
      code: 'MISSING_STAGGER_TARGETS',
      message: 'Stagger animation must have targets array',
      path: `${path}.targets`,
    })
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format validation errors for console output.
 *
 * @param result - Validation result
 * @returns Formatted string
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✅ Configuration is valid'
  }

  const lines: string[] = []

  if (result.errors.length > 0) {
    lines.push(`❌ ${result.errors.length} error(s):`)
    result.errors.forEach((err) => {
      lines.push(`  [${err.code}] ${err.path}: ${err.message}`)
      if (err.suggestion) {
        lines.push(`    💡 ${err.suggestion}`)
      }
    })
  }

  if (result.warnings.length > 0) {
    lines.push(`⚠️  ${result.warnings.length} warning(s):`)
    result.warnings.forEach((warn) => {
      lines.push(`  [${warn.code}] ${warn.path}: ${warn.message}`)
      if (warn.suggestion) {
        lines.push(`    💡 ${warn.suggestion}`)
      }
    })
  }

  return lines.join('\n')
}

/**
 * Validate and log results in development.
 *
 * @param config - Configuration to validate
 */
export function validateAndLog(config: ScrollytellingConfig): void {
  const result = validateConfig(config)
  console.log(formatValidationErrors(result))
}
