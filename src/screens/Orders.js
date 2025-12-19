// src/screens/orders.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { db } from "../services/firebase";
import { selectCurrentUser } from "../features/auth/authSlice";
import OrderTrackingHeader from "../components/orderTracking/OrderTrackingHeader";
import OrderTimeline from "../components/orderTracking/OrderTimeline";
import OrderItemsList from "../components/orderTracking/OrderItemsList";
import { useTheme } from "../theme/useTheme";

const AR_DIGITS = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
const toArabic = (value, lang) => {
  if (lang !== "ar") return value?.toString();
  return value?.toString().replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
};

const statusToLower = (s = "") => s.toLowerCase().replace(/[\s-]+/g, "_");

export default function Orders() {
  const navigation = useNavigation();
  const route = useRoute();
  const orderFromRoute = route.params?.order;
  const user = useSelector(selectCurrentUser);
  const { colors, shadow, radius, spacing, mode } = useTheme();
  const isDark = mode === "dark";
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [orders, setOrders] = useState(orderFromRoute ? [orderFromRoute] : []);
  const [selectedOrder, setSelectedOrder] = useState(orderFromRoute || null);

  const statusLabel = (s = "") => {
    const key = statusToLower(s);
    switch (key) {
      case "pending_payment":
      case "awaiting_payment":
        return t("tracking.status.pending_payment", "Pending payment");
      case "pending":
        return t("tracking.status.pending", "Pending");
      case "processing":
        return t("tracking.status.processing", "Processing");
      case "shipped":
        return t("tracking.status.shipped", "Shipped");
      case "out_for_delivery":
      case "in_transit":
        return t("tracking.status.out_for_delivery", "Out for delivery");
      case "delivered":
        return t("tracking.status.delivered", "Delivered");
      case "cancelled":
      case "canceled":
        return t("tracking.status.cancelled", "Cancelled");
      default:
        return key || t("tracking.status.unknown", "Unknown");
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const byField = (field, value) => query(collection(db, "orders"), where(field, "==", value));
    const merged = new Map();

    const handleSnapshot = (snap) => {
      snap.docs.forEach((d) => merged.set(d.id, { id: d.id, ...d.data() }));

      const sorted = Array.from(merged.values()).sort((a, b) => {
        const ad = a.createdAt?.toMillis?.() ?? new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bd = b.createdAt?.toMillis?.() ?? new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bd - ad;
      });

      setOrders(sorted);
      if (orderFromRoute?.id) {
        const match = sorted.find((o) => o.id === orderFromRoute.id);
        setSelectedOrder(match || orderFromRoute);
      } else if (!selectedOrder && sorted.length) {
        setSelectedOrder(sorted[0]);
      }
    };

    const unsubscribers = [
      onSnapshot(byField("uid", user.uid), handleSnapshot),
      onSnapshot(byField("userId", user.uid), handleSnapshot),
    ];
    if (user.email) unsubscribers.push(onSnapshot(byField("userEmail", user.email), handleSnapshot));

    return () => unsubscribers.forEach((u) => u && u());
  }, [user?.uid, user?.email, orderFromRoute?.id, selectedOrder]);

  useEffect(() => {
    if (orderFromRoute) setSelectedOrder(orderFromRoute);
  }, [orderFromRoute]);

  const displayReference = (o) => toArabic(o?.reference || o?.orderNumber || o?.code || o?.id, lang);

  const formatDate = (val) => {
    const d =
      val?.toDate?.() ||
      (typeof val === "string" ? new Date(val) : val instanceof Date ? val : new Date(val || Date.now()));
    return toArabic(d.toLocaleString(lang === "ar" ? "ar-EG" : "en-US"), lang);
  };

  const computedTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return (selectedOrder.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  }, [selectedOrder]);

  const currentStatus = statusToLower(selectedOrder?.status || "pending");
  const paymentStatusLabel =
    selectedOrder?.paymentStatus === "paid"
      ? t("payments.statusPaid", "Paid")
      : selectedOrder?.paymentStatus === "pending"
        ? t("payments.statusPending", "Pending")
        : t("payments.statusUnpaid", "Unpaid");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md }}
      >
        <View style={[styles.topBar, { marginBottom: spacing.sm }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.md,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t("orders.title", "My Orders")}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Orders list */}
        <View style={{ gap: spacing.sm }}>
          {(orders || []).map((order) => {
            const selected = selectedOrder?.id === order.id;
            return (
              <TouchableOpacity
                key={order.id}
                onPress={() => setSelectedOrder(order)}
                style={[
                  styles.orderCard,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: colors.card,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <Text style={[styles.orderRef, { color: colors.text }]}>{displayReference(order)}</Text>
                <Text style={{ color: colors.textMuted }}>
                  {formatDate(order.createdAt || order.updatedAt)} · {statusLabel(order.status || "pending")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedOrder ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                padding: spacing.md,
                shadowColor: shadow.color,
                shadowOpacity: shadow.opacity,
                shadowRadius: shadow.radius,
                shadowOffset: shadow.offset,
              },
            ]}
          >
            <OrderTrackingHeader
              order={selectedOrder}
              displayReference={displayReference}
              statusToLower={statusToLower}
              toArabic={(v) => toArabic(v, lang)}
              colors={colors}
              isDark={isDark}
              t={t}
            />

            <OrderTimeline
              order={selectedOrder}
              statusHistory={selectedOrder.statusHistory || []}
              currentStatus={statusToLower(selectedOrder.status || "pending")}
              formatDate={formatDate}
              colors={colors}
            />

            <OrderItemsList items={selectedOrder.items || []} colors={colors} />

            <View style={[styles.invoice, { borderColor: colors.border, marginTop: spacing.md }]}>
              <Text style={[styles.invoiceTitle, { color: colors.text }]}>{t("orders.invoice", "Invoice details")}</Text>

              <View style={styles.invoiceRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t("orders.reference", "Reference")}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{displayReference(selectedOrder)}</Text>
              </View>

              <View style={styles.invoiceRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t("orders.createdAt", "Created at")}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{formatDate(selectedOrder.createdAt)}</Text>
              </View>

              <View style={styles.invoiceRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t("payments.statusLabel", "Payment status")}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{paymentStatusLabel}</Text>
              </View>

              {selectedOrder?.paymentDetails?.walletPhone && (
                <View style={styles.invoiceRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t("checkout.payment.paymobWalletLabel", "Paymob wallet")}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{selectedOrder.paymentDetails.walletPhone}</Text>
                </View>
              )}

              {selectedOrder?.paymentDetails?.last4 && (
                <View style={styles.invoiceRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t("checkout.payment.card")}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {(selectedOrder?.paymentDetails?.holder || "").toUpperCase()} **** {toArabic(selectedOrder.paymentDetails.last4, lang)}
                  </Text>
                </View>
              )}

              {selectedOrder?.paymentDetails?.paypalOrderId && (
                <View style={styles.invoiceRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t("payments.paypalOrder", "PayPal order")}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{selectedOrder.paymentDetails.paypalOrderId}</Text>
                </View>
              )}

              {selectedOrder?.paymentDetails?.paypalCaptureId && (
                <View style={styles.invoiceRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t("payments.paypalCapture", "PayPal capture")}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{selectedOrder.paymentDetails.paypalCaptureId}</Text>
                </View>
              )}

              {selectedOrder?.shipping?.addressLine1 && (
                <View style={styles.invoiceRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t("orders.shippingAddress", "Shipping address")}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{selectedOrder.shipping.addressLine1}</Text>
                </View>
              )}

              {selectedOrder?.notes ? (
                <View style={styles.invoiceRow}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t("orders.notes", "Notes")}</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{selectedOrder.notes}</Text>
                </View>
              ) : null}

              <View style={styles.invoiceRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t("orders.total", "Total")}</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {toArabic((computedTotal + Number(selectedOrder?.totals?.shipping || 0)).toFixed(2), lang)} EGP
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800" },
  orderCard: { padding: 12, borderWidth: 1, borderRadius: 14, gap: 4 },
  orderRef: { fontSize: 16, fontWeight: "800" },
  section: { gap: 12 },
  invoice: { marginTop: 12, borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  invoiceTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  invoiceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: 8 },
  label: { fontSize: 13, fontWeight: "700" },
  value: { fontSize: 13, fontWeight: "700" },
});
