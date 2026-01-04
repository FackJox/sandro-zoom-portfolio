# Core Systems

Deep dive into GSAP setup, timing, experience management, and foundational systems.

## GSAP Plugin Registration

**File:** `src/lib/core/register.ts`

### The Problem

GSAP plugins must be registered exactly once. Multiple registrations cause errors. HMR reloads attempt re-registration.

### The Solution

```typescript
let registered = false

export function initGSAP(): void {
  if (registered) return

  gsap.registerPlugin(
    ScrollTrigger,
    ScrollSmoother,
    Observer,
    Flip,
    SplitText,
    ScrambleTextPlugin,
    DrawSVGPlugin,
    MorphSVGPlugin,
    MotionPathPlugin,
    InertiaPlugin,
    CustomEase,
    CustomBounce,
    CustomWiggle,
    GSDevTools
  )

  // Set sensible defaults
  ScrollTrigger.defaults({
    invalidateOnRefresh: true,
    toggleActions: 'play none none reverse'
  })

  registered = true
}

// HMR support
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    registered = false
  })
}
```

### Usage

```typescript
// Call once at app initialization (ScrollContainer handles this)
import { initGSAP } from '$lib/core/register'

initGSAP()  // Safe to call multiple times
```

### Exported Plugins

All GSAP plugins are re-exported for convenience:

```typescript
import {
  ScrollTrigger,
  ScrollSmoother,
  Observer,
  Flip,
  SplitText,
  // ... etc
} from '$lib/core/register'
```

## ScrollSmoother Management

**File:** `src/lib/core/scroll.ts`

### Singleton Pattern

Only one ScrollSmoother instance should exist:

```typescript
let smoother: ScrollSmoother | null = null

export function getScrollSmoother(config?: Partial<ScrollSmoother.Vars>): ScrollSmoother {
  if (smoother) return smoother

  smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2,
    effects: true,
    smoothTouch: 0.1,
    normalizeScroll: true,
    ignoreMobileResize: true,
    ...config
  })

  return smoother
}

export function killScrollSmoother(): void {
  smoother?.kill()
  smoother = null
}
```

### Data Attributes

ScrollSmoother reads these attributes for per-element effects:

```html
<!-- Parallax: slower than scroll -->
<img src="bg.jpg" data-speed="0.5" />

<!-- Parallax: faster than scroll -->
<img src="fg.jpg" data-speed="1.3" />

<!-- Delay following (lag) -->
<div data-lag="0.2">Follows with delay</div>
```

### Utility Functions

```typescript
// Kill all ScrollTriggers
killAllScrollTriggers(): void

// Recalculate on resize/content change
refreshScrollTrigger(): void

// Programmatic scroll
scrollTo(target: string | number | Element, smooth?: boolean): void

// Get current progress (0-1)
getScrollProgress(): number

// Pause/resume
pauseScroll(): void
resumeScroll(): void
```

## Timeline Factory

**File:** `src/lib/core/timeline.ts`

### Master Timeline

Creates the root timeline that controls all sections:

```typescript
export function createMasterTimeline(
  sections: SectionConfig[],
  container: HTMLElement
): { timeline: gsap.core.Timeline; context: gsap.Context } {

  const ctx = gsap.context(() => {
    const scrollDistance = calculateScrollDistance(sections)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: `+=${scrollDistance}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    })

    // Add section timelines with crossfade overlap
    sections.forEach((section, i) => {
      const sectionTl = createSectionTimeline(section, container)
      const position = i === 0 ? 0 : `-=0.02`  // 2% overlap
      tl.add(sectionTl, position)
    })

    // Store for GSDevTools
    if (typeof window !== 'undefined') {
      (window as any).__masterTimeline = tl
    }

    return tl
  }, container)

  return { timeline: ctx.data[0], context: ctx }
}
```

### Section Timeline

Creates timeline for individual section:

```typescript
export function createSectionTimeline(
  config: SectionConfig,
  container: HTMLElement
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Initialize layers to hidden
  config.layers.forEach(layer => {
    const el = container.querySelector(`[data-layer="${layer.id}"]`)
    if (el) gsap.set(el, { autoAlpha: 0, scale: 1 })
  })

  // Initialize content to hidden
  config.content?.forEach(content => {
    const el = container.querySelector(`[data-content="${content.id}"]`)
    if (el) gsap.set(el, { autoAlpha: 0 })
  })

  // Build animations
  buildSectionTimeline(config, container, tl)

  return tl
}
```

### Helper Utilities

```typescript
// Calculate scroll regions from section durations
calculateScrollRegions(sections: SectionConfig[]): ScrollRegion[]

