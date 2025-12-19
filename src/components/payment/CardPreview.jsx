import React from "react";
import { View, Text, StyleSheet, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";

const brandCopy = {
  visa: { label: "Visa" },
  mastercard: { label: "Mastercard" },
  amex: { label: "American Express" },
};

const ARABIC_DIGITS = ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?"];

const toArabic = (value, lang) => {
  if (lang !== "ar") return value?.toString();
  return value?.toString().replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
};

export default function CardPreview({ cardForm, detectBrand, formatCardNumber, formatExpiry }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { colors, radius, spacing } = useTheme();

  const detectedBrand = detectBrand(cardForm.number);
  const brandMeta = detectedBrand ? brandCopy[detectedBrand] : null;

  const brandLabel = brandMeta?.label || t("payments.brandUnknown", "Card type not recognized yet");

  const gradient = [colors.primary, colors.accent];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            marginBottom: spacing.sm,
            gap: spacing.sm,
            flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
        <Text
          style={[
            styles.headerText,
            {
              color: colors.text,
              writingDirection: lang === "ar" ? "rtl" : "ltr",
            },
          ]}
        >
          {t("payments.form.cardPreview", "Card preview")}
        </Text>
      </View>

      {/* Card UI */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: gradient[0],
            borderRadius: radius.lg,
            padding: spacing.md,
            gap: spacing.sm,
          },
        ]}
      >
        {/* Card Type Label */}
        <Text
          style={[
            styles.topLabel,
            { color: colors.surface, writingDirection: lang === "ar" ? "rtl" : "ltr" },
          ]}
        >
          {brandLabel}
        </Text>

        {/* Chip */}
        <View style={[styles.chip, { backgroundColor: "rgba(255,255,255,0.3)" }]} />

        {/* Card Number */}
        <Text
          style={[
            styles.cardNumber,
            { color: "white", writingDirection: lang === "ar" ? "rtl" : "ltr" },
          ]}
        >
          {formatCardNumber(cardForm.number)
            ? toArabic(formatCardNumber(cardForm.number), lang)
            : t("payments.cardNumberPlaceholder", "**** **** **** ****")}
        </Text>

        {/* Bottom Row */}
        <View
          style={[
            styles.bottomRow,
            {
              marginTop: spacing.sm,
              flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          {/* Name Section */}
          <View>
            <Text
              style={[
                styles.smallLabel,
                {
                  color: "rgba(255,255,255,0.7)",
                  writingDirection: lang === "ar" ? "rtl" : "ltr",
                },
              ]}
            >
              {t("payments.nameLabel", "Name")}
            </Text>

            <Text style={[styles.valueText, { writingDirection: lang === "ar" ? "rtl" : "ltr" }]}>
              {cardForm.holder || t("payments.form.cardHolder", "Card holder name")}
            </Text>
          </View>

          {/* EXP Section */}
          <View style={styles.rightAlign}>
            <Text
              style={[
                styles.smallLabel,
                {
                  color: "rgba(255,255,255,0.7)",
                  writingDirection: lang === "ar" ? "rtl" : "ltr",
                },
              ]}
            >
              {t("payments.expLabel", "EXP")}
            </Text>

            <Text style={[styles.valueText, { writingDirection: lang === "ar" ? "rtl" : "ltr" }]}>
              {cardForm.exp ? toArabic(formatExpiry(cardForm.exp), lang) : t("payments.expPlaceholder", "MM/YY")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 24, borderWidth: 1 },
  header: { alignItems: "center" },
  headerText: { fontSize: 14, fontWeight: "700" },
  card: { gap: 12 },
  topLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  chip: { marginTop: 12, width: 42, height: 30, borderRadius: 6 },
  cardNumber: { marginTop: 16, fontSize: 20, fontWeight: "700", letterSpacing: 2 },
  bottomRow: { justifyContent: "space-between", alignItems: "flex-end" },
  smallLabel: { fontSize: 11, letterSpacing: 0.4 },
  valueText: { color: "white", fontSize: 14, fontWeight: "700" },
  rightAlign: { alignItems: "flex-end" },
});
