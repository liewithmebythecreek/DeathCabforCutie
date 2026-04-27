// Firebase Messaging Service Worker
// Handles push notifications when the browser tab is in the background or closed.
//
// ⚠️  NOTE: Service workers cannot access Vite env vars (import.meta.env).
//     The Firebase config values below are PUBLIC and safe to commit —
//     Firebase security is enforced by Firebase Security Rules, not these keys.
//     Fill in the values from: Firebase Console → Project Settings → General → Your apps

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "REPLACE_WITH_YOUR_API_KEY",
  authDomain:        "campus-cab-9e802.firebaseapp.com",
  projectId:         "campus-cab-9e802",
  storageBucket:     "campus-cab-9e802.firebasestorage.app",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId:             "REPLACE_WITH_YOUR_APP_ID",
});

const messaging = firebase.messaging();

// Background message handler — shows the OS notification
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const title = payload.notification?.title || 'Campus Rickshaw';
  const body  = payload.notification?.body  || '';

  self.registration.showNotification(title, {
    body,
    icon:  '/favicon.ico',
    badge: '/favicon.ico',
    data:  payload.data || {},
    vibrate: [100, 50, 100],
  });
});

// Notification click → open/focus the app and deep-link to the ride
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rideId = event.notification.data?.rideId;
  const targetUrl = rideId
    ? `${self.location.origin}/ride/${rideId}`
    : self.location.origin;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a tab is already open, focus it and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new tab
        return clients.openWindow(targetUrl);
      })
  );
});
