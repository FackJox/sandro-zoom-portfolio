/**
 * GET /api/instagram/feed
 *
 * Returns recent Instagram posts for display on the site.
 * Caches response for 1 hour to minimize API calls.
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { fetchInstagramFeed, type InstagramFeedResponse } from '$lib/api/instagram'
import { env } from '$env/dynamic/private'

const INSTAGRAM_ACCESS_TOKEN = env.INSTAGRAM_ACCESS_TOKEN
const INSTAGRAM_USER_ID = env.INSTAGRAM_USER_ID

export const GET: RequestHandler = async () => {
  // Check for required environment variables
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.warn('[Instagram Feed] Missing environment variables')
    return json(
      { posts: [], cachedAt: new Date().toISOString(), error: 'Not configured' },
      {
        status: 200, // Return 200 with empty array for graceful degradation
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  }

  try {
    const posts = await fetchInstagramFeed(INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID, 15)

    const response: InstagramFeedResponse = {
      posts,
      cachedAt: new Date().toISOString(),
    }

    return json(response, {
      headers: {
        // Cache for 1 hour, allow stale content for 24 hours while revalidating
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[Instagram Feed] Error fetching posts:', error)

    // Return empty array for graceful degradation
    return json(
      {
        posts: [],
        cachedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 200, // Still 200 so component can handle gracefully
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300', // Shorter cache on error
        },
      }
    )
  }
}
