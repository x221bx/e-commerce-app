import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const CONFIG_COLLECTION = "config";
const SHIPPING_CONFIG_DOC = "shipping_config";

const toValidCost = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const getShippingCost = async () => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, SHIPPING_CONFIG_DOC);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return 0;
    const data = snap.data();
    return toValidCost(data?.shippingCost);
  } catch (error) {
    console.error("Error getting shipping cost:", error);
    return 0;
  }
};

export const setShippingCost = async (cost) => {
  const costValue = Number(cost);
  if (!Number.isFinite(costValue) || costValue < 0) {
    throw new Error("Shipping cost must be a non-negative finite number");
  }

  try {
    const docRef = doc(db, CONFIG_COLLECTION, SHIPPING_CONFIG_DOC);
    await setDoc(
      docRef,
      {
        shippingCost: costValue,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return costValue;
  } catch (error) {
    console.error("Error setting shipping cost:", error);
    throw error;
  }
};

export const getShippingConfig = async () => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, SHIPPING_CONFIG_DOC);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : {};
  } catch (error) {
    console.error("Error getting shipping config:", error);
    return {};
  }
};

// Subscribe to shipping cost changes in Firestore (returns unsubscribe)
export const subscribeShippingCost = (onChange) => {
  if (typeof onChange !== "function") {
    console.error("subscribeShippingCost: onChange must be a function");
    return () => {};
  }

  try {
    const docRef = doc(db, CONFIG_COLLECTION, SHIPPING_CONFIG_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return onChange(0);
        const data = snap.data();
        onChange(toValidCost(data?.shippingCost));
      },
      (err) => {
        console.error("Error subscribing shipping cost:", err);
        onChange(0);
      }
    );
  } catch (error) {
    console.error("subscribeShippingCost failed:", error);
    return () => {};
  }
};
