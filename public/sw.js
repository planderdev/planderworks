const SW_VERSION = 'plander-works-sw-20260524-1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() =>
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PLANDER_SW_READY', version: SW_VERSION });
        });
      }),
    ),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const shouldBypassCache =
    event.request.mode === 'navigate' ||
    (isSameOrigin && ['document', 'script', 'style', 'manifest', 'worker'].includes(event.request.destination)) ||
    (isSameOrigin && ['/index.html', '/build-meta.json', '/site.webmanifest'].includes(requestUrl.pathname));

  if (!shouldBypassCache) return;

  event.respondWith(
    fetch(new Request(event.request, { cache: 'no-store' })).catch(() =>
      new Response('Plander Works는 네트워크 연결이 필요합니다.', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        status: 503,
      }),
    ),
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
    icon: '/plander-app-icon-192.png',
    badge: '/plander-admin-logo.svg',
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
