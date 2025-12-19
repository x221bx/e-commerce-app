import React, { useMemo } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import OrderItemsList from "../components/orderTracking/OrderItemsList";
import { useTheme } from "../theme/useTheme";

export default function Invoice() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, shadow, radius, spacing, mode } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";
  const order = route.params?.order;

  const digits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
  const toArabicNumber = (value) => {
    if (!value && value !== 0) return "-";
    if (!isRTL) return value?.toString();
    return value?.toString().replace(/\d/g, (d) => digits[Number(d)]);
  };

  const normalizeStatus = (s = "") => s.toLowerCase().replace(/[\s-]+/g, "_");
  const displayReference = (o) => {
    const ref = o?.reference || o?.orderNumber || o?.code || o?.id || "-";
    return isRTL ? toArabicNumber(ref) : ref;
  };
  const asDate = (val) => {
    if (val?.toDate) return val.toDate();
    if (typeof val === "string") return new Date(val);
    return new Date(val || Date.now());
  };
  const formatDate = (val) => {
    const formatted = asDate(val).toLocaleString(isRTL ? "ar-EG" : "en-US");
    return isRTL ? toArabicNumber(formatted) : formatted;
  };
  const formatCurrency = (val) => {
    const num = Number(val || 0).toFixed(2);
    return isRTL ? `${toArabicNumber(num)} E£` : `EGP ${num}`;
  };

  const totals = useMemo(() => {
    const total = Number(order?.totals?.total ?? order?.total ?? 0);
    const subtotal = Number(order?.totals?.subtotal ?? order?.subtotal ?? total);
    const shipping = Number(order?.totals?.shipping ?? order?.shipping ?? 0);
    return { total, subtotal, shipping };
  }, [order]);

  const statusLabel = t(
    `orders.status.${normalizeStatus(order?.status || "processing")}`,
    order?.status || "processing"
  );

  const paymentLabel =
    order?.paymentDetails?.label ||
    ((order?.paymentMethod || "").toLowerCase() === "paymob_card"
      ? t("checkout.payment.paymobLabel", "Paymob secure card")
      : (order?.paymentMethod || "").toLowerCase() === "paymob_wallet"
        ? t("checkout.payment.paymobWalletLabel", "Paymob wallet")
      : (order?.paymentMethod || "").toLowerCase() === "paypal"
        ? t("checkout.payment.paypalLabel", "PayPal")
        : (order?.paymentMethod || "").toLowerCase() === "cash"
          ? t("checkout.payment.cash", "Cash on Delivery")
          : order?.paymentMethod || t("checkout.payment.cash"));

  const paymentStatusLabel = order?.paymentStatus
    ? t(`payments.status.${order.paymentStatus}`, order.paymentStatus)
    : null;

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, writingDirection: isRTL ? "rtl" : "ltr" }]}>
        <View style={[styles.topBar, { padding: spacing.md, flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text, textAlign: "center", flex: 1 }]}>
            {t("orders.invoice", "Invoice")}
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ padding: spacing.lg }}>
          <Text style={{ color: colors.text, textAlign: isRTL ? "right" : "left" }}>
            {t("orders.empty", "No orders yet.")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, writingDirection: isRTL ? "rtl" : "ltr" }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.iconBtn,
            {
              backgroundColor: colors.surface,
              shadowColor: shadow.color,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              shadowOffset: shadow.offset,
            },
          ]}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, textAlign: "center", flex: 1 }]}>
          {t("orders.invoice", "Invoice")}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, writingDirection: isRTL ? "rtl" : "ltr" }}>
        <View
          style={[
            styles.summary,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: shadow.color,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              shadowOffset: shadow.offset,
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: spacing.xs,
            },
          ]}
        >
          <Text style={[styles.invoiceTitle, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}>
            {displayReference(order)}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
            {t("orders.statusLabel", "Status")}: {statusLabel}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
            {t("orders.createdAt", "Created at")}: {formatDate(order?.createdAt)}
          </Text>
          <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t("checkout.summary.subtotal", "Subtotal")}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatCurrency(totals.subtotal)}</Text>
          </View>
          <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t("checkout.summary.shipping", "Shipping")}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatCurrency(totals.shipping)}</Text>
          </View>
          <View
            style={[
              styles.row,
              { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs, flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t("checkout.summary.total", "Total")}</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(totals.total)}</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
            {t("checkout.summary.payment", "Payment")}: {paymentLabel}
          </Text>
          {paymentStatusLabel ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("payments.statusLabel", "Payment status")}: {paymentStatusLabel}
            </Text>
          ) : null}
          {order?.paymentDetails?.paymobOrderId ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("payments.paymobOrder", "Paymob order")}: {order.paymentDetails.paymobOrderId}
            </Text>
          ) : null}
          {order?.paymentDetails?.walletPhone ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("checkout.payment.paymobWalletLabel", "Paymob wallet")}: {order.paymentDetails.walletPhone}
            </Text>
          ) : null}
          {order?.paymentDetails?.paypalOrderId ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("payments.paypalOrder", "PayPal order")}: {order.paymentDetails.paypalOrderId}
            </Text>
          ) : null}
          {order?.paymentDetails?.paypalCaptureId ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("payments.paypalCapture", "PayPal capture")}: {order.paymentDetails.paypalCaptureId}
            </Text>
          ) : null}
          {order?.paymentDetails?.last4 ? (
            <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? "right" : "left" }]}>
              {t("checkout.summary.payment", "Payment")}: {(order?.paymentDetails?.holder || "").toUpperCase()} **** {toArabicNumber(order?.paymentDetails?.last4)}
            </Text>
          ) : null}
        </View>

        <OrderItemsList items={order?.items || []} isDark={mode === "dark"} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "800" },
  summary: { borderWidth: 1, elevation: 2 },
  invoiceTitle: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 13 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, fontWeight: "600" },
  value: { fontSize: 13, fontWeight: "700" },
  totalLabel: { fontSize: 14, fontWeight: "800" },
  totalValue: { fontSize: 14, fontWeight: "800" },
});
