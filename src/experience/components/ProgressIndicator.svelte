<!--
  ProgressIndicator.svelte

  Shows scroll progress within a section.
-->
<script lang="ts">
  import type { ScrollState } from 'svelte-scrollytelling'

  interface Props {
    scrollState?: ScrollState
    color?: string
    height?: string
  }

  let {
    scrollState,
    color = '#a78bfa',
    height = '4px',
  }: Props = $props()

  const progress = $derived(scrollState?.progress ?? 0)
</script>

<div class="progress-container" style:height>
  <div
    class="progress-bar"
    style:width="{progress * 100}%"
    style:background={color}
  ></div>
</div>

<style>
  .progress-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
  }

  .progress-bar {
    height: 100%;
    transition: width 0.05s ease-out;
  }
</style>
