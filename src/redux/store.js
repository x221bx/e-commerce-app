import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import { listenerMiddleware } from "../services/listenerMiddleware";
import cartReducer from "../features/cart/cartSlice";
import favoritesReducer from "../features/favorites/favoritesSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).prepend(listenerMiddleware.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
export { store };
