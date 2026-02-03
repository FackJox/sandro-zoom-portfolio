/**
 * Scene State Manager
 *
 * Global state manager for multi-scene scroll transitions.
 * Single source of truth for which scene is active and whether
 * a transition is in progress.
 *
 * This prevents:
 * - Multiple transitions firing simultaneously
 * - Out-of-order transitions after scroll jumps
 * - Race conditions between sync and async transitions
 */

// ============================================================================
// Types
// ============================================================================

interface SceneState {
  /** Currently active scene index */
  activeIndex: number
  /** Total number of scenes */
  sceneCount: number
  /** Whether a transition is currently in progress */
  transitioning: boolean
  /** Direction of current transition (if any) */
  transitionDirection: 'forward' | 'backward' | null
}

// ============================================================================
// State
// ============================================================================

let state: SceneState = {
  activeIndex: 0,
  sceneCount: 0,
  transitioning: false,
  transitionDirection: null,
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the scene state manager.
 * Call this once when PortalContainer mounts.
 */
export function initSceneState(sceneCount: number): void {
  state = {
    activeIndex: 0,
    sceneCount,
    transitioning: false,
    transitionDirection: null,
  }
  console.log(`[SceneState] Initialized with ${sceneCount} scenes`)
}

/**
 * Reset the scene state manager.
 * Call this when PortalContainer unmounts.
 */
export function resetSceneState(): void {
  state = {
    activeIndex: 0,
    sceneCount: 0,
    transitioning: false,
    transitionDirection: null,
  }
  console.log(`[SceneState] Reset`)
}

// ============================================================================
// Getters
// ============================================================================

/**
 * Get current scene state (read-only copy).
 */
export function getSceneState(): Readonly<SceneState> {
  return { ...state }
}

/**
 * Get the currently active scene index.
 */
export function getActiveScene(): number {
  return state.activeIndex
}

/**
 * Check if a transition is currently in progress.
 */
export function isTransitioning(): boolean {
  return state.transitioning
}

// ============================================================================
// Guards
// ============================================================================

/**
 * Check if a forward transition from->to is allowed.
 * Returns true if:
 * - No transition is in progress
 * - The "from" scene is currently active
 * - The "to" scene is the next scene
 */
export function canTransitionForward(from: number, to: number): boolean {
  if (state.transitioning) {
    console.log(`[SceneState] Blocked forward ${from}->${to}: transition in progress`)
    return false
  }
  if (state.activeIndex !== from) {
    console.log(`[SceneState] Blocked forward ${from}->${to}: active scene is ${state.activeIndex}`)
    return false
  }
  if (to !== from + 1) {
    console.log(`[SceneState] Blocked forward ${from}->${to}: not adjacent scenes`)
    return false
  }
  return true
}

/**
 * Check if a backward transition from->to is allowed.
 * Returns true if:
 * - No transition is in progress
 * - The "from" scene is currently active
 * - The "to" scene is the previous scene
 */
export function canTransitionBackward(from: number, to: number): boolean {
  if (state.transitioning) {
    console.log(`[SceneState] Blocked backward ${from}->${to}: transition in progress`)
    return false
  }
  if (state.activeIndex !== from) {
    console.log(`[SceneState] Blocked backward ${from}->${to}: active scene is ${state.activeIndex}`)
    return false
  }
  if (to !== from - 1) {
    console.log(`[SceneState] Blocked backward ${from}->${to}: not adjacent scenes`)
    return false
  }
  return true
}

// ============================================================================
// Transition Lifecycle
// ============================================================================

/**
 * Start a transition. Call this before beginning any transition.
 * Returns false if transition cannot start.
 */
export function startTransition(from: number, to: number): boolean {
  const direction = to > from ? 'forward' : 'backward'
  const canStart =
    direction === 'forward'
      ? canTransitionForward(from, to)
      : canTransitionBackward(from, to)

  if (!canStart) return false

  state.transitioning = true
  state.transitionDirection = direction
  console.log(`[SceneState] Started ${direction} transition ${from}->${to}`)
  return true
}

/**
 * Complete a transition. Call this when transition finishes.
 * Updates the active scene index.
 */
export function completeTransition(newActiveIndex: number): void {
  console.log(
    `[SceneState] Completed transition, active scene: ${state.activeIndex} -> ${newActiveIndex}`
  )
  state.activeIndex = newActiveIndex
  state.transitioning = false
  state.transitionDirection = null
}

/**
 * Cancel a transition without changing active scene.
 * Use this if a transition fails or is interrupted.
 */
export function cancelTransition(): void {
  console.log(
    `[SceneState] Cancelled transition, active scene remains: ${state.activeIndex}`
  )
  state.transitioning = false
  state.transitionDirection = null
}

// ============================================================================
// Manual Overrides
// ============================================================================

/**
 * Force set the active scene index.
 * Use sparingly - mainly for initialization or recovery.
 */
export function setActiveScene(index: number): void {
  if (index < 0 || index >= state.sceneCount) {
    console.warn(`[SceneState] Invalid scene index: ${index}`)
    return
  }
  console.log(
    `[SceneState] Force set active scene: ${state.activeIndex} -> ${index}`
  )
  state.activeIndex = index
}
