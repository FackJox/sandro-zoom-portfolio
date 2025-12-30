<!--
  Paragraph.svelte

  Text paragraph component for scrollytelling content.
-->
<script lang="ts">
  import type { ScrollState } from 'svelte-scrollytelling'

  interface Props {
    text: string
    maxWidth?: string
    align?: 'left' | 'center' | 'right'
    color?: string
    scrollState?: ScrollState
  }

  let {
    text,
    maxWidth = '600px',
    align = 'center',
    color = 'rgba(255, 255, 255, 0.9)',
    scrollState,
  }: Props = $props()
</script>

<p
  class="paragraph"
  style:max-width={maxWidth}
  style:text-align={align}
  style:color
>
  {text}
</p>

<style>
  .paragraph {
    margin: 0;
    font-family: var(--font-body, 'Georgia', serif);
    font-size: clamp(1rem, 2.5vw, 1.25rem);
    line-height: 1.6;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
  }
</style>
