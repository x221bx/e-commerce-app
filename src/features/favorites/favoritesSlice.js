// src/features/favorites/favoritesSlice.js
/**
 * Favorites Slice
 * -------------------------------
 * This slice manages the user's favorite products locally using AsyncStorage.
 *
 * HOW IT WORKS:
 * - Each user has a unique storage key (favorites_<uid>), while guests use "favorites_guest".
 * - loadFavorites:
 *      Loads favorites from local storage when the app starts or when the user logs in.
 * - toggleFavorite:
 *      Adds or removes an item from the favorites list, then saves the updated list to storage.
 * - clearFavorites:
 *      Clears all favorite items for the current user and updates local storage.
 *
 * NOTES:
 * - This slice is fully client-side and does NOT sync with Firestore.
 * - Favorites persist per user account and change when the user logs in or logs out.
 *
 * Used in:
 * - Favorites screen (UI)
 * - Product cards (Add/Remove Favorite actions)
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getJSON, setJSON } from "../../utils/storage";
import { selectCurrentUser } from "../auth/authSlice";

const keyFor = (uid) => (uid ? `favorites_${uid}` : "favorites_guest");

export const loadFavorites = createAsyncThunk(
  "favorites/load",
  async (_, { getState }) => {
    const user = selectCurrentUser(getState());
    const storageKey = keyFor(user?.uid);
    const saved = await getJSON(storageKey, []);
    return { items: saved, storageKey };
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: [],
    storageKey: keyFor(null),
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const product = action.payload;
      const exists = state.items.find((i) => i.id === product.id);
      if (exists) {
        state.items = state.items.filter((i) => i.id !== product.id);
      } else {
        state.items.push(product);
      }
      setJSON(state.storageKey, state.items);
    },
    clearFavorites: (state) => {
      state.items = [];
      setJSON(state.storageKey, state.items);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadFavorites.fulfilled, (state, action) => {
      state.items = action.payload.items || [];
      state.storageKey = action.payload.storageKey;
    });
  },
});

export const { toggleFavorite, clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
