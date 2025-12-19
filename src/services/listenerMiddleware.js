// src/services/listenerMiddleware.js
/**
 * Listener Middleware (Firebase Auth Sync)
 * ----------------------------------------
 * This middleware runs once when the Redux store initializes and sets up
 * a real-time Firebase authentication listener using `onAuthStateChanged`.
 *
 * PURPOSE:
 * - Keeps the Redux auth state in sync with Firebase authentication.
 * - Loads the user's Firestore profile (`users/{uid}`) when signed in.
 * - Updates the Redux store with a normalized user profile object.
 * - Sets `setAuthInitialized(true)` to signal that auth is ready for the app.
 *
 * HOW IT WORKS:
 * - The listener fires only once due to the `initialized` guard.
 * - When Firebase auth state changes:
 *      → If no user is logged in, Redux is updated with `null`.
 *      → If a user is logged in:
 *            - Fetch Firestore profile data.
 *            - Merge Firebase Auth fields with Firestore fields.
 *            - Store everything in Redux via `setCurrentUser`.
 *
 * FIRESTORE FIELDS USED:
 * - name / username / photoURL / phone / createdAt / isAdmin
 *
 * FALLBACK BEHAVIOR:
 * - If Firestore fails to load (offline / no document / network issue):
 *      → A minimal profile is still created from Firebase Auth fields.
 *
 * NOTES:
 * - This middleware ensures the app always has up-to-date authentication data.
 * - Runs independently from UI and works silently in the background.
 * - It is essential for login persistence, role-based access, and profile syncing.
 */

import { createListenerMiddleware } from "@reduxjs/toolkit";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { setCurrentUser, setAuthInitialized } from "../features/auth/authSlice";

export const listenerMiddleware = createListenerMiddleware();

let initialized = false;

listenerMiddleware.startListening({
  predicate: () => !initialized,
  effect: async (_action, listenerApi) => {
    if (initialized) return;
    initialized = true;

    listenerApi.dispatch(setAuthInitialized(true));
    console.log("Starting Firebase auth listener...");

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        console.log("No user signed in");
        listenerApi.dispatch(setCurrentUser(null));
        return;
      }

      try {
        let userData = {};
        let source = "users";

        const userSnap = await getDoc(doc(db, "users", fbUser.uid));
        if (userSnap.exists()) {
          userData = userSnap.data() || {};
        } else {
          const deliverySnap = await getDoc(doc(db, "delivery_accounts", fbUser.uid));
          if (deliverySnap.exists()) {
            userData = deliverySnap.data() || {};
            source = "delivery_accounts";
          } else if (fbUser.email) {
            const deliveryRef = collection(db, "delivery_accounts");
            const byEmail = await getDocs(query(deliveryRef, where("email", "==", fbUser.email)));
            if (!byEmail.empty) {
              userData = byEmail.docs[0].data() || {};
              source = "delivery_accounts";
            }
          }
        }

        const resolvedRole = userData.role
          ? userData.role
          : userData.isAdmin
            ? "admin"
            : userData.isDelivery
              ? "delivery"
              : "user";

        const profile = {
          uid: fbUser.uid,
          email: fbUser.email || userData.email || null,
          emailVerified: fbUser.emailVerified || false,
          displayName:
            fbUser.displayName || userData.name || userData.username || "User",
          photoURL: fbUser.photoURL || userData.photoURL || null,
          phoneNumber: fbUser.phoneNumber || userData.phone || "",
          role: resolvedRole,
          isAdmin: resolvedRole === "admin",
          isDelivery: resolvedRole === "delivery",
          username: userData.username || null,
          zone: userData.zone || null,
          vehicleType: userData.vehicleType || userData.vehicle || null,
          createdAt: userData.createdAt?.toDate?.() || null,
          source,
        };

        listenerApi.dispatch(setCurrentUser(profile));
      } catch (error) {
        console.error("Failed to load user profile:", error);
        listenerApi.dispatch(
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email || null,
            displayName: fbUser.displayName || "User",
            photoURL: fbUser.photoURL || null,
            role: "user",
            isAdmin: false,
            isDelivery: false,
          })
        );
      }
    });

    return () => unsubscribe();
  },
});
