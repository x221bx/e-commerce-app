import axios from "axios";

export async function updateOrderStatus(orderId, status) {
  try {
    const res = await axios.post(
      "https://<YOUR_CLOUD_FUNCTION_URL>/orderStatusUpdate",
      { orderId, status }
    );
    return res.data;
  } catch (err) {
    console.error("Failed to update order status:", err);
    throw err;
  }
}
