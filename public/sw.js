// ─── PRECACHE MANIFEST ───────────────────────────────────────────────────────
// Этот массив автоматически заполняется VitePWA при сборке (injectManifest)
const WB_MANIFEST = self.__WB_MANIFEST || []

// ─── КОНСТАНТЫ ───────────────────────────────────────────────────────────────
const STATIC_CACHE = 'oraza-static-v5'
const API_CACHE    = 'oraza-api-v5'
const ALL_CACHES   = [STATIC_CACHE, API_CACHE]

const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  // Активируем новый SW сразу, не ждём закрытия всех вкладок
  self.skipWaiting()

  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      // Precache: статика из манифеста + базовые URL
      const precacheUrls = [
        ...STATIC_URLS,
        ...WB_MANIFEST.map(entry => (typeof entry === 'string' ? entry : entry.url)),
      ]
      // addAll с защитой: игнорируем отдельные ошибки
      return Promise.allSettled(precacheUrls.map(url => cache.add(url)))
    })
  )
})

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Берём контроль над всеми открытыми вкладками сразу
      self.clients.claim(),
      // Удаляем устаревшие кэши
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name => !ALL_CACHES.includes(name))
            .map(name => caches.delete(name))
        )
      ),
    ])
  )
})

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return

  // Пропускаем Chrome extensions и прочее
  if (!url.protocol.startsWith('http')) return

  // Supabase API → Network First, fallback кэш
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(API_CACHE).then(cache => {
              cache.put(event.request, clone)
              // Ограничиваем размер API-кэша: удаляем старые записи
              cache.keys().then(keys => {
                if (keys.length > 100) {
                  keys.slice(0, keys.length - 100).forEach(key => cache.delete(key))
                }
              })
            })
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Статика → Cache First, fallback сеть
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached

      return fetch(event.request).then(response => {
        // Кэшируем только успешные ответы нашего домена
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})

// ─── PUSH УВЕДОМЛЕНИЯ ─────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'ORAZA', body: 'Новое уведомление', url: '/' }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    image: data.image,
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'oraza-notification',   // группировка похожих уведомлений
    renotify: true,
    requireInteraction: false,
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ─── КЛИК ПО УВЕДОМЛЕНИЮ ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Ищем уже открытую вкладку с нашим приложением
      for (const client of clientList) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Иначе открываем новую
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// ─── PUSH SUBSCRIPTION CHANGE ─────────────────────────────────────────────────
// Браузер автоматически обновляет подписку — нужно сохранить новую в БД
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    event.newSubscription
      ? fetch('/api/push/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: event.newSubscription }),
        }).catch(() => {/* offline — проигнорируем */})
      : Promise.resolve()
  )
})
