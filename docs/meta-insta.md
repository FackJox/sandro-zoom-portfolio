# Instagram API Setup Guide

> **Conversation ID:** To resume this conversation in Claude Code, reference the session from 2026-02-04/05 regarding "Instagram feed strip implementation"

## Overview

This guide documents the setup process for integrating Instagram feeds into portfolio sites using the **Instagram API with Instagram Login** (for Business/Creator accounts).

**Note:** The Instagram Basic Display API was deprecated December 4, 2024. This implementation uses the replacement API.

Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login

---

## Current App Credentials

| Field | Value |
|-------|-------|
| App ID | `1218678369805958` |
| App Secret | `401f39bbbd7e531ed9faec158d708060` |
| Redirect URI | `https://sandro-zoom-portfolio.vercel.app/api/instagram/callback` |

> **Security:** Regenerate the App Secret after setup is complete (App Settings → Basic → Reset Secret)

---

## Setup Instructions

### Step 1: Create Meta Developer App

1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Select **Other** → **Business** type
4. Name it (e.g., "Sandro Portfolio")
5. After creation, go to **App Dashboard** → **Add Products** → **Instagram** → **Set Up**

### Step 2: Configure Instagram Login

1. In App Dashboard → **Instagram** → **API setup with Instagram login**
2. Go to section **3. Set up Instagram business login**
3. Note your:
   - **Instagram App ID** (not the main App ID)
   - **Instagram App Secret**
4. Add a **Valid OAuth Redirect URI**:
   ```
   https://sandro-zoom-portfolio.vercel.app/api/instagram/callback
   ```
   (or any URL you can access - even `https://localhost/` works for manual flow)

### Step 3: Add Instagram Tester

1. In App Dashboard → **Roles** → **Instagram Testers**
2. Add the Instagram username
3. **User must accept**: Instagram App → Settings → Website Permissions → Tester Invites

### Step 4: Get Authorization Code

Open this URL in browser (replace values as needed):

```
https://www.instagram.com/oauth/authorize?client_id=1218678369805958&redirect_uri=https://sandro-zoom-portfolio.vercel.app/api/instagram/callback&response_type=code&scope=instagram_business_basic
```

After login and approval, you'll be redirected to:
```
https://sandro-zoom-portfolio.vercel.app/api/instagram/callback?code=AQBx-hBsH3...#_
```

Copy the `code` value (everything between `code=` and `#_`).

### Step 5: Exchange Code for Short-Lived Token

```bash
curl -X POST https://api.instagram.com/oauth/access_token \
  -F 'client_id=1218678369805958' \
  -F 'client_secret=401f39bbbd7e531ed9faec158d708060' \
  -F 'grant_type=authorization_code' \
  -F 'redirect_uri=https://sandro-zoom-portfolio.vercel.app/api/instagram/callback' \
  -F 'code=THE_CODE_FROM_STEP_4'
```

Response:
```json
{
  "access_token": "SHORT_LIVED_TOKEN",
  "user_id": "17841400..."
}
```

**Save both values.**

### Step 6: Exchange for Long-Lived Token

```bash
curl -i -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=401f39bbbd7e531ed9faec158d708060&access_token=SHORT_LIVED_TOKEN"
```

Response:
```json
{
  "access_token": "LONG_LIVED_TOKEN",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

### Step 7: Add to Vercel

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `INSTAGRAM_ACCESS_TOKEN` | The long-lived token from Step 6 |
| `INSTAGRAM_USER_ID` | The user_id from Step 5 |

**Optional (for auto-refresh):**

| Variable | Value |
|----------|-------|
| `VERCEL_TOKEN` | Create at vercel.com/account/tokens |
| `VERCEL_PROJECT_ID` | From Project Settings → General |

---

## Multiple Clients Setup

For two or more client apps with different Instagram accounts:

**Recommended: One Meta App, multiple tokens**

| What you do once | What you repeat per client |
|------------------|---------------------------|
| Create Meta Developer App | Add client as Instagram Tester |
| Configure Instagram Login product | They accept tester invite |
| Set redirect URI | Run OAuth flow (Steps 4-6) |
| | Add their tokens to their Vercel project |

**Per-client steps:**

1. **Add them as Instagram Tester** (App Dashboard → Roles → Instagram Testers)
2. **They accept** in their Instagram Settings → Website Permissions
3. **Generate auth URL** with their login (Step 4)
4. **Exchange for tokens** (Steps 5-6) — each client gets their own unique `access_token` and `user_id`
5. **Add to their Vercel project** with their specific env vars

The tokens are user-scoped, not app-scoped. A single Meta app can serve unlimited Instagram Business/Creator accounts.

---

## Webhooks (Not Required)

For this implementation, **webhooks are not needed**. The feed is fetched via API on page load and cached.

If you see a "Configure webhooks" section in the Meta dashboard, you can skip it. Webhooks are only needed for real-time notifications (new comments, messages, etc.).

---

## Token Refresh

The implementation includes automatic token refresh:

- **Vercel cron job** runs daily at 3:00 UTC
- Calls `/api/instagram/refresh` endpoint
- Refreshes token if valid (extends by 60 days)
- Long-lived tokens must be at least 24 hours old to refresh

See: `vercel.json` for cron configuration, `src/routes/api/instagram/refresh/+server.ts` for refresh logic.

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/api/instagram.ts` | API client + types |
| `src/routes/api/instagram/feed/+server.ts` | Feed endpoint (cached 1hr) |
| `src/routes/api/instagram/refresh/+server.ts` | Token refresh (daily cron) |
| `src/experience/components/ui/InstagramStrip.svelte` | UI component |
| `src/experience/sections/ContactSection.svelte` | Integration point |
| `vercel.json` | Cron configuration |
| `docs/plans/2026-02-04-instagram-feed-strip-design.md` | Design document |

---

## Current Status

- [x] Meta Developer App created
- [x] Instagram Login configured
- [x] Redirect URI set
- [x] Test account added as tester
- [ ] Authorization code obtained
- [ ] Short-lived token exchanged
- [ ] Long-lived token obtained
- [ ] Vercel env vars configured
- [ ] Production test completed

---

## Next Steps

1. Open the authorization URL (Step 4)
2. Copy the `code` from the redirect URL
3. Run the curl commands (Steps 5-6)
4. Add env vars to Vercel
5. Test the feed at `/api/instagram/feed`
6. Verify InstagramStrip displays in ContactSection
