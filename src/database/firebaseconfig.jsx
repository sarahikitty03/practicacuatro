// firebaseconfig.js
import { initializeApp } from "firebase/app";
// Cambiar getFirestore por initializeFirestore y agregar persistencia
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const appfirebase = initializeApp(firebaseConfig);

// Firestore con caché persistente (offline)
export const db = initializeFirestore(appfirebase, {
  localCache: persistentLocalCache(),
});

export const auth = getAuth(appfirebase);
export const storage = getStorage(appfirebase);
export { appfirebase };
