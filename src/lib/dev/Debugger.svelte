<!--
  Debugger.svelte

  Visual timeline debugger for scrollytelling experiences.
  Shows progress, current section, running animations, and layer toggles.
-->
<script lang="ts" module>
  export type DebuggerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  export interface DebuggerProps {
    /** Position of the debugger panel */
    position?: DebuggerPosition
    /** Initial collapsed state */
    collapsed?: boolean
    /** Show FPS counter */
    showFps?: boolean
    /** Show layer toggles */
    showLayers?: boolean
    /** Show animation list */
    showAnimations?: boolean
    /** Custom CSS class */
    class?: string
  }
</script>

<script lang="ts">
  import { onMount, getContext } from 'svelte'
  import type { MasterTimeline } from '../core/timeline.svelte'
  import type { ScrollStateStore } from '../core/scroll.svelte'
  import type { ExperienceState } from '../core/experience.svelte'

  let {
    position = 'bottom-right',
    collapsed: initialCollapsed = false,
    showFps = true,
    showLayers = true,
    showAnimations = true,
    class: className = '',
  }: DebuggerProps = $props()

  // ============================================================================
  // Context
  // ============================================================================

  const MASTER_TIMELINE_KEY = Symbol.for('master-timeline')
  const SCROLL_STATE_KEY = Symbol.for('scroll-state')
  const EXPERIENCE_KEY = Symbol.for('experience')

  // Timeline context provides getter functions and reactive progress
  const timelineContext = getContext<{
    getTimeline: () => MasterTimeline | null
    progress: number
    currentTime: number
    totalDuration: number
  } | undefined>(MASTER_TIMELINE_KEY)

  const scrollState = getContext<ScrollStateStore | undefined>(SCROLL_STATE_KEY)
  const experience = getContext<ExperienceState | undefined>(EXPERIENCE_KEY)

  // ============================================================================
  // State
  // ============================================================================

  let isCollapsed = $state(initialCollapsed)
  let fps = $state(0)
  let layerVisibility = $state<Record<string, boolean>>({})
  let isDragging = $state(false)

  // Derived state from context
  const progress = $derived(scrollState?.progress ?? 0)
  const currentTime = $derived(timelineContext?.currentTime ?? 0)
  const totalDuration = $derived(timelineContext?.totalDuration ?? 0)
  const scrollDirection = $derived(scrollState?.direction ?? null)
  const scrollVelocity = $derived(scrollState?.velocity ?? 0)
  const experienceType = $derived(experience?.type ?? 'desktop')

  // Get the actual timeline instance for scrubbing
  const masterTimeline = $derived(timelineContext?.getTimeline())

  // ============================================================================
  // FPS Counter
  // ============================================================================

  let lastTime = performance.now()
  let frameCount = 0

  function updateFps() {
    if (!showFps) return

    frameCount++
    const now = performance.now()

    if (now - lastTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (now - lastTime))
      frameCount = 0
      lastTime = now
    }

    requestAnimationFrame(updateFps)
  }

  // ============================================================================
  // Layer Visibility
  // ============================================================================

  function toggleLayer(layerId: string) {
    const layer = document.querySelector(`[data-layer="${layerId}"]`) as HTMLElement
    if (!layer) return

    const isVisible = layerVisibility[layerId] !== false
    layer.style.visibility = isVisible ? 'hidden' : 'visible'
    layerVisibility[layerId] = !isVisible
  }

  function discoverLayers() {
    const layers = document.querySelectorAll('[data-layer]')
    layers.forEach((layer) => {
      const id = layer.getAttribute('data-layer')
      if (id && !(id in layerVisibility)) {
        layerVisibility[id] = true
      }
    })
  }

  // ============================================================================
  // Timeline Scrubbing
  // ============================================================================

  let scrubberRef: HTMLDivElement | null = $state(null)

  function handleScrubberMouseDown(e: MouseEvent) {
    isDragging = true
    handleScrubberMove(e)
  }

  function handleScrubberMove(e: MouseEvent) {
    if (!isDragging || !scrubberRef) return

    const rect = scrubberRef.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

    if (masterTimeline) {
      masterTimeline.seekToProgress(x)
    }
  }

  function handleScrubberMouseUp() {
    isDragging = false
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  onMount(() => {
    if (showFps) {
      requestAnimationFrame(updateFps)
    }

    if (showLayers) {
      discoverLayers()

      // Re-discover on DOM changes
      const observer = new MutationObserver(() => {
        discoverLayers()
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      return () => observer.disconnect()
    }
  })

  // ============================================================================
  // Styles
  // ============================================================================

  const positionStyles: Record<DebuggerPosition, string> = {
    'top-left': 'top: 16px; left: 16px;',
    'top-right': 'top: 16px; right: 16px;',
    'bottom-left': 'bottom: 16px; left: 16px;',
    'bottom-right': 'bottom: 16px; right: 16px;',
  }
</script>

<svelte:window
  onmousemove={handleScrubberMove}
  onmouseup={handleScrubberMouseUp}
/>

<div
  class="debugger {className}"
  class:collapsed={isCollapsed}
  style={positionStyles[position]}
  data-debugger
>
  <!-- Header -->
  <button
    class="debugger-header"
    onclick={() => isCollapsed = !isCollapsed}
    type="button"
  >
    <span class="debugger-title">
      {#if showFps}
        <span class="fps" class:good={fps >= 55} class:warn={fps >= 30 && fps < 55} class:bad={fps < 30}>
          {fps} FPS
        </span>
      {/if}
      <span>{experienceType}</span>
    </span>
    <span class="toggle">{isCollapsed ? '▼' : '▲'}</span>
  </button>

  {#if !isCollapsed}
    <div class="debugger-content">
      <!-- Progress -->
      <div class="section">
        <div class="label">Progress</div>
        <div
          class="scrubber"
          bind:this={scrubberRef}
          onmousedown={handleScrubberMouseDown}
          role="slider"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabindex={0}
        >
          <div class="scrubber-fill" style:width="{progress * 100}%"></div>
          <div class="scrubber-handle" style:left="{progress * 100}%"></div>
        </div>
        <div class="value">{(progress * 100).toFixed(1)}%</div>
      </div>

      <!-- Time -->
      <div class="section">
        <div class="label">Time</div>
        <div class="value">
          {currentTime.toFixed(2)}s / {totalDuration}s
        </div>
      </div>

      <!-- Scroll Info -->
      <div class="section">
        <div class="label">Scroll</div>
        <div class="value">
          <span class="direction">
            {#if scrollDirection === 'down'}↓{:else if scrollDirection === 'up'}↑{:else}—{/if}
          </span>
          <span class="velocity">{Math.abs(scrollVelocity).toFixed(0)} px/s</span>
        </div>
      </div>

      <!-- Layer Toggles -->
      {#if showLayers && Object.keys(layerVisibility).length > 0}
        <div class="section">
          <div class="label">Layers</div>
          <div class="layer-toggles">
            {#each Object.entries(layerVisibility) as [id, visible]}
              <button
                class="layer-toggle"
                class:hidden={!visible}
                onclick={() => toggleLayer(id)}
                type="button"
              >
                {id}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Keyboard Shortcuts -->
      <div class="section shortcuts">
        <div class="label">Shortcuts</div>
        <div class="shortcuts-list">
          <span><kbd>Space</kbd> Pause</span>
          <span><kbd>←</kbd><kbd>→</kbd> Seek</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .debugger {
    position: fixed;
    z-index: 9999;
    min-width: 200px;
    max-width: 300px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #fff;
    backdrop-filter: blur(8px);
    user-select: none;
  }

  .debugger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    width: 100%;
  }

  .debugger-header:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .debugger-title {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .fps {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .fps.good {
    background: rgba(0, 200, 100, 0.3);
    color: #4ade80;
  }

  .fps.warn {
    background: rgba(255, 200, 0, 0.3);
    color: #fbbf24;
  }

  .fps.bad {
    background: rgba(255, 50, 50, 0.3);
    color: #f87171;
  }

  .toggle {
    font-size: 10px;
    opacity: 0.6;
  }

  .debugger-content {
    padding: 0 12px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section {
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .section:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  .value {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .scrubber {
    position: relative;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    cursor: pointer;
    overflow: hidden;
  }

  .scrubber-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
    transition: width 0.05s ease-out;
  }

  .scrubber-handle {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .direction {
    font-size: 14px;
    font-weight: bold;
    opacity: 0.8;
  }

  .velocity {
    opacity: 0.7;
  }

  .layer-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .layer-toggle {
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: #fff;
    font: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .layer-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .layer-toggle.hidden {
    opacity: 0.4;
    text-decoration: line-through;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 10px;
    opacity: 0.7;
  }

  kbd {
    display: inline-block;
    padding: 2px 4px;
    margin-right: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    font-family: inherit;
  }

  .collapsed .debugger-content {
    display: none;
  }
</style>