// Pause timeline when tab hidden
createVisibilityHandler(timeline: gsap.core.Timeline): () => void

// Debounced ScrollTrigger refresh on resize
createResizeHandler(debounceMs?: number): () => void
```

## Timing System

**File:** `src/lib/core/timing.ts`

### Configuration

```typescript
interface TimingConfig {
  totalDuration: number  // seconds (default: 60)
  scrollSpeed: number    // px/s (default: 65)
}

// Derived values
scrollDistance = totalDuration * scrollSpeed  // 60 * 65 = 3900px
```

### Time ↔ Scroll Conversion

```typescript
// Seconds → scroll proportion (0-1)
export function timeToScroll(seconds: number): number {
  return seconds / config.totalDuration
}

// Proportion → seconds
export function scrollToTime(proportion: number): number {
  return proportion * config.totalDuration
}

// Milliseconds → proportion
export function msToScroll(ms: number): number {
  return (ms / 1000) / config.totalDuration
}

// Proportion → milliseconds
export function scrollToMs(proportion: number): number {
  return proportion * config.totalDuration * 1000
}
```

### Position Parsing

Supports multiple position formats:

```typescript
export function parsePosition(
  position: number | string,
  labels: Map<string, number>,
  previousEnd: number
): number {
  // Absolute time: 2.5
  if (typeof position === 'number') {
    return timeToScroll(position)
  }

  // Relative: '+=0.2' or '-=0.5'
  if (position.startsWith('+=')) {
    return previousEnd + timeToScroll(parseFloat(position.slice(2)))
  }
  if (position.startsWith('-=')) {
    return previousEnd - timeToScroll(parseFloat(position.slice(2)))
  }

  // Label: 'titleEnd'
  if (labels.has(position)) {
    return labels.get(position)!
  }

  // Label with offset: 'titleEnd+0.3'
  const match = position.match(/^(\w+)([+-])(\d+\.?\d*)$/)
  if (match) {
    const [, label, op, offset] = match
    const labelPos = labels.get(label) ?? 0
    const offsetScroll = timeToScroll(parseFloat(offset))
    return op === '+' ? labelPos + offsetScroll : labelPos - offsetScroll
  }

  return timeToScroll(parseFloat(position))
}
```

### Reading Time Calculation

For text content timing:

```typescript
export function calculateReadingTime(text: string): number {
  const words = text.split(/\s+/).length
  const baseTime = 1  // seconds
  const msPerWord = 200
  return baseTime + (words * msPerWord / 1000)
}
```

## Accessibility

**File:** `src/lib/core/accessibility.ts`

### Motion Preference Detection

```typescript
export function getMotionPreference(): 'full' | 'reduced' {
  if (typeof window === 'undefined') return 'full'

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  return mql.matches ? 'reduced' : 'full'
}

export function shouldUseReducedMotion(): boolean {
  return getMotionPreference() === 'reduced'
}
```

### Preference Change Observer

```typescript
export function onMotionPreferenceChange(
  callback: (preference: 'full' | 'reduced') => void
): () => void {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'reduced' : 'full')
  }

  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}
```

### Reduced Motion Timeline

Creates timeline that skips to final states:

```typescript
export function createReducedMotionTimeline(
  config: SectionConfig,
  container: HTMLElement
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // Set all elements to their final states immediately
  config.animations.forEach(anim => {
    const el = container.querySelector(`[data-${anim.targetType}="${anim.target}"]`)
    if (!el) return

    const finalState = getFinalState(anim)
    gsap.set(el, finalState)
  })

  return tl
}
```

## Capabilities Detection

**File:** `src/lib/core/capabilities.ts`

### Performance Tiers

```typescript
type PerformanceTier = 'high' | 'medium' | 'low'

// High: 8GB+ memory, 8+ cores, good GPU
// Medium: 4GB+ memory, 4+ cores
// Low: Below medium thresholds
```

### Detection Functions

```typescript
// GPU capabilities via WebGL
export function detectGPU(): { tier: string; renderer: string } {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl')
  if (!gl) return { tier: 'low', renderer: 'unknown' }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : 'unknown'

  return { tier: classifyGPU(renderer), renderer }
}

// Device memory (Chrome only)
export function getDeviceMemory(): number {
  return (navigator as any).deviceMemory ?? 4
}

// CPU cores
export function getCoreCount(): number {
  return navigator.hardwareConcurrency ?? 4
}

