import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { auth, db } from "../../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as _signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getJSON, setJSON, removeItem } from "../../utils/storage";

const AUTH_KEY = "authUser";

const resolveEmail = async (identifier) => {
  if (!identifier) throw { code: "auth/invalid-identifier" };
  if (identifier.includes("@")) return identifier.trim().toLowerCase();

  const usernameKey = identifier.toLowerCase().trim();

  // usernames/{username}
  const snap = await getDoc(doc(db, "usernames", usernameKey));
  if (snap.exists()) {
    const email = snap.data().email;
    if (email) return email.toLowerCase();
  }

  // users collection
  const usersRef = collection(db, "users");
  const userByUsername = await getDocs(query(usersRef, where("username", "==", usernameKey)));
  if (!userByUsername.empty) {
    const email = userByUsername.docs[0].data()?.email;
    if (email) return email.toLowerCase();
  }

  // delivery_accounts collection (admin-created delivery users)
  const deliveryRef = collection(db, "delivery_accounts");
  const deliveryByUsername = await getDocs(query(deliveryRef, where("username", "==", usernameKey)));
  if (!deliveryByUsername.empty) {
    const email = deliveryByUsername.docs[0].data()?.email;
    if (email) return email.toLowerCase();
  }

  throw { code: "auth/user-not-found" };
};

const mapAuthError = (e) => {
  const code = e?.code || "auth/unknown";
  const build = (message, fieldErrors = {}) => ({ code, message, fieldErrors });

  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-login-credentials":
    case "auth/invalid-credential":
      return build("Invalid credentials", {
        identifier: "Check your email/username",
        password: "Incorrect password",
      });
    case "auth/user-not-found":
      return build("User not found", { identifier: "Account not found" });
    case "auth/email-already-in-use":
      return build("Email already in use", { email: "Email already registered" });
    case "auth/weak-password":
      return build("Weak password", { password: "Password must be 6+ chars" });
    case "auth/invalid-email":
      return build("Invalid email", { email: "Email is invalid" });
    default:
      return build("Unexpected error, please try again");
  }
};


export const hydrateAuth = createAsyncThunk("auth/hydrate", async () => {
  const stored = await getJSON(AUTH_KEY, null);
  return stored;
});

export const refreshCurrentUser = createAsyncThunk(
  "auth/refreshCurrentUser",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const current = selectCurrentUser(state);
    if (!current?.uid) {
      return rejectWithValue("No authenticated user");
    }
    let data = null;

    const userSnap = await getDoc(doc(db, "users", current.uid));
    if (userSnap.exists()) {
      data = userSnap.data();
    }

    if (!data) {
      const deliverySnap = await getDoc(doc(db, "delivery_accounts", current.uid));
      if (deliverySnap.exists()) {
        data = deliverySnap.data();
      }
    }

    if (!data) {
      return rejectWithValue("User record not found");
    }

    const contact = data.contact || {
      email: data.email || current.email || "",
      phone: data.phone || "",
      location: data.location || "",
    };
    const resolvedRole = data.role
      ? data.role
      : data.isAdmin
        ? "admin"
        : data.isDelivery
          ? "delivery"
          : "user";
    return {
      uid: current.uid,
      email: current.email,
      ...data,
      role: resolvedRole,
      isAdmin: resolvedRole === "admin",
      isDelivery: resolvedRole === "delivery",
      zone: data.zone || null,
      vehicleType: data.vehicleType || null,
      contact: {
        email: contact.email || data.email || current.email,
        phone: contact.phone || data.phone || "",
        location: contact.location || data.location || "",
      },
    };
  }
);

