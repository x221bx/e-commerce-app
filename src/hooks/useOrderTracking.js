import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../services/firebase";
import useUserOrders from "./useUserOrders";

const buildTrackingUrl = (trackingNumber) =>
  `https://www.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`;

export const useOrderTracking = (userId) => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeOrderId = route.params?.orderId;

  const {
    orders: allOrders,
    loading,
    connectionError: ordersConnectionError,
    confirmDelivery,
  } = useUserOrders(userId);

  const orders = allOrders.filter(
    (order) => !["delivered", "canceled"].includes(order.status?.toLowerCase())
  );

  const [order, setOrder] = useState(null);
  const [orderConnectionError, setOrderConnectionError] = useState(false);

  const targetOrderId = useMemo(
    () => routeOrderId || orders?.[0]?.id || null,
    [routeOrderId, orders]
  );

  useEffect(() => {
    if (!targetOrderId) {
      setOrder(null);
      return undefined;
    }

    setOrderConnectionError(false);
    const orderRef = doc(db, "orders", targetOrderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null);
          return;
        }
        const data = snap.data();
        setOrder({
          id: snap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null,
        });
        setOrderConnectionError(false);
      },
      (err) => {
        console.error("OrderTracking onSnapshot error", err);
        setOrder(null);
        if (err.message?.includes("blocked") || err.code === "unavailable") {
          setOrderConnectionError(true);
        }
      }
    );

    return () => unsubscribe();
  }, [targetOrderId]);

  const handleSelectOrder = (id) => {
    navigation.setParams?.({ orderId: id });
  };

  return {
    orders,
    order,
    loading,
    orderConnectionError,
    ordersConnectionError,
    handleSelectOrder,
    buildTrackingUrl,
    confirmDelivery,
  };
};

export default useOrderTracking;
