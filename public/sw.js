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
    )
  );
});

// Fetch: strategi cache gambar & data API
self.addEventListener('fetch', event => {
  const { request } = event;

  // Cache gambar (cache-first)
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(response =>
          response || fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          })
        )
      )
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
