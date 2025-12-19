import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, I18nManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Input from "../ui/Input";
import { useTheme } from "../../theme/useTheme";

const AR_DIGITS = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
const toArabic = (value, lang) => {
  if (lang !== "ar") return value?.toString();
  return value?.toString().replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
};

export default function CardForm({ cardValidation, onSubmit, isLoading }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { colors, shadow, radius, spacing } = useTheme();
  const cardHolderRef = useRef(null);

  const {
    cardForm,
    cardErrors,
    cardValid,
    handleCardFormChange,
    validateCard,
    resetCard,
    detectBrand,
    formatCardNumber,
    formatHolderName,
    formatExpiry,
  } = cardValidation;

  const [lastAddAttempt, setLastAddAttempt] = useState(0);

  useEffect(() => {
    cardHolderRef.current?.focus?.();
  }, []);

  const handleSubmit = () => {
    const now = Date.now();
    if (now - lastAddAttempt < 2000) return;
    setLastAddAttempt(now);

    if (!validateCard(t)) return;
    onSubmit(cardForm);
  };

  const detectedBrand = detectBrand(cardForm.number);
  const brandPalette = {
    visa: colors.accent,
    mastercard: colors.warning,
    amex: colors.success,
  };
  const brandColor = brandPalette[detectedBrand] || colors.textMuted;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          shadowColor: shadow.color,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          shadowOffset: shadow.offset,
        },
      ]}
    >
      <View
        style={[
          styles.headingRow,
          {
            marginBottom: spacing.sm,
            gap: spacing.sm,
            flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <Ionicons name="card-outline" size={18} color={colors.text} />
        <Text
          style={[
            styles.headingText,
            { color: colors.text, writingDirection: lang === "ar" ? "rtl" : "ltr" },
          ]}
        >
          {t("payments.form.cardTitle")}
        </Text>
      </View>

      <View style={[styles.form, { gap: spacing.sm }]}>
        <Input
          ref={cardHolderRef}
          label={t("payments.form.cardHolder")}
          value={cardForm.holder}
          onChangeText={(v) => handleCardFormChange("holder", formatHolderName(v))}
          error={cardErrors.holder}
        />

        <Input
          label={t("payments.form.cardNumber")}
          value={toArabic(formatCardNumber(cardForm.number), lang)}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, "").slice(0, 19);
            handleCardFormChange("number", digits);
          }}
          placeholder={lang === "ar" ? "1111 2222 3333 4444" : "4242 4242 4242 4242"}
          keyboardType="number-pad"
          maxLength={23}
          error={cardErrors.number}
        />

        <View style={[styles.infoRow, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
          <Text
            style={[
              styles.brandInfo,
              { color: brandColor, writingDirection: lang === "ar" ? "rtl" : "ltr" },
            ]}
          >
            {detectedBrand || t("payments.brandUnknown")}
            {cardValid ? ` (${t("common.valid")})` : ""}
          </Text>

          <Text
            style={[
              styles.hint,
              { color: colors.textMuted, writingDirection: lang === "ar" ? "rtl" : "ltr" },
            ]}
          >
            {t("payments.securityHint")}
          </Text>
        </View>

        <View style={[styles.row, { flexDirection: I18nManager.isRTL ? "row-reverse" : "row" }]}>
          <View style={styles.flexItem}>
            <Input
              label={t("payments.form.expiry")}
              value={toArabic(formatExpiry(cardForm.exp), lang)}
              onChangeText={(v) => handleCardFormChange("exp", formatExpiry(v))}
              placeholder={lang === "ar" ? "MM/YY" : "04/27"}
              keyboardType="number-pad"
              error={cardErrors.exp}
            />
          </View>

          <View style={styles.flexItem}>
            <Input
              label={t("payments.form.cvv")}
              value={toArabic(cardForm.cvv, lang)}
              onChangeText={(v) => {
                const brand = detectBrand(cardForm.number);
                const max = brand === "amex" ? 4 : 3;
                handleCardFormChange("cvv", v.replace(/\D/g, "").slice(0, max));
              }}
              placeholder={lang === "ar" ? "CVV" : "123"}
              keyboardType="number-pad"
              maxLength={4}
              error={cardErrors.cvv}
            />
          </View>
        </View>

        <Input
          label={t("payments.form.nickname")}
          value={cardForm.nickname}
          onChangeText={(v) => handleCardFormChange("nickname", v)}
          placeholder={t("payments.form.nicknamePlaceholder")}
        />

        <View style={[styles.actions, { gap: spacing.sm }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingVertical: spacing.sm,
                gap: spacing.xs,
              },
              pressed && styles.pressed,
              isLoading && styles.disabled,
            ]}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" />
            <Text style={[styles.primaryText, { color: "white" }]}>
              {isLoading ? t("payments.form.saving") : t("payments.form.saveCard")}
            </Text>
          </Pressable>

          <Pressable
            onPress={resetCard}
            style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
          >
            <Text style={[styles.resetText, { color: colors.primary }]}>
              {t("payments.form.reset")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 24, borderWidth: 1, elevation: 6 },
  headingRow: { alignItems: "center" },
  headingText: { fontSize: 14, fontWeight: "700" },
  form: { gap: 12 },
  infoRow: { justifyContent: "space-between", alignItems: "center" },
  brandInfo: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 11, flex: 1, textAlign: "right" },
  row: { gap: 10, flexWrap: "wrap" },
  flexItem: { flex: 1, minWidth: "47%" },
  actions: { flexDirection: "row", alignItems: "center" },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontWeight: "700", fontSize: 14 },
  resetBtn: { paddingVertical: 10, paddingHorizontal: 6 },
  resetText: { fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
