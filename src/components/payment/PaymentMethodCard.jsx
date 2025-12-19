// src/components/payment/PaymentMethodCard.jsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";

const brandCopy = {
  visa: { label: "Visa" },
  mastercard: { label: "Mastercard" },
  amex: { label: "American Express" },
};

const walletLabels = {
  paypal: "PayPal",
  apple: "Apple Pay",
  google: "Google Wallet",
};

const ARABIC_DIGITS = ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?"];

const toArabic = (v, lang) => {
  if (lang !== "ar") return v?.toString();
  return v?.toString().replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
};

export default function PaymentMethodCard({ method, onMakeDefault, onDelete, t, lang = "en" }) {
  const { colors, radius, spacing } = useTheme();
  const isCard = method.type === "card";

  const badge =
    isCard && brandCopy[method.brand]
      ? brandCopy[method.brand]
      : { label: walletLabels[method.provider] || t("payments.wallet", "Wallet") };

  const getLabel = () => {
    if (isCard) {
      return method.nickname || t("payments.form.nicknamePlaceholder", "Card placeholder");
    }
    const label = walletLabels[method.provider] || t("payments.wallet", "Wallet");
    return method.nickname || `${label} (${method.email})`;
  };

  const rtl = lang === "ar";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.xs,
          writingDirection: rtl ? "rtl" : "ltr",
        },
      ]}
    >
      {/* HEADER ROW */}
      <View style={[styles.topRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <View
          style={[
            styles.iconLabel,
            {
              flexDirection: rtl ? "row-reverse" : "row",
              gap: spacing.sm,
            },
          ]}
        >
          <Ionicons
            name={isCard ? "card-outline" : "wallet-outline"}
            size={18}
            color={colors.success}
            style={{ marginLeft: rtl ? 6 : 0, marginRight: rtl ? 0 : 6 }}
          />

          <View style={{ alignItems: rtl ? "flex-end" : "flex-start" }}>
            <Text style={[styles.heading, { color: colors.text }]}>{getLabel()}</Text>

            <Text style={[styles.subText, { color: colors.textMuted }]}>
              {isCard
                ? `${badge.label} ${t("payments.endingIn", "ending in")} ${toArabic(method.last4, lang)}`
                : `${badge.label} - ${method.email}`}
            </Text>

            {isCard && method.holder ? (
              <Text style={[styles.holderText, { color: colors.textMuted }]}>
                {t("payments.cardHolderLabel", "Card holder")}: {method.holder}
              </Text>
            ) : null}
          </View>
        </View>

        {/* DEFAULT BADGE */}
        {method.isDefault && (
          <View
            style={[
              styles.defaultBadge,
              {
                backgroundColor: `${colors.success}22`,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                flexDirection: rtl ? "row-reverse" : "row",
              },
            ]}
          >
            <Ionicons name="star" size={12} color={colors.success} />
            <Text style={[styles.defaultText, { color: colors.text }]}>
              {t("payments.status.defaultBadge", "Default")}
            </Text>
          </View>
        )}
      </View>

      {/* Nickname */}
      {method.nickname ? <Text style={[styles.nickname, { color: colors.textMuted }]}>{method.nickname}</Text> : null}

      {/* ACTION BUTTONS */}
      <View
        style={[
          styles.actions,
          {
            flexDirection: rtl ? "row-reverse" : "row",
            gap: spacing.sm,
          },
        ]}
      >
        {/* Make default */}
        {!method.isDefault && (
          <Pressable
            onPress={onMakeDefault}
            style={({ pressed }) => [
              styles.outlineBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                flexDirection: rtl ? "row-reverse" : "row",
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="star-outline" size={14} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              {t("payments.actions.makeDefault", "Make default")}
            </Text>
          </Pressable>
        )}

        {/* Delete */}
        {!method.isDefault && (
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [
              styles.outlineBtn,
              {
                borderColor: colors.danger,
                backgroundColor: `${colors.danger}22`,
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                flexDirection: rtl ? "row-reverse" : "row",
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>
              {t("payments.actions.delete", "Delete")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  topRow: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconLabel: { alignItems: "center" },
  heading: { fontSize: 14, fontWeight: "700" },
  subText: { fontSize: 12 },
  nickname: { fontSize: 12 },
  holderText: { fontSize: 11 },
  defaultBadge: {
    alignItems: "center",
    gap: 4,
  },
  defaultText: { fontSize: 11, fontWeight: "700" },
  actions: { flexWrap: "wrap", marginTop: 6 },
  outlineBtn: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  actionText: { fontSize: 12, fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
