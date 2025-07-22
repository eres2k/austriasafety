// sw.js - Service Worker for offline functionality
const CACHE_NAME = 'whs-audit-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // API calls - network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Offline - try cache
          return caches.match(request)
            .then(response => {
              if (response) {
                console.log('Serving API from cache:', request.url);
                return response;
              }
              // Return offline response for API
              return new Response(
                JSON.stringify({ 
                  offline: true, 
                  message: 'Offline mode - data will sync when connection restored' 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' },
                  status: 503 
                }
              );
            });
        })
    );
    return;
  }

  // Static resources - cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
            return response;
          });
      })
      .catch(() => {
        // Offline fallback page
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline audits
self.addEventListener('sync', event => {
  if (event.tag === 'sync-audits') {
    event.waitUntil(syncAudits());
  }
});

async function syncAudits() {
  try {
    // Get pending audits from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending_audits', 'readonly');
    const store = tx.objectStore('pending_audits');
    const request = store.getAll();
    
    const pendingAudits = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    for (const audit of pendingAudits) {
      try {
        const response = await fetch('/api/audits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': audit.token
          },
          body: JSON.stringify(audit.data)
        });
        
        if (response.ok) {
          // Remove from pending after successful sync
          const deleteTx = db.transaction('pending_audits', 'readwrite');
          await deleteTx.objectStore('pending_audits').delete(audit.id);
        }
      } catch (error) {
        console.error('Failed to sync audit:', audit.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Helper to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WHSAuditDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_audits')) {
        db.createObjectStore('pending_audits', { keyPath: 'id' });
      }
    };
  });
}
