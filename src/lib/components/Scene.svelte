<!--
  Scene.svelte

  A scene container for portal transitions.
  Manages z-index and transform-origin for the portal zoom effect.
-->
<script lang="ts" module>
  export interface SceneProps {
    /** Unique scene identifier */
    id: string
    /** Scene role in transition: 'active', 'outgoing', 'incoming', or 'hidden' */
    role?: 'active' | 'outgoing' | 'incoming' | 'hidden'
    /** Z-index override */
    zIndex?: number
    /** Additional CSS class */
    class?: string
  }
</script>

<script lang="ts">
  import { css } from '$styled/css'

  let {
    id,
    role = 'active',
    zIndex,
    class: className = '',
    children
  }: SceneProps & { children: any } = $props()

  // Z-index based on role
  const roleZIndex = $derived(() => {
    if (zIndex !== undefined) return zIndex
    switch (role) {
      case 'outgoing': return 20
      case 'incoming': return 10
      case 'active': return 20
      case 'hidden': return 0
      default: return 10
    }
  })

  // Styles using PandaCSS
  const sceneStyles = $derived(css({
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    transformOrigin: '50% 45%',
    zIndex: roleZIndex().toString(),
    // Visibility based on role
    visibility: role === 'hidden' ? 'hidden' : 'visible',
    pointerEvents: role === 'hidden' ? 'none' : 'auto',
  }))

  // DEBUG: Log role changes
  $effect(() => {
    console.log(`[Scene ${id}] role=${role} z=${roleZIndex()}`)
  })
</script>

<div
  class="{sceneStyles} {className}"
  data-scene={id}
  data-role={role}
>
  {@render children()}
</div>
