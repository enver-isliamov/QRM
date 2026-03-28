const CACHE_NAME = 'oraza-v4';
const STATIC_CACHE = 'oraza-static-v4';
const API_CACHE = 'oraza-api-v4';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC_CACHE).then(c => c.addAll(urlsToCache))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(n => {
        if (n !== STATIC_CACHE && n !== API_CACHE) {
          return caches.delete(n);
        }
      }))
    )
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Cache Supabase API requests (Network First, fallback to Cache)
  if (url.hostname.includes('supabase.co') && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(API_CACHE).then(cache => cache.put(e.request, resClone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache static assets (Cache First, fallback to Network)
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(response => {
        // Cache dynamically fetched static assets (js, css, woff2, etc)
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(e.request, resClone));
        }
        return response;
      });
    })
  );
});

self.addEventListener('push', function(event) {
  let data = { title: 'ORAZA', body: 'Новое уведомление', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: data.url || '/',
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
