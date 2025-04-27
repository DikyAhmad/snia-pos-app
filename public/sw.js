// Service Worker for PWA: cache gambar (cache-first) & data API (network-first)
const CACHE_NAME = 'snia-pos-cache-v2';
const API_CACHE = 'api-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Tambahkan asset statis lain jika perlu
];

// Install: cache asset statis
self.addEventListener('install', event => {
  self.skipWaiting(); // Force waiting SW to become active
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => ![CACHE_NAME, API_CACHE, IMAGE_CACHE].includes(key))
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: strategi cache gambar & data API
self.addEventListener('fetch', event => {
  const { request } = event;

  // Force update PWA if new SW is available
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Jika SW baru, reload otomatis
          if (self.registration.waiting) {
            self.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache gambar (cache-first)
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;
        const networkResponse = await fetch(request);
        // Only cache images < 500 KB
        const contentLength = networkResponse.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 500 * 1024) {
          return networkResponse;
        }
        await cache.put(request, networkResponse.clone());
        // Limit cache size to 50 images
        const keys = await cache.keys();
        if (keys.length > 50) {
          await cache.delete(keys[0]); // Hapus gambar paling lama
        }
        return networkResponse;
      })
    );
    return;
  }

  // Cache data API (network-first, fallback to cache)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          return caches.open(API_CACHE).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() =>
          caches.open(API_CACHE).then(cache => cache.match(request))
        )
    );
    return;
  }

  // Default: cache-first untuk asset lain
  event.respondWith(
    caches.match(request).then(response => response || fetch(request))
  );
});
