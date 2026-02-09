# UX Friction Audit: Sandro Gromen-Hayes Portfolio

## Executive Summary

This is a **high-craft, cinematic portfolio** with strong visual design and mostly solid interactions. The site flows well for the "lean back and scroll" experience it's designed for. However, there are friction points across three main areas:

1. **Empty/dead zones** in scroll progression create confusion about whether content is loading or missing
2. **Reduced motion preferences are detected but never applied** - a significant accessibility gap
3. **Mixed interaction affordances** - some clickable things don't look clickable, some external links don't signal they leave the site

---

## Overall Flow & Structure Audit

### Section Order: Hero > Showreel > Film > About (x3) > Services > Contact

| Section | Duration | Scroll Range | Verdict |
|---------|----------|-------------|---------|
| Hero + Showreel | 16s (1040px) | 0-1040 | Good opening. Dual-state within one scene is clever |
| Film Overview | 36s (2340px) | 1040-3380 | Longest section. 4 films x 9s cycle works but is a LOT of scroll |
| About #1 | 8s (520px) | 3380-3900 | Good pacing after film's density |
| About #2 | 8s (520px) | 3900-4420 | Consistent rhythm |
| About #3 | 8s (520px) | 4420-4940 | Wraps up the personal narrative |
| Services | 12s (780px) | 4940-5720 | Feels sparse compared to prior sections |
| Contact | 12s (780px) | 5720-6500 | Clean closer |

**Total scroll: 6500px across 7 scenes (~100 seconds at 65px/s)**

### Flow Friction Points

**F1. The Film section is disproportionately long (36% of total scroll).** A user who isn't interested in watching each film detail must scroll through 2340px of content to reach "About Me." This is the single biggest pacing issue. The section works well if you engage with it (clicking films, watching videos), but for a "skim through" visitor, it's a wall.

**F2. Dead zones between transitions.** At scroll position ~1200px (entering Film), the viewport shows an almost-empty screen - just "FILM" label, step indicator dots, and a dark void for ~300px of scrolling before content appears. This creates a "did it break?" moment.

**F3. No way to skip sections without the nav menu.** The scroll hint says "SCROLL" but there's no visual hint that the hamburger menu enables section jumping. First-time visitors who want to jump to Contact must scroll the entire 6500px.

**F4. Transition zones feel like wasted space.** The portal zoom transitions (~160px each) create moments where content is scaling/fading and nothing is readable. This is aesthetically interesting on first visit but adds friction on repeat visits.

---

## Section-by-Section Audit

### Scene 0: Hero + Showreel (0-1040px)

**What works well:**
- Branded loading experience - logo visible immediately during video load
- The topo-map texture inside the "sandro" logo is distinctive and memorable
- Client logos (Netflix, BBC, RedBull, etc.) establish credibility instantly
- "HIGH ALTITUDE & HOSTILE ENVIRONMENT" clearly communicates the niche
- Video desaturated-to-color transition is a beautiful scroll-driven reveal

**Friction points:**

| ID | Issue | Severity | Type |
|----|-------|----------|------|
| H1 | **Scroll hint persists forever** - Still pulsing at bottom even as user is actively scrolling through the showreel state. Should disappear after first scroll. | Medium | Visual noise |
| H2 | **"SHOWREEL" label appears at scroll=0** - In the first screenshot at the top, the section label already said "SHOWREEL" rather than showing nothing or "HOME". The hero state has no distinct section label of its own. | Low | Naming |
| H3 | **Supporting text readability** - The description text below "HIGH ALTITUDE & HOSTILE ENVIRONMENT" is small, light gray on a moving video background. Contrast depends on which video frame is showing. | Medium | Readability |
| H4 | **No CTA button** - After the logos bar there's no "View my work" or "Watch showreel" button. The only call to action is the generic "SCROLL" hint. For visitors who land here from a Google search, there's no obvious next step beyond scrolling. | Medium | Conversion |

---

### Scene 1: Film Overview (1040-3380px)

**What works well:**
- The 60/40 focus layout (video left, content slab right) is excellent for desktop
- Step indicator at bottom provides clear "you are here" context
- GSAP Flip transitions between overview and focus modes are buttery smooth
- Content slabs have good information density (eyebrow, title, description, year)

