// NamaSoft POS Service Worker - Offline Mode
const CACHE_NAME = 'namasoft-pos-v2';
const OFFLINE_QUEUE_KEY = 'pos-offline-queue';

const STATIC_ASSETS = [
  '/pos-offline.html',
  '/pos-db.js',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - serve from cache when offline, queue POST requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API POST requests (sales), queue them if offline
  if (event.request.method === 'POST' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        // Offline: queue the request
        const body = await event.request.clone().text();
        const queueItem = {
          id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          url: event.request.url,
          method: event.request.method,
          headers: Object.fromEntries(event.request.headers.entries()),
          body: body,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };

        // Store in IndexedDB via message to client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({ type: 'QUEUE_OFFLINE', data: queueItem });
        });

        return new Response(JSON.stringify({
          offline: true,
          queued: true,
          queueId: queueItem.id,
          message: 'Transaction queued for sync'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For GET requests, try network first, fallback to cache
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).then((response) => {
        // Cache successful API responses for offline use
        if (response.ok && url.pathname.startsWith('/api/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Return offline fallback for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/pos-offline.html');
          }
          return new Response(JSON.stringify({ offline: true, data: [] }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }
});

// Listen for sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'pos-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Background sync
async function syncOfflineQueue() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_START' });
  });
}

// Message handler
self.addEventListener('message', (event) => {
  if (event.data.type === 'SYNC_NOW') {
    syncOfflineQueue();
  }
});
