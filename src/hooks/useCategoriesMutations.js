// src/hooks/useCategoriesMutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

const KEY = "categories";

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newCategory) => {
      const payload = {
        ...newCategory,
        createdAt: serverTimestamp(),
      };
      return addDoc(collection(db, "categories"), payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["categoriesSorted"] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updatedFields }) =>
      updateDoc(doc(db, "categories", id), updatedFields),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["categoriesSorted"] });
      qc.invalidateQueries({ queryKey: ["category", id] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => deleteDoc(doc(db, "categories", id)),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["categoriesSorted"] });
      qc.invalidateQueries({ queryKey: ["category", id] });
    },
  });
}
