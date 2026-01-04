# API Reference

Complete function and type reference for svelte-scrollytelling.

## Core Systems

### register.ts

```typescript
// Initialize GSAP plugins (safe to call multiple times)
initGSAP(): void

// Check if plugins are registered
isGSAPInitialized(): boolean

// Reset registration (for HMR)
resetGSAPRegistration(): void

// Re-exported plugins
export {
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
}
```

### scroll.ts

```typescript
// Get or create ScrollSmoother singleton
getScrollSmoother(config?: Partial<ScrollSmoother.Vars>): ScrollSmoother

// Kill ScrollSmoother singleton
killScrollSmoother(): void

// Kill all ScrollTriggers
killAllScrollTriggers(): void

// Recalculate scroll positions
refreshScrollTrigger(): void

// Programmatic scroll
scrollTo(target: string | number | Element, smooth?: boolean): void

// Get current progress (0-1)
getScrollProgress(): number

// Pause/resume scrolling
pauseScroll(): void
resumeScroll(): void
```

### timeline.ts

```typescript
// Create master timeline for all sections
createMasterTimeline(
  sections: SectionConfig[],
  container: HTMLElement
): { timeline: gsap.core.Timeline; context: gsap.Context }

// Create timeline for single section
createSectionTimeline(
  config: SectionConfig,
  container: HTMLElement
): gsap.core.Timeline

// Calculate scroll regions from section durations
calculateScrollRegions(sections: SectionConfig[]): ScrollRegion[]

// Pause timeline when tab hidden
createVisibilityHandler(timeline: gsap.core.Timeline): () => void

// Debounced ScrollTrigger refresh
createResizeHandler(debounceMs?: number): () => void
```

### timing.ts

```typescript
// Time → scroll proportion (0-1)
timeToScroll(seconds: number): number

// Scroll proportion → time
scrollToTime(proportion: number): number

// Milliseconds → scroll proportion
msToScroll(ms: number): number

// Scroll proportion → milliseconds
scrollToMs(proportion: number): number

// Parse position string ('+=0.2', 'label+0.3', etc.)
parsePosition(
  position: number | string,
  labels: Map<string, number>,
  previousEnd: number
): number

// Calculate reading time for text
calculateReadingTime(text: string): number

// Get/set timing configuration
getTimingConfig(): TimingConfig
setTimingConfig(config: Partial<TimingConfig>): void
```

### accessibility.ts

```typescript
// Get motion preference
getMotionPreference(): 'full' | 'reduced'

// Check if reduced motion should be used
shouldUseReducedMotion(): boolean

// Subscribe to motion preference changes
onMotionPreferenceChange(
  callback: (preference: 'full' | 'reduced') => void
): () => void

// Create timeline that skips to final states
createReducedMotionTimeline(
  config: SectionConfig,
  container: HTMLElement
): gsap.core.Timeline

// Extract final state from animation config
getFinalState(animation: AnimationConfig): gsap.TweenVars
```

### capabilities.ts

```typescript
// Detect GPU capabilities
detectGPU(): { tier: string; renderer: string }

// Get device memory (GB)
getDeviceMemory(): number

// Get CPU core count
getCoreCount(): number

// Check if touch device
isMobile(): boolean
supportsTouch(): boolean

// Calculate performance tier
calculatePerformanceTier(): PerformanceTier

// Get full capabilities profile
detectCapabilities(): Capabilities

// Check if feature is enabled for tier
isFeatureEnabled(feature: string, tier: PerformanceTier): boolean
```

### experience.ts

```typescript
// Detect current experience type
detectExperience(config: ExperiencesConfig): 'desktop' | 'mobile'

// Subscribe to experience changes
createExperienceObserver(
  config: ExperiencesConfig,
  onChange: (experience: 'desktop' | 'mobile') => void
): () => void

// Get/set current experience
getCurrentExperience(): 'desktop' | 'mobile'
setExperienceType(type: 'desktop' | 'mobile'): void

// Initialize experience state
initExperienceState(config: ExperiencesConfig): void

// Get full experience state
getExperienceState(): ExperienceState
```

### input.ts

