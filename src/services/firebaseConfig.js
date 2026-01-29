import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDuC19qSlFLQrzl4NGHEulOidbPgt_xXm8',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'first-app-95051.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'first-app-95051',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'first-app-95051.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1076765269610',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1076765269610:android:e07a1461338ec94947b413',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validation
if (!firebaseConfig.apiKey) {
    console.error('Firebase Configuration Error: API Key is missing!');
    throw new Error(
        'CRITICAL ERROR: Firebase API Key is missing. \n' +
        'Please check your .env file in the project root.\n' +
        'Ensure you have EXPO_PUBLIC_FIREBASE_API_KEY=... set correctly.\n' +
        'If you just created the .env file, you MUST restart the bundler with --clear.'
    );
}

console.log('Firebase initialized with Project ID:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;
