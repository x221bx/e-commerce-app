// src/hooks/useProductMutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

const PRODUCTS_QUERY_KEY = "products";

/**
 * Helper: normalize payload before sending to Firestore
 * - ensures numeric fields are numbers
 * - removes undefined values
 */
function normalizeProductPayload(p) {
  const payload = { ...p };

  // normalize strings -> numbers for numeric fields
  if (payload.price !== undefined) payload.price = Number(payload.price) || 0;
  // prefer explicit stock field; fallback to quantity if provided
  const stockProvided =
    payload.stock !== undefined || payload.quantity !== undefined;
  if (payload.stock !== undefined) {
    payload.stock = Number(payload.stock) || 0;
  } else if (payload.quantity !== undefined) {
    payload.stock = Number(payload.quantity) || 0;
  }

  // derive availability from stock: stock <= 0 => unavailable; >0 => available
  if (stockProvided) {
    payload.isAvailable = (Number(payload.stock) || 0) > 0;
  } else if (payload.isAvailable !== undefined) {
    payload.isAvailable = Boolean(payload.isAvailable);
  }

  // ensure booleans are booleans
  if (payload.isAvailable !== undefined) payload.isAvailable = Boolean(payload.isAvailable);

  // create a lower-cased name helper
  if (payload.name || payload.title) {
    payload.name_lc = (payload.name || payload.title || "")
      .toString()
      .toLowerCase();
  }

  // remove empty strings that should be null
  if (payload.thumbnailUrl === "") delete payload.thumbnailUrl;

  // remove undefined props
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  return payload;
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newProduct) => {
      const payload = normalizeProductPayload(newProduct);

      // default fields
      payload.createdAt = serverTimestamp();
      // keep a canonical "stock" number
      payload.stock = Number(payload.stock ?? 0);
      payload.isAvailable = payload.stock > 0;

      return addDoc(collection(db, "products"), payload);
    },
    onSuccess: (ref) => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ["productsSorted"] });
      qc.invalidateQueries({ queryKey: ["count", "products", "total"] });
      qc.invalidateQueries({ queryKey: ["count", "products", "available"] });
      if (ref?.id) qc.invalidateQueries({ queryKey: ["product", ref.id] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updatedFields }) => {
      const patch = normalizeProductPayload(updatedFields);

      // update timestamps
      patch.updatedAt = serverTimestamp();

      return updateDoc(doc(db, "products", id), patch);
    },
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ["productsSorted"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["count", "products", "total"] });
      qc.invalidateQueries({ queryKey: ["count", "products", "available"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId) => deleteDoc(doc(db, "products", productId)),
    onSuccess: (_res, productId) => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ["productsSorted"] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["count", "products", "total"] });
      qc.invalidateQueries({ queryKey: ["count", "products", "available"] });
    },
  });
}
