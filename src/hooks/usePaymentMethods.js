// src/hooks/usePaymentMethods.js
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

export const usePaymentMethods = (userId) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultMethod = useMemo(() => methods.find((method) => method.isDefault), [methods]);
  const activeCards = useMemo(() => methods.filter((method) => method.type === "card"), [methods]);
  const activeWallets = useMemo(() => methods.filter((method) => method.type === "wallet"), [methods]);

  useEffect(() => {
    if (!userId) {
      setMethods([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const colRef = collection(db, "users", userId, "paymentMethods");
    getDocs(query(colRef))
      .then((snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aDate = a.createdAt?.toMillis?.() || 0;
            const bDate = b.createdAt?.toMillis?.() || 0;
            return bDate - aDate;
          });
        setMethods(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load payment methods", err);
        setLoading(false);
      });
  }, [userId]);

  const ensureSingleDefault = async (keepId) => {
    if (!userId || !keepId) return;

    const colRef = collection(db, "users", userId, "paymentMethods");
    const snap = await getDocs(colRef);
    const tasks = snap.docs.map((d) =>
      updateDoc(d.ref, {
        isDefault: d.id === keepId,
      })
    );

    await Promise.all(tasks);
  };

  const refreshMethods = async () => {
    if (!userId) return [];

    const colRef = collection(db, "users", userId, "paymentMethods");
    const snap = await getDocs(colRef);

    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    data.sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;

      const aDate = a.createdAt?.toMillis?.() || 0;
      const bDate = b.createdAt?.toMillis?.() || 0;
      return bDate - aDate;
    });

    return data;
  };

  const addCard = async (cardData, detectBrand, generateId) => {
    if (!userId) return;

    const id = generateId();
    const sanitizedNumber = cardData.number.replace(/\s+/g, "");
    const brand = detectBrand(sanitizedNumber);

    const newMethod = {
      id,
      type: "card",
      brand,
      holder: cardData.holder,
      last4: sanitizedNumber.slice(-4),
      nickname: cardData.nickname.trim(),
      isDefault: methods.length === 0 || !methods.some((m) => m.isDefault),
      createdAt: serverTimestamp(),
    };

    const ref = doc(db, "users", userId, "paymentMethods", id);
    await setDoc(ref, newMethod);

    await ensureSingleDefault(newMethod.isDefault ? id : methods.find((m) => m.isDefault)?.id || id);

    const updatedMethods = await refreshMethods();
    setMethods(updatedMethods);
    return updatedMethods;
  };

  const deleteMethod = async (methodId) => {
    if (!userId || !methodId) return;
    const ref = doc(db, "users", userId, "paymentMethods", methodId);

    await deleteDoc(ref);

    const data = await refreshMethods();

    const hasDefault = data.some((method) => method.isDefault);
    if (!hasDefault && data[0]) {
      await ensureSingleDefault(data[0].id);
      const refreshed = await refreshMethods();
      setMethods(refreshed);
      return refreshed;
    }

    setMethods(data);
    return data;
  };

  const setDefault = async (methodId) => {
    await ensureSingleDefault(methodId);
    const updated = await refreshMethods();
    setMethods(updated);
  };

  return {
    methods,
    setMethods,
    loading,
    defaultMethod,
    activeCards,
    activeWallets,
    addCard,
    deleteMethod,
    setDefault,
  };
};
