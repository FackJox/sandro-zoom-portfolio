<!--
  BorderedViewport.svelte

  Cinematic bordered viewport for media content.
  Used in Film and About sections for video/image display.

  Design: 1px accent border, 4px radius, dark background
  From: docs/plans/2025-01-05-ui-aesthetic-design.md
-->
<script lang="ts">
  import { css } from '$styled/css'
  import type { Snippet } from 'svelte'

  interface Props {
    aspectRatio?: '2.39/1' | '16/9' | '4/3'
    children: Snippet
  }

  let {
    aspectRatio = '2.39/1',
    children
  }: Props = $props()

  const viewportStyles = css({
    position: 'relative',
    width: '100%',
    aspectRatio: 'var(--aspect-ratio)',
    border: '1px solid',
    borderColor: 'brand.accent',
    borderRadius: '4px',
    backgroundColor: 'brand.surface',
    overflow: 'hidden',
    // Ensure media fills container
    '& > img, & > video, & > iframe': {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  })
</script>

<div class={viewportStyles} style:--aspect-ratio={aspectRatio} data-bordered-viewport>
  {@render children()}
</div>
