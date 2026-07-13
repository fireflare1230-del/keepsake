/**
 * YouTube helpers, extract a video id from the many URL shapes people
 * paste, and build a privacy-friendly embed URL.
 */

/**
 * Returns the 11-character video id, or null if the input doesn't look
 * like a YouTube link. Accepts watch?v=, youtu.be/, shorts/, embed/,
 * music.youtube.com, and a bare 11-character id.
 */
export function extractVideoId(input: string): string | null {
  const text = input.trim()
  if (!text) return null

  // A bare video id, e.g. "dQw4w9WgXcQ"
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text

  let url: URL
  try {
    url = new URL(text.startsWith('http') ? text : `https://${text}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  }
  if (host.endsWith('youtube.com')) {
    const v = url.searchParams.get('v')
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
    const match = url.pathname.match(/^\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/)
    if (match) return match[2]
  }
  return null
}

/**
 * youtube-nocookie.com keeps tracking cookies out of the app while the
 * song plays, in keeping with the privacy promise (NFR-12).
 */
export function buildEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
}
