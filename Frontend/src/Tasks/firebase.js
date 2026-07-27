// src/firebase.js  ← initialize ONCE here
import { initializeApp } from 'firebase/app';

// import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';

import { getMessaging, getToken, onMessage} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// export const db = getFirestore(app);
// export const auth = getAuth(app);

export const messaging = getMessaging(app);
// app itself is rarely exported — the services are what you use

/**
 * Returns the initialized Messaging service instance.
 * Other modules can import this to access the messaging API.
 */
export function getMessagingService() {
  return messaging;
}

const BACKEND_URL = "https://www.ahful.app/api";

async function sendTokenToBackend(token, userId) {
  try {
    const response = await fetch(`${BACKEND_URL}/AHFULtokens/create/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token }),
      credentials: "include",
    });
    
    if (response.ok) {
      console.log("FCM token saved to backend successfully");
      return true;
    } else {
      const error = await response.json();
      console.error("Failed to save FCM token:", error);
      return false;
    }
  } catch (err) {
    console.error("Error sending token to backend:", err);
    return false;
  }
}

/**
 * Request notification permission (via the browser) and attempt to get an
 * FCM registration token. By default the function uses the environment
 * variable VITE_FIREBASE_VAPID_KEY if no key is passed.
 *
 * Returns the token string on success, null if not granted/available.
 * Throws if getToken itself errors.
 */
export async function registerService(userId) {
  try {
    const vapidKey = "BCeDiTe-0QFJVPuIt8U-boP2iShVYgIRhd8KbXrntzF7zgUnEBX0HFeAeefqMVjXFb35XqeHrFAHezg8mh6UkLg";

    // Ask the user for permission to send notifications
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted.');
      return null;
    }

    const currentToken = await getToken(messaging, vapidKey);
    if (currentToken) {
      console.log('Registration token retrieved:', currentToken);
      
      // Send token to backend if userId is provided
      if (userId) {
        await sendTokenToBackend(currentToken, userId);
      }
      
      return currentToken;
    } else {
      console.log('No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
}

//Safer check of service worker registration
export const validateAndRegisterSW = async (userId) => {
  // bail out if browser doesn't support service workers
  if (!('serviceWorker' in navigator)) {
    console.warn('OH MY!  Are you using Netscape? Service workers not supported in this browser');
    return null;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    const existingWorker = registrations.find(reg =>
      reg.scope.includes('firebase-cloud-messaging-push-scope')
    );

    if (existingWorker) {
      // Check what state it's actually in
      if (existingWorker.active) {
        console.log('SW is active and healthy, checking for updates...');
        await existingWorker.update();
        return existingWorker;
      }

      if (existingWorker.waiting) {
        console.log('SW is waiting — old worker still in control');
        // force the new one to take over immediately
        existingWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
        return existingWorker;
      }

      if (existingWorker.installing) {
        console.log('SW is still installing...');
        return existingWorker;
      }

      // If we get here something is wrong — nuke it and start fresh
      console.warn('SW found but in bad state, unregistering...');
      await existingWorker.unregister();
    }

    // Either no SW existed or we just cleared a bad one
    // Let Firebase re-register it fresh via getToken
    console.log('Registering fresh service worker...');
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY'
    });

    // Send token to backend if userId is provided
    if (token && userId) {
      await sendTokenToBackend(token, userId);
    }

    return token;

  } catch (error) {
    console.error('SW validation failed:', error);
    return null;
  }
};

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);

  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png'
  });
  
  // Firebase does NOT auto-show a notification in the foreground
  // You have to handle the UI yourself here
});
