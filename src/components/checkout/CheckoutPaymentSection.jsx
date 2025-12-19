import React from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";

export default function CheckoutPaymentSection({
  paymentMethod,
  handlePaymentSelection,
  paymentOptions = [],
  form,
  setForm,
  errors = {},
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  const setField = (key, value) => {
    setForm?.((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={[styles.section, { gap: spacing.md, marginBottom: spacing.lg }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xs }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("checkout.sections.payment")}</Text>
      </View>

      <View
        style={[
          styles.options,
          {
            gap: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {paymentOptions.map((option) => {
          const isActive = paymentMethod === option.value;
          const helperText =
            option.helper ||
            (option.value === "paymob_card"
              ? t("checkout.payment.paymobTagline", "Secured by Paymob Accept")
              : option.value === "paymob_wallet"
                ? t("checkout.payment.paymobWalletTagline", "Wallets: Vodafone Cash, Orange, Etisalat, WE")
                : option.value === "paypal"
                  ? t("checkout.payment.paypalTagline", "Checkout with PayPal")
                  : null);
          const helperColor =
            option.helperColor ||
            (option.value === "paypal"
              ? colors.primary
              : option.value === "paymob_wallet"
                ? colors.accent
                : colors.success);

          return (
            <Pressable
              key={option.value}
              onPress={() => handlePaymentSelection(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: isActive ? `${colors.primary}0d` : colors.card,
                  borderRadius: radius.xl,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  gap: spacing.sm,
                },
                pressed && styles.optionPressed,
              ]}
            >
              <View style={styles.optionTopRow}>
                <View style={[styles.radioOuter, { borderColor: isActive ? colors.primary : colors.border }]}>
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: "transparent" },
                      isActive && { backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionTitleRow}>
                    {option.icon ? (
                      <View
                        style={[
                          styles.iconPill,
                          {
                            backgroundColor: option.iconBg || colors.surfaceMuted,
                            borderColor: isActive ? colors.primary : "transparent",
                          },
                        ]}
                      >
                        <Ionicons name={option.icon} size={18} color={option.iconColor || colors.text} />
                      </View>
                    ) : null}
                    <View style={styles.titleBlock}>
                      <Text style={[styles.optionTitle, { color: colors.text }]} numberOfLines={1}>
                        {option.title}
                      </Text>
                      {option.badge ? (
                        <View style={styles.metaRow}>
                          <Text style={[styles.badge, { backgroundColor: colors.surfaceMuted, color: colors.primary }]}>
                            {option.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {option.image ? (
                      <Image source={option.image} style={[styles.logo, option.imageStyle]} resizeMode="contain" />
                    ) : null}
                  </View>
                  {option.subtitle ? (
                    <Text style={[styles.optionSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                      {option.subtitle}
                    </Text>
                  ) : null}
                  {helperText ? (
                    <Text style={[styles.helper, { color: helperColor }]} numberOfLines={2}>
                      {helperText}
                    </Text>
                  ) : null}
                </View>
              </View>
              {option.value === "paymob_wallet" && isActive ? (
                <View style={styles.walletInputWrap}>
                  <Text style={[styles.walletLabel, { color: colors.text }]}>
                    {t("checkout.fields.walletPhone", "Wallet phone")}
                  </Text>
                  <TextInput
                    value={form?.walletPhone}
                    onChangeText={(v) => {
                      const digits = v.replace(/\D/g, "").slice(0, 11);
                      setField("walletPhone", digits);
                    }}
                    placeholder={t("checkout.fields.walletPhone", "Wallet phone")}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={11}
                    style={[
                      styles.walletInput,
                      {
                        borderColor: errors.walletPhone ? colors.danger : colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        borderRadius: radius.lg,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 2,
                      },
                    ]}
                  />
                  {errors.walletPhone ? (
                    <Text style={[styles.errorText, { color: colors.danger }]}>{errors.walletPhone}</Text>
                  ) : null}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700" },
  linkText: { fontSize: 13, fontWeight: "700" },
  options: { gap: 10 },
  option: {
    flexDirection: "column",
    gap: 10,
    borderWidth: 1,
    minHeight: 96,
  },
  optionTopRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  optionActive: {},
  optionPressed: { opacity: 0.9 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionContent: { flex: 1, gap: 6 },
  optionTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  optionTitle: { fontSize: 15, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 },
  logo: { width: 110, height: 32, marginLeft: "auto" },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    textTransform: "uppercase",
  },
  optionSubtitle: { fontSize: 12, flexWrap: "wrap" },
  helper: { fontSize: 11, marginTop: 2, fontWeight: "700", flexWrap: "wrap" },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  titleBlock: { flex: 1, gap: 4 },
  walletInputWrap: { gap: 6, marginLeft: 30 },
  walletLabel: { fontSize: 12, fontWeight: "700" },
  walletInput: { borderWidth: 1, fontSize: 14 },
  errorText: { fontSize: 12, fontWeight: "600" },
});
