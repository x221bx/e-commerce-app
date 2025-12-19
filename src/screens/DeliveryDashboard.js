import React, { useMemo, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import { selectCurrentUser } from "../features/auth/authSlice";
import { useTheme } from "../theme/useTheme";
import useOrders from "../hooks/useOrders";

const normalizeStatus = (status = "") => status.toLowerCase().replace(/\s+/g, "_");

const formatStatusLabel = (status, t) => {
  const normalized = normalizeStatus(status);
  if (normalized === "out_for_delivery") {
    return t("orders.status.out_for_delivery", "Out for delivery");
  }
  return t(`orders.status.${normalized}`, status || "Pending");
};

export default function DeliveryDashboard() {
  const user = useSelector(selectCurrentUser);
  const navigation = useNavigation();
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const { t } = useTranslation();

  // Hide the default navigator header so only the custom nav bar shows.
  useLayoutEffect(() => {
    navigation?.setOptions?.({ headerShown: false });
  }, [navigation]);

  const courierId = user?.uid;
  const isDelivery = user?.role === "delivery" || user?.isDelivery;

  const { orders, loading, fetchOrders, updateOrderStatus, cancelOrder } = useOrders(
    null,
    false,
    courierId
  );

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const stats = useMemo(() => {
    const activeStatuses = new Set([
      "pending_payment",
      "pending",
      "processing",
      "shipped",
      "out_for_delivery",
    ]);
    const completedStatuses = new Set(["delivered", "canceled", "cancelled"]);
    const normalized = (o) => normalizeStatus(o.status || "pending");
    const active = orders.filter((o) => activeStatuses.has(normalized(o)));
    const completed = orders.filter((o) => completedStatuses.has(normalized(o)));

    return {
      total: orders.length,
      active: active.length,
      completed: completed.length,
      awaitingPickup: orders.filter((o) => ["pending_payment", "pending", "processing"].includes(normalized(o))).length,
    };
  }, [orders]);

  const activeOrders = useMemo(
    () =>
      orders.filter((o) => {
        const s = normalizeStatus(o.status || "pending");
        return !["delivered", "canceled", "cancelled"].includes(s);
      }),
    [orders]
  );

  const historyOrders = useMemo(
    () =>
      orders
        .filter((o) => ["delivered", "canceled", "cancelled"].includes(normalizeStatus(o.status || "")))
        .slice(0, 20),
    [orders]
  );

  const nextActionFor = (order) => {
    const s = normalizeStatus(order.status || "");
    if (["pending_payment", "pending", "processing"].includes(s)) {
      return { label: t("delivery.actions.start", "Out for delivery"), next: "out_for_delivery" };
    }
    if (s === "shipped") {
      return { label: t("delivery.actions.out_for_delivery", "Out for delivery"), next: "out_for_delivery" };
    }
    if (s === "out_for_delivery") {
      return { label: t("delivery.actions.delivered", "Mark delivered"), next: "delivered" };
    }
    return null;
  };

  const canCancelOrder = (order) => {
    const s = normalizeStatus(order.status || "");
    return ["pending_payment", "pending", "processing", "shipped", "out_for_delivery"].includes(s);
  };

  const handleAdvance = async (order) => {
    const action = nextActionFor(order);
    if (!action) return;

    try {
      await updateOrderStatus(order.id, action.next, null, "courier");
    } catch (error) {
      Alert.alert(
        t("common.error", "Error"),
        error?.message || t("delivery.errors.status", "Could not update status.")
      );
    }
  };

  const handleCancelOrder = (order) => {
    setSelectedOrderForCancel(order);
    setCancellationReason("");
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrderForCancel) return;

    try {
      await cancelOrder(selectedOrderForCancel.id, cancellationReason, "courier");
      Alert.alert(t("common.success", "Success"), t("delivery.actions.cancelSuccess", "Order cancelled successfully"));
      setCancelModalVisible(false);
    } catch (error) {
      Alert.alert(
        t("common.error", "Error"),
        error?.message || t("delivery.errors.cancel", "Could not cancel order.")
      );
    }
  };

  if (!isDelivery) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>
          {t("delivery.no_access", "Delivery area is restricted to couriers.")}
        </Text>
      </View>
    );
  }

  const renderOrderCard = (order, showActions = false) => {
    const statusLabel = formatStatusLabel(order.status, t);
    const action = nextActionFor(order);

    const lastUpdate =
      order.statusHistory?.[order.statusHistory.length - 1]?.changedAt ||
      order.updatedAt ||
      order.createdAt ||
      null;

    const displayAddress = isDelivery
      ? t("delivery.assigned_order", "Assigned Order")
      : order.shipping?.addressLine1 || order.address || t("delivery.no_address", "No address");

    return (
      <View
        key={order.id}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: shadow.color,
            shadowOpacity: shadow.opacity,
            shadowRadius: shadow.radius,
            shadowOffset: shadow.offset,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="cube-outline" size={18} color={colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {order.reference || order.orderNumber || order.id}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]} numberOfLines={1}>
              {displayAddress}
            </Text>
          </View>

          <Text style={[styles.statusPill, { backgroundColor: `${colors.primary}15`, color: colors.primary }]}>
            {statusLabel}
          </Text>
        </View>

        <View style={[styles.cardRow, { marginTop: spacing.sm }]}>
          <Text style={{ color: colors.textMuted }}>
            {t("delivery.last_update", "Last update")}: {" "}
            {lastUpdate ? new Date(lastUpdate).toLocaleString() : t("delivery.not_available", "N/A")}
          </Text>
        </View>

        <View style={[styles.actionsRow, { marginTop: spacing.sm }]}>
          <TouchableOpacity
            style={[
              styles.linkBtn,
              { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm },
            ]}
            onPress={() => navigation.navigate("Orders", { order })}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.text} />
            <Text style={{ color: colors.text, marginLeft: 6 }}>{t("delivery.view_order", "View order")}</Text>
          </TouchableOpacity>

          {showActions && action && (
            <TouchableOpacity
              onPress={() => handleAdvance(order)}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
              ]}
              disabled={loading}
            >
              <Text style={{ color: colors.surface, fontWeight: "700" }}>{action.label}</Text>
            </TouchableOpacity>
          )}

          {showActions && canCancelOrder(order) && (
            <TouchableOpacity
              onPress={() => handleCancelOrder(order)}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: colors.error || "#DC2626",
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginLeft: spacing.sm,
                },
              ]}
              disabled={loading}
            >
              <Text style={{ color: colors.surface, fontWeight: "700" }}>
                {t("delivery.actions.cancel", "Cancel")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          gap: spacing.md,
        }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={colors.primary} />}
      >
        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xl }]}>
          {t("delivery.title", "Delivery workspace")}
        </Text>

        <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>
          {t("delivery.subtitle", "Track your assigned orders and update their status.")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {user?.displayName || user?.name || "Courier"}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>{user?.email}</Text>

          <View style={[styles.badgesRow, { marginTop: spacing.sm }]}>
            <Badge label={user?.zone || t("delivery.no_zone", "No zone set")} icon="location-outline" colors={colors} />
            <Badge label={user?.vehicleType || t("delivery.no_vehicle", "Vehicle not set")} icon="car-outline" colors={colors} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Stat label={t("delivery.stats.active", "Active")} value={stats.active} icon="bicycle-outline" colors={colors} radius={radius} />
          <Stat label={t("delivery.stats.completed", "Completed")} value={stats.completed} icon="checkmark-done-outline" colors={colors} radius={radius} />
          <Stat label={t("delivery.stats.total", "Total")} value={stats.total} icon="list-outline" colors={colors} radius={radius} />
        </View>

        <SectionTitle label={t("delivery.active", "Active deliveries")} colors={colors} />

        {activeOrders.length === 0 ? (
          <EmptyState colors={colors} text={t("delivery.empty_active", "No active deliveries assigned yet.")} icon="cube-outline" />
        ) : (
          activeOrders.map((o) => renderOrderCard(o, true))
        )}

        <SectionTitle label={t("delivery.history", "History")} colors={colors} />

        {historyOrders.length === 0 ? (
          <EmptyState colors={colors} text={t("delivery.empty_history", "No completed deliveries yet.")} icon="time-outline" />
        ) : (
          historyOrders.map((o) => renderOrderCard(o, false))
        )}
      </ScrollView>

      <CancellationModal
        visible={cancelModalVisible}
        onClose={() => setCancelModalVisible(false)}
        onConfirm={confirmCancelOrder}
        title={t("delivery.actions.cancelTitle", "Cancel Order")}
        message={t("delivery.actions.cancelMessage", "Are you sure you want to cancel this order?")}
        reason={cancellationReason}
        setReason={setCancellationReason}
        t={t}
      />
    </>
  );
}

