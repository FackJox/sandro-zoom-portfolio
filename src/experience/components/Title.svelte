<!--
  Title.svelte

  Display title component for scrollytelling content.
-->
<script lang="ts">
  import type { ScrollState } from 'svelte-scrollytelling'

  interface Props {
    text: string
    size?: 'l' | 'xl' | '2xl' | '3xl'
    color?: string
    scrollState?: ScrollState
  }

  let { text, size = 'xl', color = 'white', scrollState }: Props = $props()

  // Use scroll state for effects if available
  const opacity = $derived(scrollState?.isVisible !== false ? 1 : 0)
</script>

<h1
  class="title title-{size}"
  style:color
  style:opacity
>
  {text}
</h1>

<style>
  .title {
    margin: 0;
    font-family: var(--font-display, 'Georgia', serif);
    font-weight: 700;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
    text-align: center;
    line-height: 1.1;
  }

  .title-l {
    font-size: clamp(2rem, 5vw, 3rem);
  }

  .title-xl {
    font-size: clamp(3rem, 8vw, 5rem);
  }

  .title-2xl {
    font-size: clamp(4rem, 10vw, 7rem);
  }

  .title-3xl {
    font-size: clamp(5rem, 12vw, 9rem);
  }
</style>
