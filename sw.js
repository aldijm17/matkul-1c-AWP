importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = "jadwal-cache-v1";
const urlsToCache = [
  "./",            // index.html
  "./index.html",
  "./manifest.json",
  "./icon-192x192.png",
  "./icon-512x512.png"
];

// Background sync untuk notifikasi yang lebih andal
workbox.backgroundSync.Queue('notifications-queue', {
    maxRetentionTime: 24 * 60 // 24 jam
});

workbox.routing.registerRoute(
    /.*\/notifications\/.*/,
    new workbox.strategies.NetworkOnly({
        plugins: [
            new workbox.backgroundSync.BackgroundSyncPlugin('notifications-queue', {
                maxRetentionTime: 24 * 60
            })
        ]
    }),
    'POST'
);

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Fokus pada aplikasi jika sudah terbuka, atau buka aplikasi
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});

// Install SW dan simpan cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate SW
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch offline support
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Klik notifikasi (kalau ada notifikasi)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("./"));
});
