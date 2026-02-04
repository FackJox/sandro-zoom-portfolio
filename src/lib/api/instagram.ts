/**
 * Instagram API client (Instagram Login for Business/Creator accounts)
 *
 * Uses the Instagram API with Instagram Login - the replacement for the
 * deprecated Basic Display API. Works with Business and Creator accounts.
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 *
 * Required permissions: instagram_business_basic
 *
 * Env vars:
 * - INSTAGRAM_ACCESS_TOKEN: Long-lived access token (60 days, refreshable)
 * - INSTAGRAM_USER_ID: Instagram user ID (numeric)
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstagramPost {
  id: string
  permalink: string
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string
  thumbnailUrl?: string // For VIDEO type only
}

export interface InstagramFeedResponse {
  posts: InstagramPost[]
  cachedAt: string
}

export interface InstagramError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

// -----------------------------------------------------------------------------
// API Client
// -----------------------------------------------------------------------------

// Instagram API with Instagram Login uses graph.instagram.com
const INSTAGRAM_API_BASE = 'https://graph.instagram.com'
const API_VERSION = 'v24.0'

/**
 * Fetch recent media from Instagram API (Business/Creator accounts)
 *
 * Endpoint: GET /{ig-user-id}/media
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started
 *
 * Available fields:
 * - id, media_type, media_url, permalink, thumbnail_url, timestamp, username
 *
 * Note: caption field requires Facebook Login, not available with Instagram Login
 */
export async function fetchInstagramFeed(
  accessToken: string,
  userId: string,
  limit: number = 15
): Promise<InstagramPost[]> {
  // Fields available with instagram_business_basic permission
  const fields = 'id,permalink,media_url,media_type,timestamp,thumbnail_url'
  const url = `${INSTAGRAM_API_BASE}/${API_VERSION}/${userId}/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`

  const response = await fetch(url)

  if (!response.ok) {
    const error = (await response.json()) as InstagramError
    throw new Error(`Instagram API error: ${error.error.message} (code: ${error.error.code})`)
  }

  const data = await response.json()

  return data.data.map((post: Record<string, unknown>) => ({
    id: post.id as string,
    permalink: post.permalink as string,
    // For videos, use thumbnail_url for display; for images, use media_url
    mediaUrl: (post.media_type === 'VIDEO'
      ? (post.thumbnail_url || post.media_url)
      : post.media_url) as string,
    mediaType: post.media_type as InstagramPost['mediaType'],
    timestamp: post.timestamp as string,
    thumbnailUrl: post.thumbnail_url as string | undefined,
  }))
}

/**
 * Refresh a long-lived access token
 *
 * Endpoint: GET /refresh_access_token
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 *
 * Long-lived tokens are valid for 60 days and can be refreshed
 * if they are at least 24 hours old and not expired.
 */
export async function refreshAccessToken(
  accessToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const url = `${INSTAGRAM_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`

  const response = await fetch(url)

  if (!response.ok) {
    const error = (await response.json()) as InstagramError
    throw new Error(`Token refresh error: ${error.error.message} (code: ${error.error.code})`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in, // seconds until expiry (typically 5184000 = 60 days)
  }
}

/**
 * Verify token is still valid by making a lightweight API call
 *
 * Endpoint: GET /me
 */
export async function verifyToken(accessToken: string): Promise<boolean> {
  try {
    const url = `${INSTAGRAM_API_BASE}/${API_VERSION}/me?fields=id,username&access_token=${accessToken}`
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}
