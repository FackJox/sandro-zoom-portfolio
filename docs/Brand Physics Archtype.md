# Brand Physics Archetype

## Motion Archetype

**Primary archetype:** **Machine** — *Mechanical & Rhythmic*
**Secondary archetype:** **Documentary** — *Observational & Restrained*

> **Organism test:**
> This brand moves like a gimbal-stabilized lens tracking a climber on a vertical face—mechanically smooth, locked on target, the operator's hands invisible. You notice the shot, never the rig.

### Implications

- **Time is metered.** Motion follows the cadence of professional equipment—motorized focus pulls, stabilized tracking shots, steady rotors. No organic wobble, no human hesitation.

- **The UI is the camera.** Transitions feel like lens operations—zooming into a shot, pulling back to reveal context, racking focus between subjects. The motion is bold and present, but always anchored to the camera metaphor. Navigation = operating a viewfinder.

- **Precision is non-negotiable.** In high-altitude work, approximate kills. Motion lands exactly where intended, exactly when expected. No overshoot, no bounce, no "close enough."

- **One subject at a time.** Like a camera operator choosing focus, the interface animates one element while others hold. Sequential attention, never split.

---

## Motion Tokens

### Easing Tokens

- **`ease-lock-on`**
  `cubic-bezier(0.19, 1.0, 0.22, 1.0)`

  - Fast acquisition, smooth settle—like a gimbal finding and locking onto a subject.
  - Used for: elements entering frame, zoom-ins, content appearing, focus snaps.

- **`ease-release`**
  `cubic-bezier(0.25, 0.0, 0.35, 1.0)`

  - Gentler departure, controlled fade—like a camera operator releasing a subject before the next shot.
  - Used for: elements exiting frame, zoom-outs, sections departing, transitional fades.

> **Hard rule:**
> No spring, bounce, or overshoot. Cameras don't hunt. Professional equipment arrives exactly where intended—once.

### Duration Scale

Tight tolerances. Machines don't wander.

- **`brand-micro`**: **150–200ms**
  - Opacity changes, color shifts, small state changes.
  - The snap of a focus confirmation.

- **`brand-standard`**: **280–350ms**
  - The workhorse. Most UI transitions, lens badge movement, metadata updates.
  - A smooth motorized adjustment.

- **`brand-cinematic`**: **500–600ms**
  - Major transitions only: section changes, portal zooms, full-frame reveals.
  - The deliberate push-in before a cut.

> **No signature tier.** Machines don't have emotional peaks. If something needs more than 600ms, question whether it should move at all.

---

## Motion Density

**Global setting:** **Minimal, with strict sequencing.**

The interface is a camera. A camera has one lens, one focal point, one subject at a time.

### Density Rules

1. **One primary motion per moment.** If the content is zooming, the lens badge holds. If the lens badge is repositioning, content waits. Never compete for attention.

2. **Locked rig principle.** The lens badge, metadata strip, and active content move as one unit when transitioning between sections—like a camera, lens, and mounted display moving together on a single rig. They don't animate independently; they're bolted to the same machine.

3. **Background holds.** No ambient drift, no decorative parallax, no "living" backgrounds. Static elements stay static. Motion is intentional or it doesn't exist.

4. **Zoom is the primary verb.** Most major transitions should feel like focal length changes—pushing into detail, pulling back to context. Pan and slide are secondary. This reinforces the camera-as-UI metaphor.

### Hierarchy

| Context | Density | Behavior |
|---------|---------|----------|
| UI chrome (nav, controls) | **None** | Instant state changes, no animation. The operator's controls don't perform. |
| Section transitions | **Single** | One zoom/push motion. Everything else cuts or holds. |
| Portal sequences | **Locked rig** | Lens badge + content + metadata move as unified camera system. |
| Hover/micro states | **Subtle** | Micro-duration only. Never distract from primary content. |

---

## Semantic Motion Rules

These are the "no-argue" laws that tie motion to meaning for Alpine Noir:

### 1. Egg Toast = Danger Signal
When Egg Toast accent appears, it **grows from a point** like a focus reticle expanding to confirm lock. Duration: `brand-micro` (150-200ms). No fade-in, no slide—expansion only.

### 2. Zoom is the Primary Verb
All major section transitions use **lens zoom** (push-in or pull-out). This reinforces "the UI is the camera." Pan and slide are secondary verbs, used only within sections.

### 3. Locked Rig Principle
The lens badge, metadata strip, and active content move as **one unit** during transitions. They don't animate independently—they're bolted to the same machine.

### 4. Sequential Focus
Only one thing moves at a time. If content is zooming, chrome holds. If lens is repositioning, content waits. The camera picks one subject.

### 5. Precision Landing
Motion **lands exactly** where intended, first time. No overshoot, no settle, no correction.

---

## Metadata Strip System

The metadata strip is a persistent UI element that provides context throughout the experience. It morphs between states as the user scrolls.

### Strip States

