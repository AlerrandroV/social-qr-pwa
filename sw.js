const CACHE_NAME = 'social-qr-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/whatsapp.svg',
  '/icons/telegram.svg',
  '/icons/instagram.svg',
  '/icons/facebook.svg',
  '/icons/messenger.svg',
  '/icons/x.svg',
  '/icons/snapchat.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle share target — serve the app shell
  if (url.pathname === '/' && url.searchParams.has('text') || url.searchParams.has('url') || url.searchParams.has('title')) {
    event.respondWith(
      caches.match('/index.html').then((r) => r || fetch('/index.html'))
    );
    return;
  }

  // Cache-first for local assets
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return resp;
      }))
    );
    return;
  }

  // Network-first for CDN (qr-code-styling, material web)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
