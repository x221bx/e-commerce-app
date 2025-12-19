// src/hooks/useUserOrders.js
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";

const STATUS_FLOW = ["Pending", "Processing", "Shipped", "Delivered"];

export default function useOrders(uid = null, isAdmin = false, deliveryId = null) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const sortOrders = useCallback((list) => {
    return [...list].sort((a, b) => {
      const ad = a.createdAt?.toMillis?.() ?? new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bd = b.createdAt?.toMillis?.() ?? new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bd - ad;
    });
  }, []);

  const buildQuery = useCallback(() => {
    const ordersRef = collection(db, "orders");
    if (isAdmin || (!uid && !deliveryId)) {
      return query(ordersRef, orderBy("createdAt", "desc"));
    }
    if (deliveryId) {
      return query(ordersRef, where("deliveryId", "==", deliveryId));
    }
    return query(ordersRef, where("uid", "==", uid));
  }, [uid, isAdmin, deliveryId]);

  const snapshotToOrders = (snapshot) =>
    snapshot.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
      };
    });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      setOrders(sortOrders(snapshotToOrders(snapshot)));
    } catch (err) {
      console.error("fetchOrders error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, sortOrders]);

  useEffect(() => {
    setLoading(true);
    const q = buildQuery();
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setOrders(sortOrders(snapshotToOrders(snapshot)));
        setLoading(false);
      },
      (err) => {
        console.error("orders onSnapshot error:", err);
        fetchOrders();
      }
    );
    return () => unsub();
  }, [buildQuery, fetchOrders, sortOrders]);

  const reduceStock = async (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const batch = writeBatch(db);
    items.forEach((i) => {
      if (!i.id || !i.quantity) return;
      const ref = doc(db, "products", i.id);
      batch.update(ref, { stock: increment(-Math.abs(i.quantity)) });
    });
    await batch.commit();
  };

  const restoreStock = async (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const batch = writeBatch(db);
    items.forEach((i) => {
      if (!i.id || !i.quantity) return;
      const ref = doc(db, "products", i.id);
      batch.update(ref, { stock: increment(Math.abs(i.quantity)) });
    });
    try {
      await batch.commit();
    } catch (err) {
      if (err.code === "not-found") {
        console.warn("restoreStock: some products not found, skipped");
      } else {
        throw err;
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus, restoreStockFn, actor = "admin") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    if (newStatus === "Canceled" && typeof restoreStockFn === "function") {
      const itemsToRestore = (order.items || []).map((it) => ({
        id: it.productId,
        quantity: Number(it.quantity || 0),
      }));
      if (itemsToRestore.length) await restoreStockFn(itemsToRestore);
    }

    await updateDoc(doc(db, "orders", orderId), {
      status: newStatus,
      statusHistory: [
        ...(order.statusHistory || []),
        { status: newStatus, changedAt: new Date().toISOString(), actor },
      ],
    });
  };

  const deleteOrder = async (orderId, restoreStockFn) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && !["Shipped", "Delivered"].includes(order.status)) {
      if (typeof restoreStockFn === "function") {
        const itemsToRestore = (order.items || []).map((it) => ({
          id: it.productId,
          quantity: Number(it.quantity || 0),
        }));
        if (itemsToRestore.length) await restoreStockFn(itemsToRestore);
      }
    }
    await deleteDoc(doc(db, "orders", orderId));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  return {
    orders,
    loading,
    fetchOrders,
    updateOrderStatus,
    deleteOrder,
    reduceStock,
    restoreStock,
    STATUS_FLOW,
  };
}
