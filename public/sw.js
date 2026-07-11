/**
 * Keepsake service worker — makes the app installable and lets it open
 * offline (NFR-17). Strategy: network-first for same-origin requests with
 * a cache fallback, so updates arrive normally but the app still opens
 * with no connection.
 *
 * IMPORTANT (billing safety / privacy): requests to any other origin —
 * including api.anthropic.com and YouTube — are never intercepted or cached.
 */
const CACHE = 'keepsake-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Only handle same-origin GETs. AI calls, fonts-from-cdn (there are none),
  // and YouTube embeds pass straight through untouched.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of every good same-origin response for offline use.
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ||
            // Deep links while offline: fall back to the app shell.
            caches.match('./index.html')
        )
      )
  )
})
