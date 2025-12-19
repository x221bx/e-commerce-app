import { useEffect, useState } from "react";
import axios from "axios";

export function useLowStock() {
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLowStock() {
      try {
        setLoading(true);
        const res = await axios.get(
          "https://<YOUR_CLOUD_FUNCTION_URL>/checkLowStock"
        );
        setLowStock(res.data.lowStockProducts || []);
      } catch (err) {
        console.error("Failed to fetch low stock:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLowStock();
  }, []);

  return { lowStock, loading };
}
