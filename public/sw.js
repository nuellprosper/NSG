// Minimal service worker for PWA installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests
  event.respondWith(fetch(event.request));
});

// PWA background 'push' notification handler
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || "NSG (Nuell Study Guide)";
  const options = {
    body: data.body || "Academic notification from OMNI.",
    icon: data.icon || "/icon.svg",
    badge: data.badge || "/icon.svg",
    vibrate: data.vibrate || [100, 50, 100],
    data: {
      clickAction: data.clickAction || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handling clicks on background notifications to focus/redirect browser viewport
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Look for an existing open tab and focus it
      for (const client of windowClients) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new tab/window
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