**Friction points:**

| ID | Issue | Severity | Type |
|----|-------|----------|------|
| FO1 | **Empty viewport on entry (~300px dead zone)** - After the transition from Showreel, the Film section shows a near-empty dark screen with only the step indicator dots before cards appear. User sees "FILM" label + dots but no content for 2-3 scroll ticks. | High | Dead zone |
| FO2 | **Mixed video behaviors are confusing** - 14 Peaks opens a YouTube embed in-place. No Days Off opens an external RedBull link in a new tab. Grace and Afghanistan play inline. There's no visual indicator of what will happen when you press play. | High | Affordance |
| FO3 | **Scroll-driven film cycling vs. click navigation conflict** - Scrolling automatically cycles through all 4 films sequentially. But you can also click a card to jump to it. If you click film 3 while scrolled to film 1's position, the scroll position and the visual state become misaligned until the user scrolls to "catch up." | Medium | State confusion |
| FO4 | **Step indicator dots are redundant** - Cards are already clickable. Dots below duplicate the same navigation. This adds cognitive load (two systems to understand) without benefit. | Low | Redundancy |
| FO5 | **No external link indicator on "No Days Off"** - Clicking play opens redbull.com in a new tab with no warning icon or "opens externally" tooltip. User loses context. | High | Affordance |

---

### Scenes 2-4: About Me (3380-4940px)

