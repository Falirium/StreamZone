self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch handler for PWA installability compatibility
  event.respondWith(fetch(event.request));
});

// Handle PWA Background Push Event
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'StreamZone Notification';
  const options = {
    body: data.body || 'New live event starting now!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.redirectUrl || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Banner Tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const redirectUrl = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there is already a window open with the same domain
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate existing window if it's open, and focus it
          return client.navigate(redirectUrl).then((c) => c.focus());
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(redirectUrl);
      }
    })
  );
});

