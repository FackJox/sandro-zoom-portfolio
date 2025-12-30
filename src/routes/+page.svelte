<!--
  svelte-scrollytelling - Landing Page

  Provides an overview and links to the example experience.
-->
<script lang="ts">
  // No state needed for static landing page
</script>

<svelte:head>
  <title>svelte-scrollytelling | SvelteKit + GSAP Scrollytelling Framework</title>
  <meta name="description" content="A general-purpose SvelteKit + GSAP scrollytelling boilerplate with time-based animation authoring, layer systems, and responsive design." />
</svelte:head>

<main>
  <header>
    <h1>svelte-scrollytelling</h1>
    <p class="tagline">Time-based scrollytelling for SvelteKit</p>
  </header>

  <section class="features">
    <h2>Features</h2>
    <ul>
      <li>
        <strong>Time-Based Authoring</strong>
        <span>Author animations in seconds, like After Effects. Scroll position maps automatically.</span>
      </li>
      <li>
        <strong>Layer System</strong>
        <span>BG, MG, FG layers with parallax, opacity control, and optional grouping.</span>
      </li>
      <li>
        <strong>Animation Primitives</strong>
        <span>Fade, slide, zoom, parallax, morph, mask, stagger, and more. Plus GSAP escape hatch.</span>
      </li>
      <li>
        <strong>Responsive Design</strong>
        <span>Reference frames, semantic regions (golden ratio, thirds), and fluid sizing.</span>
      </li>
      <li>
        <strong>Content System</strong>
        <span>Mount Svelte components at specific times with opt-in scroll state injection.</span>
      </li>
      <li>
        <strong>Developer Experience</strong>
        <span>Visual debugger, HMR scroll preservation, config validation.</span>
      </li>
    </ul>
  </section>

  <section class="cta">
    <a href="/example" class="button">View Example</a>
    <a href="https://github.com/your-org/svelte-scrollytelling" class="button secondary" target="_blank" rel="noopener">
      GitHub
    </a>
  </section>

  <section class="quick-start">
    <h2>Quick Start</h2>
    <pre><code>{`import { ScrollContainer, Stage, Section } from 'svelte-scrollytelling'
import { config } from './scrollytelling.config'
import { hero, features, outro } from './sections'

<ScrollContainer {config}>
  <Stage>
    <Section config={hero} />
    <Section config={features} />
    <Section config={outro} />
  </Stage>
</ScrollContainer>`}</code></pre>
  </section>

  <footer>
    <p>Built with SvelteKit 5 + GSAP + TypeScript</p>
  </footer>
</main>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: #0f0f0f;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }

  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 4rem 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 4rem;
  }

  h1 {
    font-size: clamp(2.5rem, 8vw, 4rem);
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 1.25rem;
    color: #888;
    margin-top: 0.5rem;
  }

  h2 {
    font-size: 1.5rem;
    color: #fff;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #333;
    padding-bottom: 0.5rem;
  }

  .features ul {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 1.5rem;
  }

  .features li {
    background: #1a1a1a;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #2a2a2a;
  }

  .features li strong {
    display: block;
    color: #a78bfa;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .features li span {
    color: #888;
  }

  .cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 3rem 0;
  }

  .button {
    display: inline-block;
    padding: 0.875rem 2rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .button:not(.secondary) {
    background: linear-gradient(135deg, #a78bfa, #60a5fa);
    color: #fff;
  }

  .button:not(.secondary):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(167, 139, 250, 0.3);
  }

  .button.secondary {
    background: transparent;
    border: 1px solid #444;
    color: #888;
  }

  .button.secondary:hover {
    border-color: #666;
    color: #ccc;
  }

  .quick-start pre {
    background: #1a1a1a;
    border-radius: 8px;
    padding: 1.5rem;
    overflow-x: auto;
    border: 1px solid #2a2a2a;
  }

  .quick-start code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.9rem;
    color: #60a5fa;
    white-space: pre;
  }

  footer {
    text-align: center;
    margin-top: 4rem;
    color: #666;
    font-size: 0.9rem;
  }
</style>