```typescript
// Create GSAP Observer
createObserver(config: Observer.Vars): Observer

// Create section navigator (up/down)
createSectionNavigator(
  sections: string[],
  onNavigate: (index: number, direction: 'up' | 'down') => void
): Observer

// Create horizontal scroll observer
createHorizontalScrollObserver(
  container: HTMLElement,
  onScroll: (deltaX: number) => void
): Observer

// Create velocity tracker
createVelocityTracker(
  onVelocity: (velocity: number, direction: 'up' | 'down') => void
): Observer

// Create experience change observer
createExperienceObserver(
  config: ExperiencesConfig,
  onChange: (experience: 'desktop' | 'mobile') => void
): () => void
```

---

## Animation System

### composer.ts

```typescript
// Build animation from config
buildAnimation(
  config: AnimationConfig,
  container: HTMLElement,
  timeline: gsap.core.Timeline,
  labels: Map<string, number>,
  previousEnd: number
): number  // Returns end position

// Build full section timeline
buildSectionTimeline(
  config: SectionConfig,
  container: HTMLElement,
  timeline?: gsap.core.Timeline
): gsap.core.Timeline

// Calculate section duration from animations
calculateSectionDuration(config: SectionConfig): number
```

### easing.ts

```typescript
// Register custom ease
registerCustomEase(name: string, curve: string): void

// Register custom bounce
registerCustomBounce(name: string, config: CustomBounce.Vars): void

// Register custom wiggle
registerCustomWiggle(name: string, config: CustomWiggle.Vars): void

// Initialize brand easings
initBrandEasings(): void

// Get easing by name
getEasing(name: string): string | gsap.EaseFunction

// Easing presets
coreEasings: Record<string, string>
gsapEasings: Record<string, string>
brandEasings: Record<string, string>
followThroughEasings: Record<string, string>
```

### primitives/fade.ts

```typescript
fadeIn(target: gsap.TweenTarget, props: FadeProps, timeline: gsap.core.Timeline): void
fadeOut(target: gsap.TweenTarget, props: FadeProps, timeline: gsap.core.Timeline): void
crossfade(
  outTarget: gsap.TweenTarget,
  inTarget: gsap.TweenTarget,
  props: CrossfadeProps,
  timeline: gsap.core.Timeline
): void
```

### primitives/slide.ts

```typescript
slideIn(target: gsap.TweenTarget, props: SlideProps, timeline: gsap.core.Timeline): void
slideOut(target: gsap.TweenTarget, props: SlideProps, timeline: gsap.core.Timeline): void
pan(target: gsap.TweenTarget, props: PanProps, timeline: gsap.core.Timeline): void
```

### primitives/zoom.ts

```typescript
zoom(target: gsap.TweenTarget, props: ZoomProps, timeline: gsap.core.Timeline): void
scaleIn(target: gsap.TweenTarget, props: ScaleProps, timeline: gsap.core.Timeline): void
scaleOut(target: gsap.TweenTarget, props: ScaleProps, timeline: gsap.core.Timeline): void
```

### primitives/parallax.ts

```typescript
parallax(target: gsap.TweenTarget, props: ParallaxProps, timeline: gsap.core.Timeline): void
parallaxLayer(target: gsap.TweenTarget, props: ParallaxLayerProps, timeline: gsap.core.Timeline): void
calculateParallaxSpeed(z: number): number
applyScrollSmootherParallax(element: HTMLElement, speed: number, lag?: number): void
```

### primitives/text.ts

```typescript
textReveal(target: gsap.TweenTarget, props: TextRevealProps, timeline: gsap.core.Timeline): void
scrambleText(target: gsap.TweenTarget, props: ScrambleProps, timeline: gsap.core.Timeline): void
typewriter(target: gsap.TweenTarget, props: TypewriterProps, timeline: gsap.core.Timeline): void
textWave(target: gsap.TweenTarget, props: TextWaveProps, timeline: gsap.core.Timeline): void
textBlurReveal(target: gsap.TweenTarget, props: TextBlurProps, timeline: gsap.core.Timeline): void
revertSplit(split: SplitText): void
revertAllSplits(): void
```

### primitives/stagger.ts

```typescript
stagger(target: gsap.TweenTarget, props: StaggerProps, timeline: gsap.core.Timeline): void
staggerFadeIn(target: gsap.TweenTarget, props: StaggerProps, timeline: gsap.core.Timeline): void
staggerSlideIn(target: gsap.TweenTarget, props: StaggerSlideProps, timeline: gsap.core.Timeline): void
staggerScaleIn(target: gsap.TweenTarget, props: StaggerScaleProps, timeline: gsap.core.Timeline): void
```

### primitives/draw-svg.ts

