// Auto-unregistering service worker - clears all old caches
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] All caches cleared, unregistering...');
      return self.registration.unregister();
    })
  );
});

// Do not cache ANYTHING - pass all requests through to network
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