**What works well:**
- Ken Burns effect on background images adds life without being distracting
- 3-beat structure (Frontline / Origin / Values) is a natural narrative arc
- Content slabs appear at 40% scroll - gives user time to absorb the image first
- One-shot animation (content doesn't reverse on scroll-up) prevents flashing
- Dot indicators at bottom (1 of 3, 2 of 3, 3 of 3) communicate progression

**Friction points:**

| ID | Issue | Severity | Type |
|----|-------|----------|------|
| A1 | **Content slab positioning competes with imagery** - The right-aligned content slab sometimes overlaps the most interesting part of the background photo. In the helicopter/mountain shot, the slab covers part of the mountain peak. | Medium | Layout conflict |
| A2 | **Text wall in content slabs** - Each beat has a single paragraph of ~50-80 words with no formatting. No bold, no line breaks, no pull quotes. On desktop, this reads as a gray block of text against a dark translucent background. | Medium | Readability |
| A3 | **No link in "Values + Ongoing Work"** - The text mentions "my Youtube channel" but it's not a clickable link. User has to go find it themselves. | High | Missing affordance |
| A4 | **Beat indicators not clickable** - The 3 dots at the bottom show progress but don't allow clicking to jump between beats. Unlike the Film section's step indicator, these are display-only. | Low | Inconsistency |

---

### Scene 5: Services (4940-5720px)

**What works well:**
- Clean, minimalist layout with yellow-bordered cards
- Shutterstock link is properly indicated with external arrow icon
- Clear hierarchy - 4 services stacked vertically

**Friction points:**

| ID | Issue | Severity | Type |
|----|-------|----------|------|
| S1 | **Cards look interactive but aren't** - Yellow-bordered cards with hover-like styling (matching Film section cards) create an expectation that they're clickable. Only the Shutterstock card has a link. The other 3 are dead-end labels. | High | False affordance |
| S2 | **Section feels sparse/anticlimactic** - After the rich imagery of About Me, dropping into a plain dark screen with 4 text-only cards feels like a landing page draft rather than a finished section. No supporting imagery, no examples of work in each service category. | Medium | Visual weight |
| S3 | **"EXPED & PRODUCT PHOTOGRAPHY" abbreviation** - "Exped" (expedition) isn't a common abbreviation. International visitors or non-outdoor-industry people may not parse this. | Low | Clarity |
| S4 | **Scroll hint reappears** - After being absent through Film and About, the "SCROLL" hint returns in Services. Inconsistent - user has already proven they know how to scroll by reaching this point. | Medium | Noise |

---

### Scene 6: Contact (5720-6500px)

**What works well:**
- "If you have a story to tell please get in touch." - warm, inviting CTA copy
- Phone and email are proper `tel:` and `mailto:` links - will open dialer/email client on mobile
- Background image with Ken Burns adds visual interest without competing with contact info
- Footer is minimal and clean

**Friction points:**

| ID | Issue | Severity | Type |
|----|-------|----------|------|
| C1 | **Phone/email don't look like links** - They're styled in the same muted gray as body text. No underline, no hover color change visible. User might not realize they can click/tap them. | High | Affordance |
| C2 | **Instagram strip not visible** - At scroll position 6000, the Instagram feed strip isn't visible. It may be below the fold or failing to load silently. The code has no error state for API failure - it just shows nothing. | High | Silent failure |
| C3 | **No social media links** - Beyond the Instagram strip (which may not render), there's no LinkedIn, YouTube, Vimeo, or IMDb link. For a filmmaker's portfolio, these are expected touchpoints for potential clients researching credibility. | Medium | Missing content |

---

### Navigation Menu

**What works well:**
- Brutalist yellow slab design is bold and on-brand
- 5 clear items (SHOWREEL, FILM, ABOUT, SERVICES, CONTACT)
- Background blur creates visual separation
- Current section highlighted (inverted colors)
- Closes on Escape, backdrop click, scroll, and X button (4 close methods)
- Touch targets exceed 44px minimum

**Friction points:**

| ID | Issue | Severity | Type |
|----|-------|----------|------|
| N1 | **No focus trap** - When menu is open, Tab key can escape to page elements behind the blurred backdrop. | Medium | Accessibility |
| N2 | **No focus restoration** - After closing menu, focus doesn't return to the hamburger button. | Medium | Accessibility |
| N3 | **Arrow key navigation missing** - Can't use Up/Down arrows to move between menu items. Only Tab works. | Low | Keyboard nav |
| N4 | **Stagger animation adds ~250ms delay** - Menu items animate in from alternating sides. On slow devices this could feel laggy. On repeat opens it feels slower than necessary. | Low | Performance feel |

---

## Accessibility Audit

### Critical Finding: Reduced Motion Ignored

The codebase **detects** `prefers-reduced-motion: reduce` via `detectReducedMotion()` in `experience.svelte.ts`, but **no component checks this value**. Users who explicitly request reduced motion still receive:
- All entrance animations (staggered fade/rise)
- Ken Burns background effects
- Portal zoom transitions
- Film card cycling animations
- Content slab slide-in animations

**This is the single biggest accessibility issue in the site.**

### Other Accessibility Gaps

| Issue | Severity |
|-------|----------|
| No skip-to-content link | Medium |
| Section labels are visual-only (`<div>` not `<h2>`) - no heading hierarchy | Medium |
| Film thumbnails lack descriptive `alt` text beyond poster fallback | Low |
| Nav menu has no `aria-modal` or focus trap | Medium |
| Color contrast is generally good (yellow on dark passes AA) | Pass |
| Phone/email links are semantic (`<a href="tel:">`) | Pass |
| Film cards have `role="button"` + `tabindex="0"` + `aria-label` | Pass |

---

## Friction Matrix (Prioritized)

| # | Issue | Users Affected | Severity | Fix Difficulty | Priority |
|---|-------|---------------|----------|----------------|----------|
| 1 | Reduced motion completely ignored | ~10% of users | 9/10 | Medium | **CRITICAL** |
| 2 | Film dead zone on entry (FO1) | 100% | 7/10 | Easy | **HIGH** |
| 3 | Mixed video behaviors with no indicator (FO2, FO5) | ~70% who click play | 7/10 | Easy | **HIGH** |
| 4 | Services cards look clickable but aren't (S1) | ~60% | 6/10 | Easy | **HIGH** |
| 5 | Phone/email don't look like links (C1) | ~40% on desktop | 6/10 | Easy | **HIGH** |
| 6 | YouTube link missing in About (A3) | ~30% | 5/10 | Easy | **HIGH** |
| 7 | Instagram strip silent failure (C2) | Variable | 6/10 | Medium | **MEDIUM** |
| 8 | Scroll hint never disappears (H1, S4) | 100% | 4/10 | Easy | **MEDIUM** |
| 9 | No skip-to-content or heading hierarchy | ~5% (screen readers) | 5/10 | Easy | **MEDIUM** |
| 10 | Nav menu focus trap missing (N1, N2) | ~5% keyboard users | 5/10 | Medium | **MEDIUM** |
| 11 | Content slab text walls (A2) | ~50% | 3/10 | Easy | **LOW** |
| 12 | Film section disproportionately long (F1) | ~30% skimmers | 4/10 | Hard | **LOW** |
| 13 | About beat dots not clickable (A4) | ~20% | 2/10 | Easy | **LOW** |
| 14 | No hero CTA button (H4) | ~25% | 3/10 | Easy | **LOW** |

---

## Quick Wins (Immediate Fixes)

1. **Hide scroll hint after first scroll event** - Add a scroll listener that fades it out
2. **Add external link icons** to "No Days Off" play button and YouTube mention in About
3. **Make phone/email visually link-like** - Add underline on hover, slight color shift
4. **Make the YouTube channel mention a real `<a>` link** in About beat 3
5. **Remove cursor:pointer from non-linked service cards** or add links to portfolio examples
6. **Add `prefers-reduced-motion` check** to the main animation composer - skip or simplify animations when set

---

## User Journey Simulation: First-Time Visitor (Portfolio Reviewer)

```
TIME    ACTION                              COGNITIVE STATE              FRICTION
─────────────────────────────────────────────────────────────────────────────────
0:00    Lands on hero                       "Striking logo + video"       Low
        └─ Sees "sandro" logo, mountains
        └─ Reads "HIGH ALTITUDE & HOSTILE ENVIRONMENT"
        └─ Sees Netflix, BBC logos -> credibility established

0:05    Sees SCROLL hint, starts scrolling  "What's next?"                Low
        └─ Video color reveal feels premium

0:12    Enters Film section                 "FILM label... but empty?"    HIGH
        └─ 300px of near-empty dark screen
        └─ PROBLEM: "Is it loading? Did it break?"

0:18    Film cards appear                   "Ah, 4 films to browse"       Low
        └─ 14 Peaks auto-focuses, sees Netflix branding

0:45    Scrolls through 4 film cycles       "A lot of scrolling here"     Medium
        └─ Content is good but section feels long
        └─ Some users may click nav to skip ahead

1:20    Reaches About Me                    "Beautiful imagery"            Low
        └─ Mountain helicopter photo grabs attention
        └─ Text slab appears with personal story

1:50    Reaches Services                    "Wait, that's it?"             Medium
        └─ Visual drop-off from rich imagery to sparse cards
        └─ Tries to click "MOUNTAIN DOP" -> nothing happens

2:00    Reaches Contact                     "Good, email right there"      Low
        └─ Might not realize phone/email are clickable
        └─ Looks for social links, doesn't find them easily

TOTAL TIME: ~2 minutes
FRICTION POINTS: 4 (dead zone, long film, sparse services, link affordances)
ABANDONMENT RISKS: 2 (film dead zone, services anticlimax)
DELIGHT MOMENTS: 3 (hero reveal, video color transition, mountain photography)
```

---

## Positive UX Patterns

- **Branded loading experience** - Logo visible immediately builds trust
- **Smart video loading** - 3-tier strategy (poster -> preview -> full) balances performance + UX
- **Touch-first design** - Buttons exceed 44px minimum, spacing generous
- **Visual feedback everywhere** - Hover states, active indicators, borders change
- **Smooth scroll animation** - scroll-to behavior uses GSAP for 0.5s ease, not instant
- **Responsive layouts** - Desktop/tablet/mobile explicitly designed
- **Keyboard support present** - Escape, Space/Enter work as expected
- **Color contrast** - Yellow (#f6c605) on dark (#0f171a) background passes WCAG AA
- **Semantic HTML where it matters** - Links use proper protocols (tel:, mailto:)
- **Clear visual hierarchy** - Yellow text/borders indicate interactive elements

---

This portfolio is **80% excellent** - the visual craft, animation quality, and brand identity are genuinely impressive. The remaining 20% is UX polish that would elevate it from "beautiful creative showcase" to "beautiful creative showcase that converts visitors into clients." The highest-impact fixes are all relatively easy to implement.
