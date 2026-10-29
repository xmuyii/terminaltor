/**
 * Sovereign Academy - Service Worker (Phase 8C)
 * Caching Policy:
 * - App Shell: Precache & stale-while-revalidate
 * - Challenge catalog & test specs: Cache-first
 * - Submissions & sandbox evaluation: Network-only (NEVER cached)
 * - Arcade & WebSockets: Network-only
 * - Leaderboards: Network-first with cache fallback
 */

const CACHE_NAME = 'sovereign-academy-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache submissions, sandbox runs, or webhooks (Network-only)
  if (
    url.pathname.includes('/submissions') ||
    url.pathname.includes('/run') ||
    url.pathname.includes('/webhooks') ||
    event.request.method === 'POST'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Arcade & WebSocket endpoints: Network-only
  if (url.pathname.startsWith('/arcade/ws') || url.pathname.includes('/socket')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Leaderboards: Network-first, fallback to cache
  if (url.pathname.includes('/leaderboards')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Challenges & App Shell: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
