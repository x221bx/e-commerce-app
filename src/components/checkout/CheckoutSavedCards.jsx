import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";

export const NEW_CARD_OPTION = "__new_card__";

const formatSavedMethod = (method) => {
  if (!method) return "";
  if (method.type === "card") {
    const brand = method.brand
      ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1)
      : "Card";
    return `${brand} **** ${method.last4 || "----"}`;
  }
  if (method.type === "wallet") {
    const provider = method.provider
      ? method.provider.charAt(0).toUpperCase() + method.provider.slice(1)
      : "Wallet";
    return `${provider} (${method.email})`;
  }
  return method.nickname || "Saved method";
};

export default function CheckoutSavedCards({
  paymentMethod,
  savedCards = [],
  selectedSavedCardId,
  setSelectedSavedCardId,
  savedPaymentLoading,
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  if (paymentMethod !== "card") return null;

  const options = [
    ...savedCards.map((card) => ({ id: card.id, label: formatSavedMethod(card) })),
    { id: NEW_CARD_OPTION, label: t("checkout.payment.card.addNew", "Add a new card") },
  ];

  return (
    <View style={[styles.container, { gap: spacing.sm }]}>
      {savedPaymentLoading && (
        <Text
          style={[
            styles.loadingText,
            {
              color: colors.textMuted,
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.lg,
            },
          ]}
        >
          {t("checkout.payment.loadingSuggestion", "Looking for saved cards...")}
        </Text>
      )}

      <View
        style={[
          styles.card,
          {
            borderRadius: radius.lg,
            borderColor: colors.border,
            backgroundColor: colors.card,
            padding: spacing.md,
          },
        ]}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          {t(
            "checkout.payment.card.dropdownLabel",
            "Select a saved card or add a new one"
          )}
        </Text>

        <View style={[styles.optionList, { gap: spacing.sm }]}>
          {options.map((opt) => {
            const active = selectedSavedCardId === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelectedSavedCardId(opt.id)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    paddingVertical: spacing.sm + 2,
                    paddingHorizontal: spacing.sm + 2,
                  },
                  active && { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={[styles.radioOuter, { borderColor: colors.border }]}>
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: "transparent" },
                      active && { backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedSavedCardId === NEW_CARD_OPTION ? (
          <Text style={[styles.helperText, { color: colors.primary }]}>
            {t(
              "checkout.payment.card.addNewHint",
              "We will collect your card details securely after you confirm."
            )}
          </Text>
        ) : (
          <Text style={[styles.helperTextMuted, { color: colors.textMuted }]}>
            {t(
              "checkout.payment.card.savedHint",
              "The selected saved card will be used for this order."
            )}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  loadingText: {
    fontSize: 12,
    padding: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: "700" },
  optionList: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionPressed: { opacity: 0.9 },
  optionLabel: { fontSize: 14, flexShrink: 1 },
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
  helperText: { fontSize: 12 },
  helperTextMuted: { fontSize: 12 },
});
