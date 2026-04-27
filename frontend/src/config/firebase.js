import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// messaging() will throw on browsers that don't support it (e.g. Safari < 16.4)
// We export null in that case and guard against it in usePushNotifications
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('Firebase Messaging not supported in this browser:', e.message);
}

export { messaging };