function Badge({ label, icon, colors }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: `${colors.primary}15`,
        borderRadius: 10,
      }}
    >
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={{ color: colors.primary, marginLeft: 6 }}>{label}</Text>
    </View>
  );
}

function SectionTitle({ label, colors }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
      <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: colors.primary }} />
      <Text style={{ color: colors.text, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, icon, colors, radius }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: `${colors.primary}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>

      <View>
        <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>{value}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
      </View>
    </View>
  );
}

function EmptyState({ text, icon, colors }) {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: { fontWeight: "800" },
  card: { width: "100%" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  cardSub: { fontSize: 13 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: "700", fontSize: 12 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  primaryBtn: { flexDirection: "row", alignItems: "center" },
  cancelBtn: { flexDirection: "row", alignItems: "center" },
  badgesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#0F172A" },
  modalMessage: { fontSize: 14, color: "#475569", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCancel: { backgroundColor: "#E2E8F0" },
  modalConfirm: { backgroundColor: "#DC2626" },
  modalCancelText: { color: "#0F172A", fontWeight: "700" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});

const CancellationModal = ({ visible, onClose, onConfirm, title, message, reason, setReason, t }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <TextInput
            style={styles.input}
            placeholder={t("delivery.actions.cancelReasonPlaceholder", "Enter cancellation reason")}
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <View style={styles.modalActions}>
            <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={onClose}>
              <Text style={styles.modalCancelText}>{t("common.cancel", "Cancel")}</Text>
            </Pressable>

            <Pressable style={[styles.modalButton, styles.modalConfirm]} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>{t("delivery.actions.cancelOrder", "Cancel Order")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export { CancellationModal };