```typescript
drawSVG(target: gsap.TweenTarget, props: DrawSVGProps, timeline: gsap.core.Timeline): void
```

### primitives/morph.ts

```typescript
morph(target: gsap.TweenTarget, props: MorphProps, timeline: gsap.core.Timeline): void
```

### primitives/motion-path.ts

```typescript
motionPath(target: gsap.TweenTarget, props: MotionPathProps, timeline: gsap.core.Timeline): void
```

### primitives/physics.ts

```typescript
inertia(target: gsap.TweenTarget, props: InertiaProps, timeline: gsap.core.Timeline): void
followThrough(target: gsap.TweenTarget, props: FollowThroughProps, timeline: gsap.core.Timeline): void
bounce(target: gsap.TweenTarget, props: BounceProps, timeline: gsap.core.Timeline): void
wiggle(target: gsap.TweenTarget, props: WiggleProps, timeline: gsap.core.Timeline): void
spring(target: gsap.TweenTarget, props: SpringProps, timeline: gsap.core.Timeline): void
gravityDrop(target: gsap.TweenTarget, props: GravityProps, timeline: gsap.core.Timeline): void
throwable(element: HTMLElement, props: ThrowableProps): gsap.core.Tween
```

### primitives/mask.ts

```typescript
mask(target: gsap.TweenTarget, props: MaskProps, timeline: gsap.core.Timeline): void
circleReveal(target: gsap.TweenTarget, props: CircleRevealProps, timeline: gsap.core.Timeline): void
wipeReveal(target: gsap.TweenTarget, props: WipeRevealProps, timeline: gsap.core.Timeline): void
insetReveal(target: gsap.TweenTarget, props: InsetRevealProps, timeline: gsap.core.Timeline): void
```

### primitives/dimension.ts

```typescript
dimension(target: gsap.TweenTarget, props: DimensionProps, timeline: gsap.core.Timeline): void
recede(target: gsap.TweenTarget, props: RecedeProps, timeline: gsap.core.Timeline): void
approach(target: gsap.TweenTarget, props: ApproachProps, timeline: gsap.core.Timeline): void
layeredDepth(targets: string, props: LayeredDepthProps, timeline: gsap.core.Timeline): void
flip3D(target: gsap.TweenTarget, props: Flip3DProps, timeline: gsap.core.Timeline): void
depthReveal(target: gsap.TweenTarget, props: DepthRevealProps, timeline: gsap.core.Timeline): void
```

### primitives/combined.ts

```typescript
combined(target: gsap.TweenTarget, props: CombinedProps, timeline: gsap.core.Timeline): void
sequence(target: gsap.TweenTarget, props: SequenceProps, timeline: gsap.core.Timeline): void
parallel(target: gsap.TweenTarget, props: ParallelProps, timeline: gsap.core.Timeline): void
keyframes(target: gsap.TweenTarget, props: KeyframesProps, timeline: gsap.core.Timeline): void
```

### gsap-passthrough.ts

```typescript
gsapPassthrough(target: gsap.TweenTarget, props: GSAPProps, timeline: gsap.core.Timeline): void
gsapFromTo(target: gsap.TweenTarget, props: GSAPFromToProps, timeline: gsap.core.Timeline): void
gsapSet(target: gsap.TweenTarget, props: gsap.TweenVars): void
gsapCall(callback: () => void, position: number, timeline: gsap.core.Timeline): void
gsapLabel(label: string, position: number, timeline: gsap.core.Timeline): void
```

### flip.ts

```typescript
captureState(selector: string | Element | Element[]): Flip.FlipState
flip(state: Flip.FlipState, config?: Flip.FromToVars): gsap.core.Timeline
flipFrom(state: Flip.FlipState, config?: Flip.FromToVars): gsap.core.Timeline
flipLayout(selector: string, config?: Flip.FromToVars): gsap.core.Timeline
flipReorder(container: Element, items: Element[], config?: Flip.FromToVars): gsap.core.Timeline
flipToggle(element: Element, config?: Flip.FromToVars): gsap.core.Timeline
```

---

## Responsive System

### frame.ts

```typescript
calculateScale(config: FrameConfig, viewportWidth: number, viewportHeight: number): number
getScaledDimensions(config: FrameConfig, scale: number): { width: number; height: number }
getFrameOffset(config: FrameConfig, scale: number, vw: number, vh: number): { x: number; y: number }
getFrameCSSVars(config: FrameConfig, scale: number): Record<string, string>
createFrameScaleObserver(config: FrameConfig, onScale: (scale: number, dims: { width: number; height: number }) => void): () => void
```