| Section | Content | Purpose |
|---------|---------|---------|
| Hero (early) | `BERGHAUS • OSPREY • REDBULL TV • NETFLIX • BBC` | Social proof upfront |
| Hero (late) | `ALT ▲ 8,000M • K2 / EVEREST • HIGH ALTITUDE DOP` | Credentials |
| Film | `14 PEAKS • NETFLIX • 2021` (updates per card) | Current work context |
| Film Stories | `SASHA / NO DAYS OFF • REDBULL TV` (updates per story) | Story context |
| Photo | `SUCCESSFUL CLIMBS: 12 • UNSUCCESSFUL: 4` | Stats |
| About | `FRONT-LINE PERSPECTIVE • 10+ YEARS` | Bio context |
| Services | `MOUNTAIN DOP • AERIAL • STOCK` | Offerings |
| Contact | `+44 7880 352909 • GET IN TOUCH` | CTA |

### Strip Transitions

#### 1. Logos → Metadata (Scan Line Wipe)

**Trigger:** Scroll past 50% of hero height

A horizontal scan line (Egg Toast, 2px wide) sweeps left → right across the strip. Content behind the line shows metadata; content ahead still shows logos.

```
BEFORE:  BERGHAUS   OSPREY   REDBULL   NETFLIX   BBC   TNF
DURING:  ALT ▲ 8,000M  │▓▓│  REDBULL   NETFLIX   BBC   TNF
                        ↑ scan line (Egg Toast)
AFTER:   ALT ▲ 8,000M    •    K2 / EVEREST    •    DOP
```

**Motion:**
- Sweep: `brand-cinematic` (550ms), `linear` easing (mechanical scan)
- Line fade-out: `brand-micro` (175ms) after reaching right edge

#### 2. Metadata → Section Label (Shutter Blink)

**Trigger:** Scroll past 90% of section (entering next section)

Quick black flash like a camera shutter—instantaneous cut between content.

```
BEFORE:  ALT ▲ 8,000M    •    K2 / EVEREST    •    DOP
BLACK:   ████████████████████████████████████████████████
AFTER:   FILM — HIGH ALTITUDE FEATURES
```

**Motion:**
- Fade to black: `brand-micro` (175ms), fast ease-in
- Black hold: 60ms
- Fade up: `brand-micro` (175ms), ease-out
- Total: ~410ms

#### 3. Metadata Updates Within Section (Crossfade + Slide)

**Trigger:** Scroll between beats (e.g., 14 Peaks → K2 Winter)

Quick data refresh—old text fades up and out, new text fades up and in.

```
BEFORE:  14 PEAKS • NETFLIX • 2021
AFTER:   K2 WINTER • DISCOVERY • 2020
```

**Motion:**
- Old text: opacity 1→0, translateY 0→-8px over `brand-micro` (175ms)
- New text: opacity 0→1, translateY 8px→0 over `brand-micro` (175ms)
- Overlap: new text starts at 50% of old text fade (~90ms delay)
- Total: ~265ms

---

## Lens Badge Behavior

The lens badge is a persistent corner element that reinforces the camera-as-UI metaphor. Two viable approaches—choose based on desired complexity:

### Option A: Minimal Record Indicator (Recommended)

The simplest implementation—a record dot confirming "the camera is rolling."

**Visual:**
- Small Egg Toast circle (●) fixed in top-right corner
- ~16px diameter on mobile, ~20px on desktop

**Motion:**
- **During scroll:** Gentle pulse (opacity 0.7 → 1.0 → 0.7) at 2s interval
- **Scroll stops:** Solid state (opacity 1.0)—locked shot
- **Section change:** Brief blink (opacity 1.0 → 0 → 1.0) over `brand-micro` (175ms)

**Pros:** Maximum restraint, doesn't compete with content, very documentary
**Cons:** Less visually distinctive

### Option B: Viewfinder HUD

More complex—the badge acts as functional camera UI showing context.

**Visual:**
- Contains timecode (00:45 / 02:00) representing scroll progress
- Focus brackets [ ] that animate on beat transitions
- Brief "REC" flash on section change
- Altitude marker (▲ 4,100m) that updates per section

**Motion:**
- Badge position: fixed top-right, never moves
- Internal elements: update with `brand-micro` crossfades
- Focus brackets: animate inward on beat lock (scale 1.1 → 1.0), outward on release

**Pros:** Provides wayfinding, reinforces camera metaphor strongly
**Cons:** More implementation complexity, could feel gimmicky

---

## Portal Zoom Values

Standard scale values for iris/portal transitions:

| Transition | From | To | Duration |
|------------|------|------|----------|
| Zoom into content | 0.8 | 1.0 | `brand-cinematic` (550ms) |
| Zoom out from content | 1.0 | 0.85 | `brand-cinematic` (550ms) |
| Portal mask diameter | 0% viewport | 100% viewport | `brand-cinematic` (550ms) |
| Push-in (hover/focus) | 1.0 | 1.04 | `brand-standard` (315ms) |

---

## Reduced Motion Fallback

When `prefers-reduced-motion: reduce` is detected:

| Normal Behavior | Reduced Motion Behavior |
|-----------------|------------------------|
| Portal zoom | Instant cut (opacity 1 → 0 → 1) |
| Scan line wipe | Instant crossfade |
| Shutter blink | Instant swap (no black frame) |
| Metadata crossfade | Instant swap |
| Scale animations | Removed entirely |
| Opacity transitions | Preserved (less problematic) |

All state changes still occur—only the animated transitions are removed.