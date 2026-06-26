'use client';

import { useEffect } from 'react';

interface Props {
  isLoggedIn: boolean;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationRegister({ isLoggedIn }: Props) {
  useEffect(() => {
    // Only attempt subscription registration if user is logged in
    if (!isLoggedIn) return;

    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported on this browser/device.');
      return;
    }

    async function registerPush() {
      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Check current notification permission
        let permission = Notification.permission;
        
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          console.log('Push notifications permission was denied or ignored.');
          return;
        }

        // Get VAPID Public Key from environment
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing in env configurations.');
          return;
        }

        // Check if there is an existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Subscribe new device
          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
          console.log('Successfully subscribed new device to PWA push.');
        }

        // Send subscription object to backend to register/save
        const rawSubscription = JSON.parse(JSON.stringify(subscription));
        const keys = rawSubscription.keys || {};

        if (!subscription.endpoint || !keys.p256dh || !keys.auth) {
          console.error('Push Subscription payload has missing endpoint or keys.');
          return;
        }

        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to save subscription details on backend. Status: ${res.status}`);
        }

        const result = await res.json();
        if (!result.success) {
          throw new Error(result.error || 'Server rejected subscription details.');
        }

        console.log('Device push subscription synced with database successfully.');
      } catch (err) {
        console.error('Error during PWA push registration:', err);
      }
    }

    // Delay subscription register by 3 seconds for smoother page load
    const timer = setTimeout(() => {
      registerPush();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  return null; // Silent registration wrapper, no visible UI elements
}
