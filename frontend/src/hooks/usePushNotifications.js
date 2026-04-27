import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function usePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (!messaging) return; // Browser doesn't support Firebase Messaging
    if (!('Notification' in window)) return; // Browser doesn't support notifications
    if (!('serviceWorker' in navigator)) return; // Browser doesn't support SW

    const registerPush = async () => {
      try {
        // 1. Request browser permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[Push] Permission denied by user.');
          return;
        }

        // 2. Register the service worker
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );

        // 3. Get FCM web token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          console.warn('[Push] No FCM token returned. Check VAPID key and SW registration.');
          return;
        }

        console.log('[Push] FCM web token obtained:', token);

        // 4. Save token to Supabase users table
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: token })
          .eq('id', user.id);

        if (error) {
          console.error('[Push] Error saving FCM token to Supabase:', error.message);
        } else {
          console.log('[Push] FCM token saved successfully.');
        }

      } catch (error) {
        console.error('[Push] Error during push setup:', error);
      }
    };

    registerPush();

    // 5. Foreground message handler — tab is open and active
    //    In-app toasts are already handled by NotificationContext via Supabase Realtime,
    //    so we just log here. Add custom UI behaviour if needed.
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('[Push] Foreground message received:', payload);
      // Deep-link if user taps a foreground notification action
      const rideId = payload.data?.rideId;
      if (rideId) {
        navigate(`/ride/${rideId}`);
      }
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, [user, navigate]);
}
