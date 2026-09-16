/**
 * Ersona Service Worker
 * Enables offline caching, fast load times, and standalone PWA functionality.
 */

const CACHE_NAME = 'ersona-cache-v1.7.8';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// 1. Install: Precache shell assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[Ersona SW] Precache partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate: Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch strategy:
// - Supabase / API requests: Network only
// - HTML navigation: Network first, fallback to cached index.html (for offline PWA)
// - Static assets (JS/CSS/images/fonts): Cache first / stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Never cache Supabase / R2 upload / external API calls
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('r2.dev') ||
    url.pathname.startsWith('/auth')
  ) {
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Put fresh copy in cache
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Static assets (CSS, JS, fonts, images)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {/* offline, ignore */});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      });
    })
  );
});

// 4. Push Notification Event (Background Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: '🪐 Ersona Task Reminder',
    body: 'You have upcoming tasks that need attention.',
    url: '/workspace'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: data.url || '/workspace' },
    vibrate: [100, 50, 100],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click: focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/workspace';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
