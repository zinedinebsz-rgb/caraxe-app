/* CARAXES Service Worker — v1.0.0
 * Minimal PWA: app-shell cache + navigation fallback + push notifications
 * Keeps it intentionally simple to avoid staleness issues on a SPA.
 */
const CACHE_VERSION = 'caraxes-v1-2026-04-16';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
];

// INSTALL — pre-cache the minimum app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // ignore individual asset failures during install
      })
    )
  );
  self.skipWaiting();
});

// ACTIVATE — purge old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH — Network-first for HTML, cache-first for static assets.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // passthrough cross-origin

  // Navigation requests → network first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((c) => c.put('/', copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets → cache-first (JS/CSS/images/fonts)
  if (/\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|ico|webp)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          const copy = resp.clone();
          if (resp.status === 200) {
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          }
          return resp;
        }).catch(() => cached);
      })
    );
  }
});

// PUSH — show notification on incoming push event.
self.addEventListener('push', (event) => {
  let payload = { title: 'CARAXES', body: 'Nouvelle notification', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || 'caraxes-default',
    renotify: true,
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// NOTIFICATION CLICK — focus or open a client tab on the right URL.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// MESSAGES — allow the app to trigger a local notification (in-app toast fallback).
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'LOCAL_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    self.registration.showNotification(title || 'CARAXES', {
      body: body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: tag || 'caraxes-local',
      data: { url: url || '/' },
    });
  }
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
