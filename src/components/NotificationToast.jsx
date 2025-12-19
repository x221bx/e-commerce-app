// src/components/NotificationToast.jsx
import React, { useEffect } from "react";

export default function NotificationToast({ notif, onClose, navigate }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notif.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [notif, onClose]);

  return (
    <div
      onClick={() => navigate(`/order/${notif.orderId}`)}
      className={`fixed top-5 right-5 bg-white border-l-4 ${
        notif.type === "new" ? "border-green-500" : "border-red-500"
      } shadow-md p-4 rounded-md cursor-pointer w-80 z-50 hover:shadow-lg transition`}
    >
      <p className="text-sm font-semibold">{notif.message}</p>
      <p className="text-xs text-gray-500">
        {new Date(notif.createdAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
