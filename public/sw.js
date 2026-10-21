const CACHE_NAME = 'alquilibres-v4'

// Precache the app shell so offline navigations still have a fallback page.
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only intercept same-origin GET requests for static assets.
  // API calls and non-GET methods must always reach the network.
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache only successful same-origin responses.
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }
        const clone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return networkResponse
      })
      .catch(() => {
        // Network failed: serve a cached copy when available.
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          // For navigation requests, fall back to the cached shell.
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then((shell) => shell || Response.error())
          }
          return Response.error()
        })
      })
  )
})
