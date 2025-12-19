import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const normalizePhone = (value = "") => value.replace(/\D/g, "").slice(0, 11);

export const useUserProfile = (userId, form, setForm) => {
  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (!snap.exists() || !mounted) return;

        const data = snap.data() || {};
        const fullName =
          data.fullName ||
          data.name ||
          [data.firstName, data.lastName].filter(Boolean).join(" ") ||
          "";
        const phoneValue = data.phone || data.phoneNumber || data.contactPhone || data.mobile || "";

        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || fullName,
          phone: prev.phone || normalizePhone(phoneValue),
          address:
            prev.address || data.address || data.addressLine1 || data.location || "",
          city: prev.city || data.city || data.addressCity || "",
        }));
      } catch (err) {
        console.error("Failed to load user profile for checkout", err);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [userId, setForm]);
};
