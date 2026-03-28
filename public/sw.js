const CACHE_NAME = 'oraza-v3';
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))
));
self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(r => r || fetch(e.request))
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(names =>
    Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
  )
));

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
