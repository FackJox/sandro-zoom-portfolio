/**
 * Responsive System
 *
 * Provides semantic positioning, fluid sizing, and safe zone management
 * for responsive scrollytelling experiences.
 *
 * @module responsive
 */

// ============================================================================
// Regions
// ============================================================================

export {
  // Types
  type RegionCoordinates,
  type GridCell,
  type GridCellName,
  type ParsedSafeZones,
  // Constants
  GRID_CELL_TO_NAME,
  NAME_TO_GRID_CELL,
  // Functions
  parseToPercentage,
  parseSafeZones,
  getGridCellCoordinates,
  getGridCellCenter,
  getRegionCoordinates,
  getRegionCenter,
  isPointInRegion,
  getAllGridCells,
} from './regions'

// ============================================================================
// Presets
// ============================================================================

export {
  // Types
  type PresetCoordinates,
  type PresetDefinition,
  // Constants
  GOLDEN_RATIO,
  GOLDEN_MINOR,
  GOLDEN_MAJOR,
  THIRD,
  TWO_THIRDS,
  FIFTH,
  TWO_FIFTHS,
  THREE_FIFTHS,
  FOUR_FIFTHS,
  // Data
  presets,
  // Functions
  getPresetCoordinates,
  getPresetsByCategory,
  isValidPreset,
  getNearestPreset,
  calculateGoldenPositions,
  calculateThirdPositions,
  calculateFifthPositions,
} from './presets'

// ============================================================================
// Safe Zones
// ============================================================================

export {
  // Types
  type DeviceType,
  type SafeBounds,
  type Point,
  // Constants
  DEFAULT_SAFE_ZONES,
  // Functions
  detectDeviceType,
  experienceToDeviceType,
  getSafeZones,
  getParsedSafeZones,
  calculateSafeBounds,
  applySafeZones,
  removeSafeZones,
  isPointInSafeArea,
  clampToSafeArea,
  generateSafeZoneCSS,
  generateAllSafeZoneCSS,
  getSafeZoneStyles,
} from './safe-zones'

// ============================================================================
// Fluid Sizing
// ============================================================================

export {
  // Types
  type FluidScale,
  type ClampConfig,
  type FluidCSSResult,
  // Constants
  DEFAULT_TYPE_STEPS,
  DEFAULT_SPACE_STEPS,
  SCALE_RATIOS,
  // Functions
  generateFluidScale,
  calculateScaleStep,
  generateTypeScale,
  generateSpaceScale,
  generateTypeCSSVariables,
  generateSpaceCSSVariables,
  generateFluidCSS,
  generateFluidCSSParts,
  getFluidValue,
  createCustomFluid,
  parseClampValue,
  getValueAtViewport,
} from './fluid'

// ============================================================================
// Position Resolution
// ============================================================================

export {
  // Types
  type ResolvedPosition,
  type AnchorPoint,
  type FrameSize,
  // Functions
  resolvePosition,
  getPositionStyles,
  getPositionStyleString,
  resolvedToPercentages,
  createPositionFromPercentages,
  interpolatePositions,
  positionsEqual,
  getAnchorTransform,
} from './position'
