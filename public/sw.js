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
