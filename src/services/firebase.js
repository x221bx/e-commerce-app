import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEnv } from "../utils/env";

const firebaseConfig = {
  apiKey: getEnv(["EXPO_PUBLIC_FIREBASE_API_KEY", "FIREBASE_API_KEY"]),
  authDomain: getEnv(["EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", "FIREBASE_AUTH_DOMAIN"]),
  projectId: getEnv(["EXPO_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_PROJECT_ID"]),
  storageBucket: getEnv(["EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", "FIREBASE_STORAGE_BUCKET"]),
  messagingSenderId: getEnv(["EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "FIREBASE_MESSAGING_SENDER_ID"]),
  appId: getEnv(["EXPO_PUBLIC_FIREBASE_APP_ID", "FIREBASE_APP_ID"]),
  measurementId: getEnv(["EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID", "FIREBASE_MEASUREMENT_ID"]),
};

// Only warn for required keys; measurementId is optional (Analytics not used in RN)
const requiredKeys = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

if (missingKeys.length) {
  console.warn(
    "[firebase] Missing config keys:",
    missingKeys.join(", "),
    "— check app.config.js extra or your .env values."
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  if (!globalThis.__authInstance) {
    try {
      globalThis.__authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      globalThis.__authInstance = getAuth(app);
    }
  }
  auth = globalThis.__authInstance;
}

let db;
if (Platform.OS === "web") {
  db = getFirestore(app);
} else {
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    });
  } catch (e) {
    db = getFirestore(app);
  }
}

const storage = getStorage(app);

export { auth, db, storage };
export default app;
