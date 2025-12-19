// User Data Persistence Service - Firebase-based
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebase";

// ==========================================
// CART SERVICE
// ==========================================

export const saveUserCart = async (userId, cartItems) => {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  await updateDoc(
    userRef,
    {
      cart: cartItems,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getUserCart = async (userId) => {
  if (!userId) return [];

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.cart || [];
    }
  } catch (error) {
    console.error("Error getting user cart:", error);
  }

  return [];
};

export const subscribeToUserCart = (userId, callback) => {
  if (!userId) return () => {};

  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (docSnap) => {
    const data = docSnap.data();
    callback(data?.cart || []);
  });
};

// ==========================================
// FAVORITES SERVICE
// ==========================================

export const saveUserFavorites = async (userId, favorites) => {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  await updateDoc(
    userRef,
    {
      favorites,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getUserFavorites = async (userId) => {
  if (!userId) return [];

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.favorites || [];
    }
  } catch (error) {
    console.error("Error getting user favorites:", error);
  }

  return [];
};

export const subscribeToUserFavorites = (userId, callback) => {
  if (!userId) return () => {};

  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (docSnap) => {
    const data = docSnap.data();
    callback(data?.favorites || []);
  });
};

// ==========================================
// USER PREFERENCES SERVICE
// ==========================================

export const saveUserPreferences = async (userId, preferences) => {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  await updateDoc(
    userRef,
    {
      preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getUserPreferences = async (userId) => {
  if (!userId) return {};

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.preferences || {};
    }
  } catch (error) {
    console.error("Error getting user preferences:", error);
  }

  return {};
};

export const subscribeToUserPreferences = (userId, callback) => {
  if (!userId) return () => {};

  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (docSnap) => {
    const data = docSnap.data();
    callback(data?.preferences || {});
  });
};

// ==========================================
// AI CHAT HISTORY SERVICE
// ==========================================

export const saveUserChatHistory = async (userId, messages) => {
  if (!userId) return;

  const userRef = doc(db, "users", userId);
  await setDoc(
    userRef,
    {
      chatHistory: messages,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getUserChatHistory = async (userId) => {
  if (!userId) return [];

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.chatHistory || [];
    }
  } catch (error) {
    console.error("Error getting user chat history:", error);
  }

  return [];
};

export const subscribeToUserChatHistory = (userId, callback) => {
  if (!userId) return () => {};

  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (docSnap) => {
    const data = docSnap.data();
    callback(data?.chatHistory || []);
  });
};

// ==========================================
// MIGRATION HELPERS
// ==========================================

export const migrateLocalStorageToFirebase = async (userId) => {
  if (!userId) return;

  try {
    const localCart = JSON.parse((await AsyncStorage.getItem(`cartItems_${userId}`)) || "[]");
    if (localCart.length > 0) {
      await saveUserCart(userId, localCart);
      await AsyncStorage.removeItem(`cartItems_${userId}`);
    }

    const localFavorites = JSON.parse((await AsyncStorage.getItem(`favorites_${userId}`)) || "[]");
    if (localFavorites.length > 0) {
      await saveUserFavorites(userId, localFavorites);
      await AsyncStorage.removeItem(`favorites_${userId}`);
    }

    const localChatHistory = JSON.parse((await AsyncStorage.getItem(`chatHistory_${userId}`)) || "[]");
    if (localChatHistory.length > 0) {
      await saveUserChatHistory(userId, localChatHistory);
      await AsyncStorage.removeItem(`chatHistory_${userId}`);
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
};
