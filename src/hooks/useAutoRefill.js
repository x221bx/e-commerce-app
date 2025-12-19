import { useEffect, useState } from "react";
import axios from "axios";

export function useAutoRefill() {
  const [status, setStatus] = useState(null);

  async function refillStock() {
    try {
      const res = await axios.post(
        "https://<YOUR_CLOUD_FUNCTION_URL>/autoRefillStock"
      );
      setStatus(res.data.message);
    } catch (err) {
      console.error("Failed to auto refill:", err);
      setStatus("Error");
    }
  }

  return { status, refillStock };
}
