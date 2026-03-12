// Service Worker — Push bildirim desteği
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

// Push bildirimi al
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Çalışma Alanım', body: 'Hatırlatıcı!' }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' }
    })
  )
})

// Bildirime tıklanınca uygulamayı aç
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      if (cs.length) return cs[0].focus()
      return clients.openWindow(e.notification.data?.url || '/')
    })
  )
})

// Offline cache
const CACHE = 'calisma-alanim-v1'
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(e.request, clone))
      return res
    })).catch(() => caches.match('/'))
  )
})
