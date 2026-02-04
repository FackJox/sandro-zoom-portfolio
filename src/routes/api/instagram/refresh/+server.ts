/**
 * GET /api/instagram/refresh
 *
 * Refreshes the Instagram access token if it's close to expiring.
 * Called by Vercel cron job daily.
 *
 * Token refresh strategy:
 * 1. Verify current token is still valid
 * 2. Refresh the token (extends by 60 days)
 * 3. Update Vercel environment variable via API
 *
 * Requires:
 * - INSTAGRAM_ACCESS_TOKEN: Current long-lived token
 * - VERCEL_TOKEN: API token for updating env vars
 * - VERCEL_PROJECT_ID: Project ID (available in Vercel dashboard)
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { refreshAccessToken, verifyToken } from '$lib/api/instagram'
import { env } from '$env/dynamic/private'

const INSTAGRAM_ACCESS_TOKEN = env.INSTAGRAM_ACCESS_TOKEN
const VERCEL_TOKEN = env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = env.VERCEL_PROJECT_ID
const CRON_SECRET = env.CRON_SECRET

export const GET: RequestHandler = async ({ request }) => {
  // Verify this is a legitimate cron request (Vercel adds this header)
  const authHeader = request.headers.get('authorization')

  // In production, verify the cron secret if configured
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for required environment variables
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return json({ error: 'INSTAGRAM_ACCESS_TOKEN not configured' }, { status: 500 })
  }

  try {
    // Step 1: Verify current token
    const isValid = await verifyToken(INSTAGRAM_ACCESS_TOKEN)

    if (!isValid) {
      console.error('[Token Refresh] Current token is invalid or expired')
      return json({
        success: false,
        error: 'Current token is invalid - manual intervention required',
        timestamp: new Date().toISOString(),
      })
    }

    // Step 2: Refresh the token
    const { accessToken: newToken, expiresIn } = await refreshAccessToken(INSTAGRAM_ACCESS_TOKEN)

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    console.log(`[Token Refresh] Token refreshed successfully. Expires: ${expiresAt}`)

    // Step 3: Update Vercel environment variable if credentials available
    if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        await updateVercelEnvVar(VERCEL_TOKEN, VERCEL_PROJECT_ID, 'INSTAGRAM_ACCESS_TOKEN', newToken)
        console.log('[Token Refresh] Vercel environment variable updated')

        return json({
          success: true,
          message: 'Token refreshed and environment updated',
          expiresAt,
          timestamp: new Date().toISOString(),
        })
      } catch (vercelError) {
        console.error('[Token Refresh] Failed to update Vercel env:', vercelError)

        // Still successful refresh, just couldn't auto-update
        return json({
          success: true,
          message: 'Token refreshed but env update failed - manual update required',
          newToken: newToken.substring(0, 20) + '...', // Partial for safety
          expiresAt,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // No Vercel credentials - log for manual update
    console.log('[Token Refresh] No Vercel credentials - manual update required')
    console.log(`[Token Refresh] New token (first 20 chars): ${newToken.substring(0, 20)}...`)

    return json({
      success: true,
      message: 'Token refreshed - manual env update required (no VERCEL_TOKEN)',
      expiresAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Token Refresh] Error:', error)

    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

/**
 * Update a Vercel environment variable via the API
 */
async function updateVercelEnvVar(
  vercelToken: string,
  projectId: string,
  key: string,
  value: string
): Promise<void> {
  const baseUrl = 'https://api.vercel.com'

  // First, get the existing env var ID
  const listResponse = await fetch(
    `${baseUrl}/v9/projects/${projectId}/env?key=${key}`,
    {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    }
  )

  if (!listResponse.ok) {
    throw new Error(`Failed to list env vars: ${listResponse.statusText}`)
  }

  const listData = await listResponse.json()
  const envVar = listData.envs?.[0]

  if (envVar) {
    // Update existing env var
    const updateResponse = await fetch(
      `${baseUrl}/v9/projects/${projectId}/env/${envVar.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      }
    )

    if (!updateResponse.ok) {
      throw new Error(`Failed to update env var: ${updateResponse.statusText}`)
    }
  } else {
    // Create new env var
    const createResponse = await fetch(
      `${baseUrl}/v9/projects/${projectId}/env`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target: ['production', 'preview'],
        }),
      }
    )

    if (!createResponse.ok) {
      throw new Error(`Failed to create env var: ${createResponse.statusText}`)
    }
  }
}
