import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getCountFromServer, getDocs } from "firebase/firestore";
import { db } from "../services/firebase.js";

export function useProductsCount() {
  return useQuery({
    queryKey: ["count", "products", "total"],
    queryFn: async () => {
      const q = query(collection(db, "products"));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count || 0;
    },
    staleTime: 15_000,
  });
}

export function useProductsAvailableCount() {
  return useQuery({
    queryKey: ["count", "products", "available"],
    queryFn: async () => {
      const q = query(collection(db, "products"), where("stock", ">", 0));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count || 0;
    },
    staleTime: 15_000,
  });
}

export function useCategoriesCount() {
  return useQuery({
    queryKey: ["count", "categories", "total"],
    queryFn: async () => {
      const q = query(collection(db, "categories"));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count || 0;
    },
    staleTime: 15_000,
  });
}

export function useUsersCount() {
  return useQuery({
    queryKey: ["count", "users", "total"],
    queryFn: async () => {
      const q = query(collection(db, "users"));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count || 0;
    },
    staleTime: 15_000,
  });
}

export function useUsersStats() {
  return useQuery({
    queryKey: ["users-stats"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs.map((d) => d.data());

      const daily = {};
      users.forEach((u) => {
        const date = new Date(u.createdAt?.seconds ? u.createdAt.seconds * 1000 : Date.now())
          .toISOString()
          .split("T")[0];
        daily[date] = (daily[date] || 0) + 1;
      });

      const data = Object.entries(daily).map(([date, count]) => ({
        date,
        daily: count,
        monthly: count * 30,
      }));

      return data.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    staleTime: 30_000,
  });
}
