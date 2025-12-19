import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getJSON, setJSON } from "../../utils/storage";

const STORAGE_KEY = "cartItems";

export const loadCart = createAsyncThunk("cart/load", async () => {
  const saved = await getJSON(STORAGE_KEY, []);
  return saved || [];
});

const resolveStock = (product) => {
  const value = Number(product?.stock ?? product?.quantity ?? product?.quantityAvailable ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    isHydrated: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const stock = resolveStock(product);
      if (stock <= 0 || product?.isAvailable === false) {
        return;
      }
      const exists = state.items.find((i) => i.id === product.id);
      if (!exists) {
        state.items.push({ ...product, quantity: 1, stock });
        setJSON(STORAGE_KEY, state.items);
      }
    },
    increaseQuantity: (state, action) => {
      const productId = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        const stock = resolveStock(item);
        item.stock = stock;
        if (stock <= 0) {
          item.maxReached = true;
          item.outOfStock = true;
        } else if (item.quantity < stock) {
          item.quantity += 1;
          item.maxReached = false;
        } else {
          item.maxReached = true;
        }
        setJSON(STORAGE_KEY, state.items);
      }
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((i) => i.id !== productId);
      setJSON(STORAGE_KEY, state.items);
    },
    decreaseQuantity: (state, action) => {
      const productId = action.payload;
      const item = state.items.find((i) => i.id === productId);
      if (item) {
        item.quantity = Math.max(1, item.quantity - 1);
        item.maxReached = false;
      }
      setJSON(STORAGE_KEY, state.items);
    },
    clearCart: (state) => {
      state.items = [];
      setJSON(STORAGE_KEY, state.items);
    },
    setQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        const stock = resolveStock(item);
        item.stock = stock;
        if (stock <= 0) {
          item.quantity = 0;
          item.maxReached = true;
          item.outOfStock = true;
        } else {
          item.quantity = Math.max(1, Math.min(quantity, stock));
          item.maxReached = item.quantity >= stock;
          item.outOfStock = false;
        }
      }
      setJSON(STORAGE_KEY, state.items);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadCart.fulfilled, (state, action) => {
      state.items = action.payload || [];
      state.isHydrated = true;
    });
  },
});

export const {
  addToCart,
  increaseQuantity,
  removeFromCart,
  decreaseQuantity,
  clearCart,
  setQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;
