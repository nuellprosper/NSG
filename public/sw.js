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

// Message listener for scheduling background reminders when app is closed or minimized
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'schedule_reminder') {
    const delay = event.data.delay || 10000;
    const bodyText = event.data.message || "Ready to study? Try a quick Smart Quiz or read your notes now! 🧠";
    
    setTimeout(() => {
      self.registration.showNotification("NSG Academic Assistant 🎓", {
        body: bodyText,
        icon: "/icon.svg",
        badge: "/icon.svg",
        vibrate: [100, 50, 100],
        data: {
          clickAction: "/"
        }
      });
    }, delay);
  }
});

// Periodic study reminder loop (every 4 hours as a standard background backup)
setInterval(() => {
  const studyPrompts = [
    "Ready to boost your grade? Try a quick Smart Quiz today! 🧠",
    "Time for a study break! Check out your customized Study Notes on NSG. 📝",
    "Feeling stuck on homework? Let the Assignment Solver solve it step-by-step! 🎓",
    "Keep your study streak alive! Host or join a Live Classroom session. 🔥",
    "Challenge your brain with a mock CBT exam and verify your readiness! 📊"
  ];
  
  const randomPrompt = studyPrompts[Math.floor(Math.random() * studyPrompts.length)];
  
  self.registration.showNotification("NSG Academic Assistant 🎓", {
    body: randomPrompt,
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: [100, 50, 100],
    data: {
      clickAction: "/"
    }
  });
}, 4 * 60 * 60 * 1000);

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
