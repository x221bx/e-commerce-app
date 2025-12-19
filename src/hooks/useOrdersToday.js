// src/hooks/useOrdersToday.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export function useOrdersToday() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, "orders"),
        where("createdAt", ">=", today)
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(orders);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  return { data, loading };
}