### regions.ts

```typescript
getRegionCoords(region: number): { x: string; y: string }
getPresetCoords(preset: PositionPreset): { x: string; y: string }
resolvePosition(config: PositionConfig): string
createPosition(preset: PositionPreset): PositionConfig
```

### safe-zones.ts

```typescript
getBreakpoint(): Breakpoint
getSafeZone(breakpoint?: Breakpoint): SafeZone
getSafeZoneCSSVars(breakpoint?: Breakpoint): Record<string, string>
getSafeZonePadding(breakpoint?: Breakpoint): { paddingTop: string; paddingBottom: string; paddingLeft: string; paddingRight: string }
createSafeZoneObserver(onChange: (breakpoint: Breakpoint, safeZone: SafeZone) => void): () => void
```

### fluid.ts

```typescript
generateTypeScale(config: FluidConfig): Record<string, string>
generateSpaceScale(config: FluidConfig): Record<string, string>
generateFluidCSSVars(config?: FluidConfig): Record<string, string>
generateFluidCSS(config?: FluidConfig): string
getFluidSize(step: string, type?: 'text' | 'space'): string
```

### presets.ts

```typescript
getPresetStyle(preset: PositionPreset): Record<string, string>
getLayoutPresetStyle(preset: string): Record<string, string>
presetToConfig(preset: PositionPreset): PositionConfig
presetNames: PositionPreset[]
positionPresets: Record<PositionPreset, { x: string; y: string }>
layoutPresets: Record<string, Record<string, string>>
```

---

## Content System

### scroll-state.ts

```typescript
// Individual element tracking
createScrollState(element: HTMLElement, sectionElement?: HTMLElement): { state: ScrollState; cleanup: () => void }

// Svelte action
scrollStateAction(element: HTMLElement, options?: { sectionElement?: HTMLElement; onState?: (state: ScrollState) => void }): ActionReturn

// Simple progress getter
createScrollProgress(): () => number

// Global state
getGlobalScrollState(): GlobalScrollState
setGlobalScrollProgress(progress: number): void
setCurrentSection(sectionId: string): void
setIsScrolling(scrolling: boolean): void
resetGlobalScrollState(): void
```

---

## Integrations

### threlte.ts

```typescript
// Smooth scroll progress for Threlte
useScrollProgress(getProgress: () => number, smoothing?: number): { value: Writable<number>; target: number }

// GSAP-to-Threlte bridge
createGSAPThrelteBridge(): { values: Record<string, number>; set: Record<string, (value: number) => void> }

// Camera bridge
createCameraBridge(bridge: ReturnType<typeof createGSAPThrelteBridge>): { update: () => void }

// Utilities
lerp(a: number, b: number, t: number): number
clamp(value: number, min: number, max: number): number
mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number
easeInOutSine(t: number): number

// Scrub controller
createScrubController(): { scrub: (progress: number) => void; reset: () => void }
```

---

## Dev Tools

### hmr.ts

```typescript
storeHMRState(key: string, value: unknown): void
getHMRState<T>(key: string): T | undefined
clearHMRState(key?: string): void
registerHMRCleanup(cleanup: () => void): void
createHMRSingleton<T>(key: string, factory: () => T): T
```

### validation.ts

```typescript
validateSection(config: SectionConfig): ValidationResult
validateLayer(layer: LayerConfig): ValidationResult
validateContent(content: ContentConfig): ValidationResult
validateAnimation(animation: AnimationConfig): ValidationResult
logValidationResult(result: ValidationResult): void
```

---

## Type Definitions

### Configuration Types

```typescript
interface ScrollytellingConfig {
  totalDuration: number
  scrollSpeed: number
  frame?: FrameConfig
  experiences?: ExperiencesConfig
  fluid?: FluidConfig
  safeZones?: SafeZonesConfig
  hmr?: HMRConfig
}

interface SectionConfig {
  id: string
  title?: string
  layers: LayerConfig[]
  content?: ContentConfig[]
  animations: AnimationConfig[]
  mobile?: Partial<SectionConfig>
}

interface FrameConfig {
  width: number
  height: number
  scaling: 'cover' | 'contain' | 'fill'
  minScale?: number
  maxScale?: number
}

interface ExperiencesConfig {
  desktop: { match: string; frame: FrameConfig }
  mobile: { match: string; frame: FrameConfig }
}
```

