## Design Direction: **ALPINE NOIR**

### The Big Idea

A brand that feels like a controlled fall: precise, cinematic, and permanently one step from the edge.

This is not “outdoorsy content creator” energy. This is high-risk, high-altitude, life-or-death cinematography. The identity should feel like a warning label stamped onto the side of a helicopter.

---

## Visual System

### Typography

**Display**

- **Trade Gothic Next Condensed Bold**
    
    - Tall, compressed, and aggressive—like a warning stencil on mountaineering gear.
        
    - Echoes the reference image: dense yellow type crashing over imagery.
        
    - Excellent for big, minimal wordmarks and oversized titles across stills and reels.
        

**Body**

- **IBM Plex Sans** (Regular / Medium)
    
    - Technical, contemporary, slightly utilitarian—reads like engineering documentation rather than lifestyle fluff.
        
    - Free, well-hinted, and holds up on captions, treatments, and case study decks.
        
    - The tension: _condensed, loud display_ vs _rational, measured body_.
        

---

### Color

We keep the world almost monochrome—cold rock, storm clouds, technical gear—and then slice through it with a single violent yellow.

**Color Roles**

- **Primary – Black Stallion `#0f171a`**
    
    - The base of everything: backgrounds, overlays, key frames.
        
    - Feels like predawn air at 4,000m—near black, but with depth.
        
- **Secondary – Black Pearl `#20292b` / Cover of Night `#464f4c`**
    
    - Used for surfaces, cards, and UI elements.
        
    - Introduces subtle layering without ever feeling “friendly.”
        
- **Accent – Egg Toast `#f6c605`**
    
    - Used with extreme restraint: logotype, key headings, focus states, record indicators.
        
    - This is the “danger” color—think avalanche signs and safety harnesses.
        

Support tones (sparingly):

- **Phantom `#707977` / Walrus `#939c9a` / Tradewind `#b7c6cc` / Silverplate `#c0bfb6`**
    
    - For metadata, grids, and subtle map/topographic elements.
        

---

### Motion

**Timing**

- Core UI: **220–260ms** `cubic-bezier(0.19, 1, 0.22, 1)` — mimics the feeling of a stabilized camera move easing to a stop.
    
- Hero transitions (reel cuts, project case studies): **400–600ms** with hard cuts rather than crossfades.
    

**Character**

- Motion behaves like a camera, not like UI:
    
    - **Pans**: horizontal reveals between frames/sections.
        
    - **Push-ins**: subtle scale from 1.0 → 1.04 on hover for key thumbnails, simulating a lens creep.
        
    - **Snaps**: no bouncy easing; everything lands with confidence, as if locked on a tripod.
        

---

## Brand System Template

### Keywords

- High-altitude
    
- Cinematic risk
    
- Controlled danger
    
- Tactical precision
    
- Alpine noir
    
- Documentary grit
    

---

### Tokens

- **Grid**: 12-column, with brutal margins (min 32px on mobile, 96px+ on desktop) to let imagery breathe.
    
- **Corner radius**: 0–4px max. This is metal and rock, not an app for wellness.
    
- **Stroke weight**: 1.5px for UI lines and keylines, drawn from technical schematics.
    
- **Noise**: Subtle grain overlays on hero imagery to reference high-ISO footage.
    

---

### Colours

|Role|Name|Hex|
|---|---|---|
|Primary|Black Stallion|#0f171a|
|Accent|Egg Toast|#f6c605|
|BG|Black Stallion|#0f171a|
|Surface|Black Pearl|#20292b|
|Text|Silverplate|#c0bfb6|

Support / Utility (documented in spec, not main swatch):

- Cover of Night `#464f4c`
    
- Phantom `#707977`
    
- Walrus `#939c9a`
    
- Tradewind `#b7c6cc`
    

---

### Typography

|Usage|Family|Use For|
|---|---|---|
|Display|Trade Gothic Next Condensed Bold|Logo, headlines, numeric altitude badges, section titles|
|Body|IBM Plex Sans|Body copy, captions, treatments, credits, UI labels|

Headline styling: all caps, tight tracking (-5 to -20), strong optical margin alignment.  
Body styling: sentence case, generous line-height (1.5–1.6), compact paragraphs.

---

### Logo

Assuming the DP’s name, e.g. **“[NAME] / HIGH ALTITUDE DP”** as the core mark.

|Aspect|Specification|
|---|---|
|Primary lockup|Name in Trade Gothic Next Condensed Bold ALL CAPS, in Egg Toast, stacked over a thin Silverplate line with descriptor “HIGH ALTITUDE DIRECTOR OF PHOTOGRAPHY” in IBM Plex Sans|
|Alternatives|1) Horizontal: name left, descriptor right; 2) Icon-only: stylised altitude marker / triangle with a single “frame” line cutting through|
|Clearspace / min size|Clearspace = height of the “H” in the wordmark on all sides. Minimum digital width ≈ 120px; below that, switch to icon-only.|
|Common lockups|**Horizontal** (website header, lower-thirds) / **Stacked** (posters, cover frames) / **Icon-only** (social avatars, corner bug on footage)|

Logo motif:

- Integrate a **1.85:1 or 2.39:1 frame line** into the mark (thin rectangle suggesting cinema aspect ratio) that can be reused as a framing device across the system.
    
- A small altitude marker “▲ 4,100m” as a recurring secondary mark.
    

---

### Illustration & Icon Style

|Property|Value|
|---|---|
|Stroke|1.5px, squared terminals, no rounded corners|
|Fill|Mostly stroke-only; fills reserved for Egg Toast highlights|
|Palette|Silverplate, Phantom, Egg Toast|
|Detail level|Low–medium: think technical diagram, not comic illustration|

Icon themes:

- Altitude markers, contour lines, weather symbols, lens focal length icons (35mm, 50mm, 135mm)
    
- Rope, carabiner, drone silhouette, helicopter rotor reduction—all rendered as flat, linear icons.
    

---

### Layout Patterns

|Element|Pattern|
|---|---|
|Hero|Full-bleed still or short looping clip. Oversized Egg Toast headline set dead-center or brutally left-aligned on the lower third. Black Stallion gradient overlay from bottom for legibility. Tiny metadata row (altitude, location, lens) in Phantom along bottom edge.|
|Sections|Clear horizontal bands alternating between Black Stallion and Black Pearl. Section titles in condensed display, flanked by a thin line (like a frame marker). Generous whitespace; each section feels like a separate “sequence.”|
|Cards|Hard-edged, no drop shadows—separation via contrast only. Top third reserved for still/frame, bottom for title + 2 lines of copy + metadata (lens, fps, altitude). Hover: slight push-in on the image and a frame line animating in.|
|Buttons & CTAs|Rectangular, 0–2px radius. Primary: Egg Toast fill with Black Stallion text. Secondary: outline only in Egg Toast on dark background. Hover: background darkens subtly; border/frame “clicks” in 1px thicker, referencing punching record.|

---

### The Differentiation Test

**What they remember in 24 hours:**  
The work looks like it’s been stamped out of helicopter metal—almost entirely black and steel—with one brutal strip of hazard yellow typography shouting over mountain footage that feels one slip away from disaster.

