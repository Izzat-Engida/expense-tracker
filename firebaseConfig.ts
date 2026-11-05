import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
// @ts-expect-error - React Native persistence bundle is exported in dist/rn/index.js in Firebase v13
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCzO40ltx0D44miBDO6REbzFImgo66xK8A",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "expense-tracker-e32cb.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "expense-tracker-e32cb",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "expense-tracker-e32cb.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "318282129979",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:318282129979:web:17acd8957bab951ef0b21e",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore with long-polling to prevent React Native WebSocket/gRPC timeout warnings
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export default app;
