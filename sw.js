const CACHE_NAME = 'mipyme-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/database.js',
  '/js/inventario.js',
  '/js/ventas.js',
  '/js/historial.js',
  '/js/ui.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});