export const signInWithIdentifier = createAsyncThunk(
  "auth/signInWithIdentifier",
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const email = await resolveEmail(identifier);
      const cred = await signInWithEmailAndPassword(auth, email, password);

      let profileSource = null;
      let userData = null;

      // Primary: users collection
      const userSnap = await getDoc(doc(db, "users", cred.user.uid));
      if (userSnap.exists()) {
        profileSource = "users";
        userData = userSnap.data();
      }

      // Fallback: delivery_accounts collection (admin-created delivery users)
      if (!userData) {
        const deliverySnap = await getDoc(doc(db, "delivery_accounts", cred.user.uid));
        if (deliverySnap.exists()) {
          profileSource = "delivery_accounts";
          userData = deliverySnap.data();
        }
      }

      // Fallback: query delivery_accounts by email
      if (!userData) {
        const deliveryRef = collection(db, "delivery_accounts");
        const byEmail = await getDocs(query(deliveryRef, where("email", "==", email)));
        if (!byEmail.empty) {
          profileSource = "delivery_accounts";
          userData = byEmail.docs[0].data();
        }
      }

      if (!userData) throw { code: "auth/user-not-found" };

      const contact = userData.contact || {
        email: userData.email || cred.user.email,
        phone: userData.phone || "",
        location: userData.location || "",
      };
      const resolvedRole = userData.role
        ? userData.role
        : userData.isAdmin
          ? "admin"
          : userData.isDelivery
            ? "delivery"
            : "user";
      const profile = {
        uid: cred.user.uid,
        email: cred.user.email || userData.email || null,
        name: userData.name || cred.user.displayName || "User",
        username: userData.username || null,
        photoURL: userData.photoURL || userData.avatar || null,
        isAdmin: resolvedRole === "admin",
        isDelivery: resolvedRole === "delivery",
        role: resolvedRole,
        phone: userData.phone || "",
        location: userData.location || "",
        zone: userData.zone || null,
        vehicleType: userData.vehicleType || null,
        firstName:
          userData.firstName ||
          userData.name?.split?.(" ")?.[0] ||
          "",
        lastName:
          userData.lastName ||
          userData.name?.split?.(" ")?.slice(1).join(" ") ||
          "",
        contact: {
          email: contact.email || userData.email || cred.user.email,
          phone: contact.phone || userData.phone || "",
          location: contact.location || userData.location || "",
        },
      };

      await setJSON(AUTH_KEY, profile);
      return profile;
    } catch (e) {
      return rejectWithValue(mapAuthError(e, "login"));
    }
  }
);

export const signUp = createAsyncThunk(
  "auth/signUp",
  async ({ name, email, username, password }, { rejectWithValue }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim().toLowerCase();

      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: name.trim() });

      const userData = {
        name: name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        phone: null,
        location: null,
        photoURL: null,
        contact: {
          email: cleanEmail,
          phone: "",
          location: "",
        },
        isAdmin: false,
        isDelivery: false,
        role: "user",
        createdAt: serverTimestamp(),
      };

      await Promise.all([
        setDoc(doc(db, "users", cred.user.uid), userData),
        setDoc(doc(db, "usernames", cleanUsername), {
          email: cleanEmail,
          uid: cred.user.uid,
        }),
      ]);

      const profile = {
        uid: cred.user.uid,
        email: cleanEmail,
        name: userData.name,
        username: userData.username,
        photoURL: userData.photoURL,
        phone: "",
        location: "",
        firstName: "",
        lastName: "",
        isAdmin: false,
        isDelivery: false,
        role: "user",
        contact: userData.contact,
      };

      await setJSON(AUTH_KEY, profile);
      return profile;
    } catch (error) {
      return rejectWithValue(mapAuthError(error, "signup"));
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (identifier, { rejectWithValue }) => {
    try {
      const email = await resolveEmail(identifier);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (e) {
      return rejectWithValue(mapAuthError(e));
    }
  }
);

export const signOutUser = createAsyncThunk("auth/signOut", async () => {
  try {
    await removeItem(AUTH_KEY);
  } finally {
    _signOut(auth);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isInitialized: false,
    error: null,
  },
  reducers: {
    setCurrentUser: (state, action) => {
      state.user = action.payload;
      setJSON(AUTH_KEY, action.payload);
    },
    setAuthInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(signInWithIdentifier.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(signInWithIdentifier.rejected, (state, action) => {
        state.error = action.payload;
        state.isInitialized = true;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.user = null;
        state.isInitialized = false;
      })
      .addCase(refreshCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        setJSON(AUTH_KEY, action.payload);
      });
  },
});

export const { setCurrentUser, setAuthInitialized, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthInitialized = (state) => state.auth.isInitialized;