// Touch device
export function isMobile(): boolean {
  return 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
}

// Full capability profile
export function detectCapabilities(): Capabilities {
  return {
    tier: calculatePerformanceTier(),
    gpu: detectGPU(),
    memory: getDeviceMemory(),
    cores: getCoreCount(),
    touch: supportsTouch(),
    mobile: isMobile(),
    motionPreference: getMotionPreference()
  }
}
```

### Feature Gates

```typescript
const featureRequirements: Record<string, PerformanceTier> = {
  '3d': 'high',
  'video-background': 'medium',
  'complex-parallax': 'medium',
  'physics-animations': 'high'
}

export function isFeatureEnabled(feature: string, tier: PerformanceTier): boolean {
  const required = featureRequirements[feature]
  if (!required) return true

  const tierOrder = ['low', 'medium', 'high']
  return tierOrder.indexOf(tier) >= tierOrder.indexOf(required)
}
```

## Experience Management

**File:** `src/lib/core/experience.ts`

### Configuration

```typescript
interface ExperiencesConfig {
  desktop: {
    match: string  // Media query
    frame: FrameConfig
  }
  mobile: {
    match: string
    frame: FrameConfig
  }
}

// Default configuration
const defaultExperiences: ExperiencesConfig = {
  desktop: {
    match: '(orientation: landscape), (pointer: fine)',
    frame: { width: 1920, height: 1080, scaling: 'cover' }
  },
  mobile: {
    match: '(orientation: portrait) and (pointer: coarse)',
    frame: { width: 390, height: 844, scaling: 'contain' }
  }
}
```

### Detection

```typescript
export function detectExperience(config: ExperiencesConfig): 'desktop' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop'

  if (window.matchMedia(config.mobile.match).matches) {
    return 'mobile'
  }
  return 'desktop'
}
```

### Observer

```typescript
export function createExperienceObserver(
  config: ExperiencesConfig,
  onChange: (experience: 'desktop' | 'mobile') => void
): () => void {
  const mql = window.matchMedia(config.mobile.match)

  const handler = () => {
    onChange(mql.matches ? 'mobile' : 'desktop')
  }

  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}
```

### State Management

```typescript
let currentExperience: 'desktop' | 'mobile' = 'desktop'

export function getCurrentExperience(): 'desktop' | 'mobile' {
  return currentExperience
}

export function setExperienceType(type: 'desktop' | 'mobile'): void {
  currentExperience = type
}

export function initExperienceState(config: ExperiencesConfig): void {
  currentExperience = detectExperience(config)
}
```

## Input Handling

**File:** `src/lib/core/input.ts`

### Observer-Based System

Uses GSAP's Observer plugin for unified input handling:

```typescript
import { Observer } from 'gsap/Observer'

export function createObserver(config: Observer.Vars): Observer {
  return Observer.create({
    type: 'wheel,touch,pointer',
    preventDefault: true,
    ...config
  })
}
```

### Section Navigator

Navigate between sections with swipe/wheel:

```typescript
export function createSectionNavigator(
  sections: string[],
  onNavigate: (index: number, direction: 'up' | 'down') => void
): Observer {
  let currentIndex = 0

  return createObserver({
    onUp: () => {
      if (currentIndex < sections.length - 1) {
        currentIndex++
        onNavigate(currentIndex, 'down')
      }
    },
    onDown: () => {
      if (currentIndex > 0) {
        currentIndex--
        onNavigate(currentIndex, 'up')
      }
    },
    tolerance: 50,
    wheelSpeed: -1
  })
}
```

### Velocity Tracker

Track scroll velocity for physics:

```typescript
export function createVelocityTracker(
  onVelocity: (velocity: number, direction: 'up' | 'down') => void
): Observer {
  return createObserver({
    onChange: (self) => {
      onVelocity(self.velocityY, self.velocityY > 0 ? 'down' : 'up')
    }
  })
}
```

### Horizontal Scroll Observer

For horizontal scroll sections:

```typescript
export function createHorizontalScrollObserver(
  container: HTMLElement,
  onScroll: (deltaX: number) => void
): Observer {
  return createObserver({
    target: container,
    type: 'wheel,touch',
    onChangeX: (self) => onScroll(self.deltaX),
    lockAxis: true
  })
}
```

## Next Steps

- [Animation Primitives](./animation-primitives.md) - All animation types
- [Patterns](./patterns.md) - Critical patterns to follow
- [API Reference](./api-reference.md) - Complete function reference
