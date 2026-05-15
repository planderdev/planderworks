const SHELL_VERSION = 'planderworks-redesign-20260515-2';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(() => new Response('Plander Works는 네트워크 연결이 필요합니다.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 503,
    })),
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data
    ? event.data.json()
    : {
        title: 'Plander Works',
        body: '새 업무 알림이 도착했습니다.',
        url: '/',
      };

  const title = payload.title || 'Plander Works';
  const options = {
    body: payload.body || '새 업무 알림이 도착했습니다.',
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: {
      url: payload.url || '/',
      taskId: payload.taskId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
