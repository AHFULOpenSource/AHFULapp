// src/firebase.js -- App/Root level initialization ONCE, all other sub-modules import from this file.

//Import Main Firebase SDK to Init App
import { initializeApp } from 'firebase/app';

//Import Commented out as Firestore is not activated. 
// import { getFirestore } from 'firebase/firestore';

//Import Auth SDK to handle user authentication
import { getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged } from 'firebase/auth';

import { handle_google_login, whoami } from "./Auth/QueryFunctions-Auth.js";
// import { authLogin } from "./Auth/AuthSlice.jsx";
//Import Messaging SDK to handle push notifications
import { getMessaging, getToken, onMessage} from 'firebase/messaging';

// Firebase configuration object, using environment variables to sheild Auth info. 
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

//Initialize Firebase App with the config object. This is done ONCE, HERE. 
// app itself is never exported — the services are what you use
const app = initializeApp(firebaseConfig);

// export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service. 
//EXPORTED so other modules can import and use it.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();


/**
 * 
 * Login with email and password using Firebase Authentication.
 * @param {string} email 
 * @param {string} password 
 * @returns userCredential Object to send to backend. 
 */
export const loginEmailPassword = async (email, password) => {
  try{
    const providedEmail = email;
    const providedPassword = password;
    const userCredential = await signInWithEmailAndPassword(auth, providedEmail, providedPassword);

    console.log('User signed in successfully:', userCredential.user);
    //Retrun the userCredential object.
    return userCredential.user;
    
  } catch (error) {
    console.error('Error during email/password login:', error);
    throw error; // rethrow the error so the caller can handle it
  }
}



/**
 * Creates a user with provided email and password and logs them in. 
 * @param {*} email 
 * @param {*} password 
 * @returns A userCredential object
 */
export const createWithEmailPassword = async (email, password) => {
  try{
    const providedEmail = email;
    const providedPassword = password;
    const userCredential = await createUserWithEmailAndPassword(auth, providedEmail, providedPassword);

    console.log('User created successfully:', userCredential.user);
    //Retrun the userCredential object.
    return userCredential.user;
    
  } catch (error) {
    console.error('Error during email/password login:', error);
    throw error; // rethrow the error so the caller can handle it
  }
}

export const firebaseAHFULSignOut = () =>{
  signOut(auth).then(() => {
    console.log('User signed out successfully.');
  }).catch((error) => {
    console.error('Error signing out:', error);
  });
}

export const signInWithGoogle = async () => {
 try{ 
  const popupResponse = await signInWithPopup(auth, googleProvider);

  // This gives you a Google Access Token. You can use it to access the Google API.
  const credential = GoogleAuthProvider.credentialFromResult(popupResponse)
  const user = popupResponse.user;

  const idToken = await user.getIdToken(true)

  await handle_google_login(idToken);

  //TODO: Update authLogin
  // dispatch(authLogin(whomstResponse.data.user_info));

  console.log('User signed in with Google:', user);
}catch (error){
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;

      console.error('Error during Google sign-in:', errorCode, errorMessage);

      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
  };

}

export const getCurrentUser = () => {
  const user = auth.currentUser;

  return user

}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    whoami()

  } else {
    // User is signed out
    // ...
  }
});


export const messaging = getMessaging(app);

/**
 * Returns the initialized Messaging service instance.
 * Other modules can import this to access the messaging API.
 */
export function getMessagingService() {
  return messaging;
}

const BACKEND_URL = "http://localhost:5000/api";

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
