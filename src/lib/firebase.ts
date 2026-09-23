import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD9ctkGALt25RshHEdCKAaO_uMP3Gq_7Pg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'money-details-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'money-details-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'money-details-demo.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '730588100621',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:730588100621:web:1c4bbd265ace78795e3d44',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-9YJ216DTQK',
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn('Firebase environment variables are missing. Add them from .env.example before running the app.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
