// src/components/ordertracking/OrderTrackingHeader.jsx
import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/useTheme";

export default function OrderTrackingHeader({
  orders = [],
  selectedOrder,
  onSelectOrder,
  isDark: propIsDark,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigation = useNavigation();
  const { colors, radius, spacing, mode } = useTheme();
  const isDark = typeof propIsDark === "boolean" ? propIsDark : mode === "dark";


  const toArabic = (value) => {
    if (lang !== "ar") return value?.toString();
    const digits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
    return value?.toString().replace(/\d/g, (d) => digits[Number(d)]);
  };


  const displayReference = (o) => {
    const ref = o?.reference || o?.orderNumber || o?.code || o?.id;
    return toArabic(ref);
  };

  return (
    <View
      style={[
        styles.container,
        {
          gap: spacing.md,
          writingDirection: lang === "ar" ? "rtl" : "ltr",
        },
      ]}
    >
      {/* ------------------ HEADER TEXT ------------------ */}
      <View
        style={[
          styles.topRow,
          {
            gap: spacing.md,
            flexDirection: lang === "ar" ? "row-reverse" : "row",
          },
        ]}
      >
        <View
          style={[
            styles.titleBlock,
            {
              gap: spacing.xs,
              alignItems: lang === "ar" ? "flex-end" : "flex-start",
            },
          ]}
        >
          <Text
            style={[
              styles.eyebrow,
              {
                color: colors.primary,
                textAlign: lang === "ar" ? "right" : "left",
              },
            ]}
          >
            {t("tracking.eyebrow", "Track your recent purchases")}
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                textAlign: lang === "ar" ? "right" : "left",
              },
            ]}
          >
            {t("tracking.title", "Order Tracking")}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textMuted,
                textAlign: lang === "ar" ? "right" : "left",
              },
            ]}
          >
            {t(
              "tracking.subtitle",
              "We watch your order for updates and refresh the timeline live."
            )}
          </Text>
        </View>

        {/* ------------------ VIEW ALL ORDERS BUTTON ------------------ */}
        <Pressable
          onPress={() => navigation.navigate("OrdersList")}
          style={({ pressed }) => [
            styles.subtleBtn,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.subtleText,
              {
                color: colors.text,
                textAlign: lang === "ar" ? "right" : "left",
              },
            ]}
          >
            {t("tracking.viewAllOrders", "View all orders")}
          </Text>
        </Pressable>
      </View>

      {/* ------------------ SCROLL TABS ------------------ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabRow,
          {
            gap: spacing.sm,
            flexDirection: lang === "ar" ? "row-reverse" : "row",
          },
        ]}
      >
        {orders.map((order, index) => {
          const active = selectedOrder?.id === order.id;
          const tabKey =
            order.id ||
            order.reference ||
            order.orderNumber ||
            order.code ||
            `order-tab-${index}`;
          return (
            <Pressable
              key={tabKey}
              onPress={() => onSelectOrder(order.id)}
              style={({ pressed }) => [
                styles.tab,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm + 2,
                },
                active && {
                  borderColor: colors.primary,
                  backgroundColor: colors.surfaceMuted,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? colors.primary : colors.text,
                    textAlign: "center",
                  },
                ]}
              >
                {displayReference(order)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleBlock: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 18 },
  subtleBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  subtleText: { fontSize: 13, fontWeight: "700" },
  tabRow: { gap: 8, paddingVertical: 4 },
  tab: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabText: { fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
