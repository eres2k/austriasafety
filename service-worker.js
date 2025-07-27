// Service Worker for Aurora Audit Platform PWA
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'aurora-audit-v1';
const STATIC_CACHE_NAME = 'aurora-static-v1';
const DYNAMIC_CACHE_NAME = 'aurora-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
  'https://identity.netlify.com/v1/netlify-identity-widget.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('Failed to cache static assets:', err))
  );
  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('aurora-') && cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-HTTP(S) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests differently (network first)
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // For static assets, use cache first strategy
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          event.waitUntil(
            fetch(request)
              .then(response => {
                return caches.open(DYNAMIC_CACHE_NAME)
                  .then(cache => {
                    cache.put(request, response.clone());
                    return response;
                  });
              })
              .catch(() => {/* Ignore errors for background update */})
          );
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));

            return response;
          });
      })
      .catch(() => {
        // Offline fallback for HTML pages
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for pending inspections
self.addEventListener('sync', event => {
  if (event.tag === 'sync-inspections') {
    event.waitUntil(syncPendingInspections());
  }
});

async function syncPendingInspections() {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Send message to clients to trigger sync
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED'
      });
    });

    // Note: Actual sync logic is handled in the main app
    // as it needs access to IndexedDB and authentication
    
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Handle messages from the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New inspection update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Aurora Audit', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
