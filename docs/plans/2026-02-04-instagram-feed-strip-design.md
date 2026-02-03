# Instagram Feed Strip Design

## Overview

Add a horizontal scrolling Instagram feed strip to the contact/footer area of Sandro's portfolio. Displays recent posts from @sandro.g.h as a "follow for more" element that drives Instagram engagement.

## Decisions

| Question | Decision |
|----------|----------|
| Location | Contact/footer area |
| Display format | Horizontal scroll strip, 4-6 visible at a time |
| Click behavior | Opens post directly on Instagram |
| Data source | Instagram Basic Display API with auto-refresh |
| Hosting | Existing Vercel project (free tier) |

## Visual Treatment

### Container
- Full-bleed dark band (`#20292b` Black Pearl surface)
- Subtle top border (1.5px `#707977` Phantom)
- Vertical padding: `clamp(48px, 8vh, 80px)`

### Posts
- Square aspect ratio (1:1)
- Hard-edged frames, 0 border-radius
- 1.5px border in Phantom (`#707977`)
- Hover: border changes to Egg Toast (`#f6c605`), subtle scale 1.02
- Subtle grain overlay on images
- Gap: 1.5rem desktop, 1rem mobile

### Header Row
- Left: Section label "FIELD" in condensed uppercase
- Right: "FOLLOW @SANDRO.G.H" link in Egg Toast with arrow

### Scroll Behavior
- CSS scroll-snap: `x mandatory`
- Desktop: ~4.5 posts visible (half-post hints at more)
- Mobile: ~2.5 posts visible
- Smooth scroll with momentum

## API Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Facebook Developer App                                 │
│  └─ Instagram Basic Display product                     │
│  └─ Sandro authorizes → initial long-lived token        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Vercel Environment Variables                           │
│  └─ INSTAGRAM_ACCESS_TOKEN                              │
│  └─ INSTAGRAM_USER_ID                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  API Routes                                             │
│  └─ GET /api/instagram/feed    → returns 15 posts       │
│  └─ GET /api/instagram/refresh → refreshes token        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Vercel Cron                                            │
│  └─ Daily at 3:00 UTC                                   │
│  └─ Calls /api/instagram/refresh                        │
└─────────────────────────────────────────────────────────┘
```

### Caching Strategy
- Feed endpoint: 1 hour cache (Cache-Control + SWR)
- Reduces API calls, keeps site fast
- Instagram rate limit: 200 calls/hour (plenty of headroom)

### Token Refresh Logic
- Long-lived tokens expire in 60 days
- Cron runs daily, checks if token expires in <10 days
- If expiring soon, calls Instagram refresh endpoint
- Updates Vercel env var via Vercel API (requires `VERCEL_TOKEN`)

### Fallback Behavior
- If API fails, component renders nothing
- Contact section remains fully functional
- No broken UI states

## File Structure

```
src/
├── lib/
│   └── api/
│       └── instagram.ts              # API client + types
│
├── experience/
│   └── components/
│       └── ui/
│           └── InstagramStrip.svelte # Feed component
│
src/routes/
└── api/
    └── instagram/
        ├── feed/
        │   └── +server.ts            # GET /api/instagram/feed
        └── refresh/
            └── +server.ts            # GET /api/instagram/refresh

vercel.json                           # Cron configuration
```

## Data Types

```typescript
interface InstagramPost {
  id: string
  permalink: string           // https://instagram.com/p/xxx
  mediaUrl: string            // CDN image URL
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string           // ISO date
  caption?: string            // Post caption (optional use)
}

interface InstagramFeedResponse {
  posts: InstagramPost[]
  cachedAt: string
}
```

## Implementation Phases

### Phase 1: Instagram App Setup (Manual)
1. Create Facebook Developer account (if needed)
2. Create app → add Instagram Basic Display product
3. Add Sandro as Instagram Tester
4. Sandro accepts tester invite in Instagram settings
5. Complete OAuth flow → get long-lived token
6. Add env vars to Vercel:
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_USER_ID`
   - `VERCEL_TOKEN` (for auto-refresh to update env vars)

### Phase 2: API Routes
1. Create `src/lib/api/instagram.ts` - client + types
2. Create `src/routes/api/instagram/feed/+server.ts`
3. Create `src/routes/api/instagram/refresh/+server.ts`
4. Add cron to `vercel.json`
5. Test with `vercel dev`

### Phase 3: Component
1. Create `InstagramStrip.svelte`
2. Implement horizontal scroll container
3. Style per Alpine Noir design system
4. Add loading skeleton (pulsing Phantom rectangles)
5. Integrate into `ContactSection.svelte`

### Phase 4: Polish
1. Hover animation (border accent, scale 1.02)
2. Test scroll-snap on iOS Safari
3. Verify fallback when API unavailable
4. Grain overlay on images

## Component Behavior

### Loading State
- Show 4-6 skeleton rectangles
- Pulsing animation in Phantom color
- Same dimensions as real posts

### Error State
- Render nothing (graceful degradation)
- Log error to console for debugging
- Contact section unaffected

### Scroll UX
- `scroll-snap-type: x mandatory`
- `scroll-snap-align: start` on each post
- `-webkit-overflow-scrolling: touch` for iOS momentum
- Hide scrollbar but keep functionality

## Integration Point

In `ContactSection.svelte`:

```svelte
<InstagramStrip />

<!-- Existing contact content below -->
<ContactBlock ... />
```

The strip sits above contact info, creating a natural "here's more of my work → now get in touch" flow.
