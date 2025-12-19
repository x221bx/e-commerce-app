import { useQuery } from "@tanstack/react-query";
import { getDocs } from "firebase/firestore";
import { buildProductsQuery } from "./firestore/buildProductsQuery";

/**
 * Server-sorted, client-paginated list of products.
 * Accepts status filter: "all" | "available" | "unavailable"
 * Accepts category filter
 */
export function useProductsSorted({
  sortBy = "createdAt",
  dir = "desc",
  qText = "",
  status = "all",
  category = "",
} = {}) {
  return useQuery({
    queryKey: ["productsSorted", { sortBy, dir, qText, status, category }],
    queryFn: async () => {
      const q = buildProductsQuery({ sortBy, dir, qText, status, category });
      const snap = await getDocs(q);
      const products = snap.docs.map((d) => {
        const data = d.data();
        const stock = Number(data.stock ?? data.quantity ?? 0);
        const isAvailable = stock > 0 && data.isAvailable !== false;
        return { id: d.id, ...data, stock, isAvailable };
      });

      if (status === "available") return products.filter((p) => p.isAvailable);
      if (status === "unavailable")
        return products.filter((p) => !p.isAvailable);
      return products;
    },
    staleTime: 15_000,
    keepPreviousData: true,
  });
}
