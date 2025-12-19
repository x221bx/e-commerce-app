import React from "react";
import { getLocalizedName } from "../utils/productLocalization";

export default function CartItem({ item, lang = "en" }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm">
      <img
        src={item.thumbnailUrl || item.imageUrl || item.img}
        alt={getLocalizedName(item, lang)}
        className="w-24 h-24 object-cover rounded-lg border"
      />

      <div className="flex-1">
        <h3 className="text-lg font-semibold">
          {getLocalizedName(item, lang) || "Unnamed Product"}
        </h3>

        {item.description && (
          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        )}

        <p className="text-[#2d6a4f] font-bold mt-2">
          {Number(item.price).toLocaleString()} EGP
        </p>

        <p className="text-gray-500 text-sm mt-1">
          Quantity: {item.quantity || 1}
        </p>
      </div>
    </div>
  );
}
