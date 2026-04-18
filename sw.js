// ============================================
// SERVICE WORKER - OFFLINE CACHE
// ============================================

const CACHE_NAME = 'butajira-shop-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/database.js',
  './js/translations.js',
  './js/auth.js',
  './js/users.js',
  './js/admin.js',
  './js/products.js',
  './js/sales.js',
  './js/scanner.js',
  './js/reports.js',
  './js/backup.js',
  './js/app.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/pouchdb@7.3.0/dist/pouchdb.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Fetch from cache first (offline-first)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});