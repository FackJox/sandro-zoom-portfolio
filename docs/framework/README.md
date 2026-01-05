# Svelte Scrollytelling Documentation

Production-ready SvelteKit + GSAP scrollytelling boilerplate with time-based animation authoring.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Installation, setup, first section |
| [Architecture](./architecture.md) | System design, data flow, file structure |
| [Core Systems](./core-systems.md) | GSAP setup, timing, experience management |
| [Animation Primitives](./animation-primitives.md) | All 22+ animation types with examples |
| [Layer System](./layer-system.md) | Images, video, 3D, parallax, z-ordering |
| [Content System](./content-system.md) | Positioning, scroll state, visibility |
| [Responsive System](./responsive-system.md) | Frame scaling, regions, fluid sizing |
| [Components](./components.md) | ScrollContainer, Stage, Section reference |
| [Patterns](./patterns.md) | Critical patterns and best practices |
| [API Reference](./api-reference.md) | Complete function and type reference |

## Quick Reference

### Project Structure

```
src/lib/
├── core/           # GSAP setup, timing, experience management
├── animation/      # Primitives, composers, easing
├── layers/         # Layer rendering (images, video, 3D)
├── content/        # Content positioning, scroll state
├── components/     # ScrollContainer, Stage, Section
├── responsive/     # Frame scaling, regions, fluid sizing
├── integrations/   # Third-party (Threlte)
├── dev/            # Debugging, HMR, validation
└── types/          # TypeScript interfaces
```

### Core Concepts

1. **Time-based authoring** - Define animations in seconds, not scroll percentages
2. **3-tier layers** - Background (z=0), midground (z=50), foreground (z=100)
3. **Composable primitives** - fadeIn, slideIn, zoom, parallax, etc.
4. **GSAP escape hatch** - Raw GSAP when primitives aren't enough
5. **Desktop/mobile split** - Binary experience switching

### Critical Patterns

```typescript
// ALWAYS wrap animations in gsap.context()
$effect(() => {
  if (!container) return
  ctx = gsap.context(() => {
    gsap.to('.el', { x: 100 })
  }, container)
  return () => ctx.revert()
})

// Use autoAlpha pattern (not opacity)
gsap.set(element, { autoAlpha: 0 })
gsap.to(element, { autoAlpha: 1 })

// Single ScrollSmoother instance
const smoother = getScrollSmoother()
```

### Minimal Section Example

```typescript
const section = {
  id: 'hero',
  layers: [
    { id: 'bg', src: '/bg.jpg', z: 0 }
  ],
  content: [
    { id: 'title', component: Title, position: { preset: 'center' }, at: 0 }
  ],
  animations: [
    { target: 'bg', action: 'fadeIn', duration: 1, at: 0 },
    { target: 'title', action: 'fadeIn', at: 0.5 }
  ]
}
```

```svelte
<ScrollContainer>
  <Stage>
    <Section config={section} />
  </Stage>
</ScrollContainer>
```

## Key Dependencies

- **GSAP 3.14** - Animation engine + ScrollTrigger + ScrollSmoother
- **SvelteKit 2.49** - Framework
- **Svelte 5** - Runes syntax (`$state`, `$effect`, `$props`)
- **PandaCSS** - Utility-first styling
- **TypeScript 5.9** - Strict mode
