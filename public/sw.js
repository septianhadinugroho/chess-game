const CACHE_NAME = 'chess-master-v2.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/move.mp3',
  '/win.mp3',
  '/lose.mp3'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch - Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response karena stream hanya bisa dibaca sekali
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Push Notification Handler (untuk future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Chess Master';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'chess-notification',
    requireInteraction: false,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Background Sync (untuk future use - sync game state)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-game-state') {
    event.waitUntil(syncGameState());
  }
});

async function syncGameState() {
  // Implement game state sync logic here
  console.log('Syncing game state...');
}