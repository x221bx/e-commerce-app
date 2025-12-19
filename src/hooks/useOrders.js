// src/hooks/useOrders.js
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
  Timestamp,
  increment,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

const STATUS_FLOW = ["Pending", "Processing", "Shipped", "Delivered"];

export default function useOrders(uid = null, isAdmin = false, deliveryId = null) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const sortOrders = useCallback((list) => {
    return [...list].sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

  const normalizeOrder = (d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      ...data,
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate().toISOString()
          : data.createdAt
            ? new Date(data.createdAt).toISOString()
            : new Date().toISOString(),
    };
  };

  const snapshotToOrders = (snapshot) => snapshot.docs.map((d) => normalizeOrder(d));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      const newOrders = sortOrders(snapshotToOrders(snapshot));
      setOrders(newOrders);
    } catch (err) {
      console.error("fetchOrders error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, sortOrders]);

  useEffect(() => {
    setLoading(true);

    if (deliveryId) {
      const ordersRef = collection(db, "orders");
      const subs = [];
      const merged = new Map();

      const handleSnap = (snap) => {
        snap.docs.forEach((d) => merged.set(d.id, normalizeOrder(d)));
        setOrders(sortOrders(Array.from(merged.values())));
        setLoading(false);
      };

      subs.push(
        onSnapshot(query(ordersRef, where("deliveryId", "==", deliveryId)), handleSnap, (err) => {
          console.error("orders onSnapshot error (deliveryId):", err);
          fetchOrders();
        })
      );
      subs.push(
        onSnapshot(query(ordersRef, where("assignedDeliveryId", "==", deliveryId)), handleSnap, (err) => {
          console.error("orders onSnapshot error (assignedDeliveryId):", err);
          fetchOrders();
        })
      );

      return () => subs.forEach((u) => u && u());
    }

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
  }, [buildQuery, fetchOrders, sortOrders, deliveryId]);

  const reduceStock = async (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const batch = writeBatch(db);
    items.forEach((i) => {
      if (!i.id) return;
      const q = Number(i.quantity || 0);
      if (q === 0) return;
      const ref = doc(db, "products", i.id);
      batch.update(ref, { stock: increment(-Math.abs(q)) });
    });
    await batch.commit();
  };

  const restoreStock = async (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    const batch = writeBatch(db);

    items.forEach((i) => {
      if (!i.id) return;
      const q = Number(i.quantity || 0);
      if (q === 0) return;
      const ref = doc(db, "products", i.id);
      batch.update(ref, { stock: increment(Math.abs(q)) });
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

  const updateOrderStatus = async (orderId, newStatus, restoreStockFn, actor = "admin", cancellationReason = null) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    if (newStatus === "Canceled" && typeof restoreStockFn === "function") {
      const itemsToRestore = (order.items || []).map((it) => ({
        id: it.productId,
        quantity: Number(it.quantity || 0),
      }));
      if (itemsToRestore.length) await restoreStockFn(itemsToRestore);
    }

    const statusEntry = {
      status: newStatus,
      changedAt: new Date().toISOString(),
      actor,
      ...(cancellationReason ? { cancellationReason } : {}),
    };

    await updateDoc(doc(db, "orders", orderId), {
      status: newStatus,
      statusHistory: [...(order.statusHistory || []), statusEntry],
      ...(cancellationReason && { cancellationReason }),
    });

    if (isAdmin && order.uid && newStatus !== order.status) {
      try {
        await addDoc(collection(db, "notifications"), {
          uid: order.uid,
          type: "order-status",
          category: "orders",
          title: `Order #${order.orderNumber} Update`,
          message: `Your order status has been updated to ${newStatus}`,
          createdAt: Timestamp.now(),
          read: false,
          target: "/account/tracking",
          meta: { orderId, status: newStatus },
        });
      } catch (error) {
        console.error("Failed to create order notification:", error);
      }
    }
  };

  const confirmDelivery = async (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Shipped") {
      throw new Error("Order must be shipped before confirming delivery");
    }
    if (isAdmin) {
      throw new Error("Admins cannot confirm delivery on behalf of customers");
    }
    if (order.uid !== uid) {
      throw new Error("You can only confirm delivery for your own orders");
    }

    await updateOrderStatus(orderId, "Delivered", null, "customer");
  };

  const deleteOrder = async (orderId, restoreStockFn) => {
    let order;
    try {
      order = orders.find((o) => o.id === orderId);
      if (order && order.status !== "Shipped" && order.status !== "Delivered") {
        if (typeof restoreStockFn === "function") {
          const itemsToRestore = (order.items || []).map((it) => ({
            id: it.productId,
            quantity: Number(it.quantity || 0),
          }));
          if (itemsToRestore.length) {
            try {
              await restoreStockFn(itemsToRestore);
            } catch (err) {
              console.error("restoreStockFn error:", err);
            }
          }
        }
      }
      await deleteDoc(doc(db, "orders", orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("deleteOrder failed:", err);
      throw err;
    }
  };

  const cancelOrder = async (orderId, cancellationReason, actor = "courier") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    const currentStatus = (order.status || "").toLowerCase();
    if (["delivered", "cancelled", "canceled"].includes(currentStatus)) {
      throw new Error("Order cannot be cancelled as it's already completed or cancelled");
    }

    if (["processing", "shipped", "out_for_delivery"].includes(currentStatus)) {
      const itemsToRestore = (order.items || []).map((it) => ({
        id: it.productId,
        quantity: Number(it.quantity || 0),
      }));
      if (itemsToRestore.length) {
        try {
          await restoreStock(itemsToRestore);
        } catch (err) {
          console.error("restoreStock error:", err);
        }
      }
    }

    await updateOrderStatus(orderId, "Canceled", null, actor, cancellationReason);

    if (order.uid) {
      try {
        await addDoc(collection(db, "notifications"), {
          uid: order.uid,
          type: "order-cancelled",
          category: "orders",
          title: `Order #${order.orderNumber} Cancelled`,
          message: `Your order has been cancelled. Reason: ${cancellationReason || "Not specified"}`,
          createdAt: Timestamp.now(),
          read: false,
          target: "/account/tracking",
          meta: { orderId, cancellationReason },
        });
      } catch (error) {
        console.error("Failed to create cancellation notification:", error);
      }
    }
  };

  return {
    orders,
    loading,
    fetchOrders,
    refreshOrders: fetchOrders,
    updateOrderStatus,
    confirmDelivery,
    deleteOrder,
    cancelOrder,
    reduceStock,
    restoreStock,
    STATUS_FLOW,
  };
}
