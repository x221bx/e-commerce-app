// src/hooks/useLowStockProducts.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export function useLowStockProducts(threshold = 5) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLowStock() {
      setLoading(true);
      const q = query(
        collection(db, "products"),
        where("stock", "<=", threshold)
      );
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(products);
      setLoading(false);
    }
    fetchLowStock();
  }, [threshold]);

  return { data, loading };
}