### Layer Types

```typescript
interface LayerBase {
  id: string
  z?: number
  parallax?: boolean | ParallaxConfig
  speed?: number
  lag?: number
  attributes?: Record<string, string>
}

interface LayerMedia extends LayerBase {
  type?: 'image' | 'video'
  src: string
  alt?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

interface Layer3D extends LayerBase {
  type: '3d'
  component: typeof SvelteComponent
  props?: Record<string, unknown>
  scrollSync?: boolean
  interactive?: boolean | 'objects'
  performanceTier?: PerformanceTier
  fallback?: { src: string; alt?: string }
}

interface LayerGroup extends LayerBase {
  type: 'group'
  children: LayerConfig[]
}

type LayerConfig = LayerMedia | Layer3D | LayerGroup
```

### Content Types

```typescript
interface ContentConfig {
  id: string
  component: typeof SvelteComponent
  props?: Record<string, unknown>
  position: PositionConfig
  at: number
  until?: number
  injectScrollState?: boolean
  performanceTier?: PerformanceTier
}

interface PositionConfig {
  x?: string | number
  y?: string | number
  region?: number | string
  preset?: PositionPreset
  vAlign?: 'top' | 'center' | 'bottom'
  hAlign?: 'left' | 'center' | 'right'
  transform?: string
}

interface ScrollState {
  progress: number
  isVisible: boolean
  direction: 'up' | 'down' | null
  velocity: number
  sectionProgress: number
  globalProgress: number
}
```

### Animation Types

```typescript
interface AnimationBase {
  target: string
  action: string
  at: number | string
  duration?: number
  ease?: string
  label?: string
}

// Specific animation configs extend AnimationBase
interface FadeAnimationConfig extends AnimationBase {
  action: 'fadeIn' | 'fadeOut'
  from?: number
  to?: number
}

interface SlideAnimationConfig extends AnimationBase {
  action: 'slideIn' | 'slideOut'
  direction: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

// ... other animation config types

type AnimationConfig =
  | FadeAnimationConfig
  | SlideAnimationConfig
  | ZoomAnimationConfig
  | TransformAnimationConfig
  | ParallaxAnimationConfig
  | TextRevealAnimationConfig
  | DrawSVGAnimationConfig
  | MorphAnimationConfig
  | MotionPathAnimationConfig
  | PhysicsAnimationConfig
  | MaskAnimationConfig
  | DimensionAnimationConfig
  | CombinedAnimationConfig
  | GSAPAnimationConfig
```

### Utility Types

```typescript
type PerformanceTier = 'high' | 'medium' | 'low'
type Breakpoint = 'mobile' | 'tablet' | 'desktop'
type PositionPreset =
  | 'center' | 'center-top' | 'center-bottom'
  | 'left-center' | 'right-center'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'golden-left' | 'golden-right' | 'golden-top' | 'golden-bottom'
  | 'thirds-intersect-tl' | 'thirds-intersect-tr'
  | 'thirds-intersect-bl' | 'thirds-intersect-br'

interface Capabilities {
  tier: PerformanceTier
  gpu: { tier: string; renderer: string }
  memory: number
  cores: number
  touch: boolean
  mobile: boolean
  motionPreference: 'full' | 'reduced'
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

---

## Components

### ScrollContainer

```svelte
<ScrollContainer
  config?: Partial<ScrollSmootherConfig>
  onProgress?: (progress: number) => void
>
  {children}
</ScrollContainer>
```

### Stage

```svelte
<Stage config?: FrameConfig>
  {children}
</Stage>
```

### Section

```svelte
<Section
  config: SectionConfig
  scrollTrigger?: Partial<ScrollTrigger.Vars>
/>
```

### Layer

```svelte
<Layer
  layer: LayerConfig
  scrollProgress?: number
/>
```

### LayerStack

```svelte
<LayerStack
  layers: LayerConfig[]
  scrollProgress?: number
/>
```

### Content

```svelte
<Content
  config: ContentConfig
  scrollProgress?: number
/>
```

### Debugger

```svelte
<Debugger
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  collapsed?: boolean
/>
```

### GSDevTools

```svelte
<GSDevTools
  animation?: gsap.core.Timeline
  minimal?: boolean
  keyboard?: boolean
/>
```
