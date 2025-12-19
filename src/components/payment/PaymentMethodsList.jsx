// src/components/payment/PaymentMethodsList.jsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PaymentMethodCard from "./PaymentMethodCard";
import { useTheme } from "../../theme/useTheme";

const ARABIC_DIGITS = ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?"];

export default function PaymentMethodsList({
  methods = [],
  loading,
  onDelete,
  onSetDefault,
  t,
  lang = "en",
}) {
  const { colors, shadow, radius, spacing } = useTheme();

  const toArabic = (num) => {
    if (lang !== "ar") return num;
    return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
  };

  const stats = useMemo(() => {
    return {
      count: methods.length,
      cards: methods.filter((m) => m.type === "card").length,
      wallets: methods.filter((m) => m.type === "wallet").length,
    };
  }, [methods]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: shadow.color,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          shadowOffset: shadow.offset,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View>
          <Text style={[styles.heading, { color: colors.text }]}>
            {t("payments.activeMethods")}
          </Text>

          <Text
            style={[
              styles.sub,
              {
                color: colors.textMuted,
                writingDirection: lang === "ar" ? "rtl" : "ltr",
              },
            ]}
          >
            {t("payments.savedCount", {
              count: toArabic(stats.count),
              cards: toArabic(stats.cards),
              wallets: toArabic(stats.wallets),
            })}
          </Text>
        </View>

        <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
      </View>

      {/* List */}
      <View style={[styles.list, { gap: spacing.sm }]}>
        {methods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            onMakeDefault={() => onSetDefault(method)}
            onDelete={() => onDelete(method)}
            t={t}
            lang={lang}
          />
        ))}

        {/* Empty State */}
        {methods.length === 0 && (
          <View
            style={[
              styles.empty,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.md,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t("payments.noMethods")}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    elevation: 6,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 12 },
  list: { gap: 10 },
  empty: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { textAlign: "center", fontSize: 13 },
});
