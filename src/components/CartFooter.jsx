// src/components/CartFooter.jsx
import React from "react";

export default function CartFooter({
  title,
  totaltext,
  total,
  onCheckout,
  itemCount,
  textitem,
}) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-200 flex justify-between items-center shadow-lg z-50">
      <div>
        <p className="text-gray-700 font-semibold">
          {totaltext}:{" "}
          <span className="font-bold">{total.toLocaleString()} EGP</span>
        </p>
        <p className="text-gray-500 text-sm">
          {itemCount} {textitem}
        </p>
      </div>
      <button
        onClick={onCheckout}
        className="bg-[#52b788] hover:bg-[#40916c] text-white font-semibold py-2 px-6 rounded-lg transition"
      >
        {title}
      </button>
    </div>
  );
}
