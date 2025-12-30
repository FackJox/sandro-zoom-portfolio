<!--
  Stage.svelte

  The visual stage container that holds all sections.
  Applies reference frame scaling and provides section context.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface StageProps {
    /** Children (sections) */
    children: Snippet
    /** Additional CSS class */
    class?: string
    /** Whether to apply reference frame scaling (default: true) */
    scaled?: boolean
  }
</script>

<script lang="ts">
  import { getContext, setContext, onMount } from 'svelte'
  import type { ScrollytellingConfig, FrameConfig } from '../types'
  import type { FrameState } from '../core/frame.svelte'

  let { children, class: className = '', scaled = true }: StageProps = $props()

  // ============================================================================
  // Context
  // ============================================================================

  const CONFIG_KEY = Symbol.for('config')
  const FRAME_KEY = Symbol.for('frame')
  const STAGE_KEY = Symbol('stage')

  // Try to get config and frame from context
  // These may be undefined if Stage is used outside ScrollContainer
  const config = getContext<ScrollytellingConfig | undefined>(CONFIG_KEY)
  const frame = getContext<FrameState | undefined>(FRAME_KEY)

  // ============================================================================
  // State
  // ============================================================================

  let stageElement: HTMLElement | null = $state(null)

  // Stage context for child sections
  const stageContext = {
    getStageElement: () => stageElement,
  }

  setContext(STAGE_KEY, stageContext)

  // ============================================================================
  // Derived Styles
  // ============================================================================

  const transformStyles = $derived.by(() => {
    if (!scaled || !frame?.transform) {
      return ''
    }

    const { scale, offsetX, offsetY } = frame.transform

    return `
      transform: translate(${offsetX}px, ${offsetY}px) scale(${scale});
      transform-origin: top left;
    `
  })

  const frameSize = $derived.by(() => {
    if (!config) return { width: '100%', height: '100vh' }

    const frameConfig = config.experiences.desktop.frame
    return {
      width: `${frameConfig.width}px`,
      height: `${frameConfig.height}px`,
    }
  })

  const stageStyles = $derived(`
    position: relative;
    width: ${frameSize.width};
    height: ${frameSize.height};
    overflow: hidden;
    ${transformStyles}
  `)

  // DEBUG: Log stage setup
  $effect(() => {
    console.log('[Stage] render', {
      frameSize,
      hasFrame: !!frame,
      transform: frame?.transform,
      transformStyles,
    })
  })
</script>

<div
  bind:this={stageElement}
  class="stage {className}"
  style={stageStyles}
  data-stage
>
  {@render children()}
</div>

<style>
  .stage {
    /* CSS custom properties for fluid typography and spacing */
    --fluid-min-viewport: 320;
    --fluid-max-viewport: 1920;
  }
</style>
