/**
 * CDN Configuration
 *
 * Videos are hosted on Cloudflare R2 for bandwidth efficiency.
 * Update CDN_BASE_URL when migrating to custom domain.
 */

// Cloudflare R2 public URL
// TODO: Update to custom domain (e.g., https://cdn.sandrogh.com) after client approval
export const CDN_BASE_URL = 'https://pub-0cdf1cdad24d410bbe60b2f25638eb89.r2.dev'

// Video paths helper
export const cdnVideo = (path: string) => `${CDN_BASE_URL}/videos/${path}`

// Common video paths
export const VIDEOS = {
  showreel: {
    mp4: cdnVideo('showreel.mp4'),
    webm: cdnVideo('showreel.av1.webm'),
    hevc: cdnVideo('showreel.hevc.mp4'),
    poster: cdnVideo('showreel-poster.webp'),
  },
  grace: {
    mp4: cdnVideo('grace.mp4'),
    webm: cdnVideo('grace.av1.webm'),
    hevc: cdnVideo('grace.hevc.mp4'),
    poster: cdnVideo('grace-poster.webp'),
    preview: {
      mp4: cdnVideo('grace-preview.mp4'),
      webm: cdnVideo('grace-preview.av1.webm'),
      hevc: cdnVideo('grace-preview.hevc.mp4'),
    },
  },
  shwab: {
    mp4: cdnVideo('shwab.mp4'),
    webm: cdnVideo('shwab.av1.webm'),
    hevc: cdnVideo('shwab.hevc.mp4'),
    poster: cdnVideo('shwab-poster.webp'),
    preview: {
      mp4: cdnVideo('shwab-preview.mp4'),
      webm: cdnVideo('shwab-preview.av1.webm'),
      hevc: cdnVideo('shwab-preview.hevc.mp4'),
    },
  },
  netflix: {
    poster: cdnVideo('netflix-poster.webp'),
    preview: {
      mp4: cdnVideo('netflix-preview.mp4'),
      webm: cdnVideo('netflix-preview.av1.webm'),
      hevc: cdnVideo('netflix-preview.hevc.mp4'),
    },
  },
  redbull: {
    poster: cdnVideo('redbull-poster.webp'),
    preview: {
      mp4: cdnVideo('redbull-preview.mp4'),
      webm: cdnVideo('redbull-preview.av1.webm'),
      hevc: cdnVideo('redbull-preview.hevc.mp4'),
    },
  },
} as const
