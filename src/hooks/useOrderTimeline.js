// src/hooks/useOrderTimeline.js
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export function useOrderTimeline(orderId) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeline() {
      setLoading(true);
      const docRef = doc(db, "orders", orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTimeline(docSnap.data().timeline || []);
      }
      setLoading(false);
    }
    if (orderId) fetchTimeline();
  }, [orderId]);

  return { timeline, loading };
}
