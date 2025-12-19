// src/screens/OrdersList.js
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/useTheme";

const AR_DIGITS = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
const toArabic = (value, lang) => {
  if (lang !== "ar") return value?.toString();
  return value?.toString().replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
};

export default function OrdersList() {
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { colors, shadow, radius, spacing } = useTheme();

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    const listBy = (field, value) => query(collection(db, "orders"), where(field, "==", value));

    const merged = new Map();
    const apply = (snap) => {
      snap.docs.forEach((d) => merged.set(d.id, { id: d.id, ...d.data() }));

      const sorted = Array.from(merged.values()).sort((a, b) => {
        const ad = a.createdAt?.toMillis?.() ?? new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bd = b.createdAt?.toMillis?.() ?? new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bd - ad;
      });

      setOrders(sorted);
      setLoading(false);
    };

    const unsubscribers = [];
    unsubscribers.push(onSnapshot(listBy("userId", user.uid), apply));
    unsubscribers.push(onSnapshot(listBy("uid", user.uid), apply));
    if (user.email) unsubscribers.push(onSnapshot(listBy("userEmail", user.email), apply));

    return () => unsubscribers.forEach((u) => u && u());
  }, [user?.uid, user?.email]);

  const formatTotal = (o) => {
    const total = o?.totals?.total ?? o.total ?? 0;
    const value = Number(total).toFixed(2);
    return `EGP ${toArabic(value, lang)}`;
  };

  const displayReference = (o) => {
    const ref = o.reference || o.orderNumber || o.code || o.id;
    return toArabic(ref, lang);
  };

  const formatStatus = (status = "") => {
    const s = status.toLowerCase().replace(/\s+/g, "_");
    if (s === "out_for_delivery") return t("orders.status.out_for_delivery", "Out for delivery");
    return t(`orders.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
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
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: colors.text }]}>{t("account.order_history", "My orders")}</Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }]}
      >
        {loading && (
          <Text style={{ textAlign: "center", color: colors.textMuted, marginVertical: spacing.sm }}>
            {t("orders.loading", "Loading orders...")}
          </Text>
        )}

        {orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                shadowColor: shadow.color,
                shadowOpacity: shadow.opacity,
                shadowRadius: shadow.radius,
                shadowOffset: shadow.offset,
                borderRadius: radius.lg,
                padding: spacing.md,
              },
            ]}
            onPress={() => {
              const status = (order.status || "").toLowerCase().replace(/\s+/g, "_");
              if (status === "delivered") {
                navigation.navigate("Invoice", { order });
              } else {
                navigation.navigate("Orders", { order });
              }
            }}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: `${colors.primary}22`,
                  width: 36,
                  height: 36,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{displayReference(order)}</Text>

              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {t("orders.statusLabel", "Status")}: {formatStatus(order.status)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.total, { color: colors.text }]}>{formatTotal(order)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

        {!orders.length && !loading && (
          <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: spacing.lg }}>
            {t("orders.empty", "No orders yet.")}
          </Text>
        )}
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
    elevation: 2,
  },
  topTitle: { fontSize: 16, fontWeight: "800" },
  content: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  total: { fontSize: 13, fontWeight: "800" },
});
