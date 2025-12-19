import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Modal from "../ui/Modal";
import { useCardValidation } from "../../hooks/useCardValidation";
import { useTheme } from "../../theme/useTheme";

export default function CheckoutCardModal({ isOpen, onClose, onSubmit }) {
  const { t } = useTranslation();
  const cardValidation = useCardValidation();
  const { colors, radius, spacing } = useTheme();
  const [saveCard, setSaveCard] = useState(true);

  const handleSubmit = async () => {
    if (!cardValidation.validateCard(t)) return;
    const success = await onSubmit({
      cardForm: cardValidation.cardForm,
      detectBrand: cardValidation.detectBrand,
      save: saveCard,
    });
    if (!success) return;
    cardValidation.resetCard();
    setSaveCard(true);
    onClose();
  };

  const handleClose = () => {
    cardValidation.resetCard();
    setSaveCard(true);
    onClose();
  };

  const {
    cardForm,
    cardErrors,
    handleCardFormChange,
    formatCardNumber,
    formatHolderName,
    formatExpiry,
    detectBrand,
    cardValid,
  } = cardValidation;

  const brand = detectBrand(cardForm.number.replace(/\s+/g, ""));
  const brandLabel =
    brand === "visa"
      ? "Visa"
      : brand === "mastercard"
        ? "Mastercard"
        : brand === "amex"
          ? "Amex"
          : "Unknown";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("payments.form.cardTitle")} footer={false}>
      <View style={[styles.form, { gap: spacing.md }]}>
        <Field
          label={t("payments.form.cardHolder")}
          value={cardForm.holder}
          onChangeText={(v) => handleCardFormChange("holder", formatHolderName(v))}
          error={cardErrors.holder}
          placeholder="Jane Doe"
          colors={colors}
          radius={radius}
          spacing={spacing}
        />

        <Field
          label={t("payments.form.cardNumber")}
          value={formatCardNumber(cardForm.number)}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, "").slice(0, 19);
            handleCardFormChange("number", digits);
          }}
          keyboardType="number-pad"
          error={cardErrors.number}
          placeholder="4242 4242 4242 4242"
          colors={colors}
          radius={radius}
          spacing={spacing}
        />

        <View style={styles.metaRow}>
          <View style={[styles.brandPill, { backgroundColor: colors.surfaceMuted }]}>
            {brand ? (
              <>
                <Ionicons
                  name={brand === "visa" ? "card-outline" : "card-outline"}
                  size={14}
                  color={colors.text}
                />
                <Text style={[styles.brandText, { color: colors.text }]}>{brandLabel}</Text>
              </>
            ) : (
              <Text style={[styles.brandTextMuted, { color: colors.textMuted }]}>
                {t("payments.card.type", "Card type")}
              </Text>
            )}
          </View>

          <View style={styles.validity}>
            <Ionicons
              name={cardValid ? "checkmark-circle" : "alert-circle"}
              size={16}
              color={cardValid ? colors.success : colors.warning}
            />
            <Text
              style={[
                styles.validityText,
                { color: cardValid ? colors.success : colors.warning },
              ]}
            >
              {cardValid
                ? t("payments.card.valid", "Number looks valid")
                : t("payments.card.checkNumber", "Check card number")}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Field
            label={t("payments.form.expiry")}
            value={formatExpiry(cardForm.exp)}
            onChangeText={(v) => handleCardFormChange("exp", formatExpiry(v))}
            placeholder="MM/YY"
            keyboardType="number-pad"
            error={cardErrors.exp}
            style={styles.half}
            colors={colors}
            radius={radius}
            spacing={spacing}
          />
          <Field
            label={t("payments.form.cvv")}
            value={cardForm.cvv}
            onChangeText={(v) => {
              const currentBrand = detectBrand(cardForm.number);
              const max = currentBrand === "amex" ? 4 : 3;
              handleCardFormChange("cvv", v.replace(/\D/g, "").slice(0, max));
            }}
            placeholder="123"
            keyboardType="number-pad"
            error={cardErrors.cvv}
            style={styles.half}
            colors={colors}
            radius={radius}
            spacing={spacing}
          />
        </View>

        <Field
          label={t("payments.form.nickname", "Nickname (optional)")}
          value={cardForm.nickname}
          onChangeText={(v) => handleCardFormChange("nickname", v)}
          placeholder={t("payments.form.nicknamePlaceholder", "V Shop purchases")}
          colors={colors}
          radius={radius}
          spacing={spacing}
        />

        <Pressable
          style={({ pressed }) => [styles.saveRow, pressed && styles.pressed]}
          onPress={() => setSaveCard((s) => !s)}
        >
          <Ionicons
            name={saveCard ? "checkbox" : "square-outline"}
            size={18}
            color={saveCard ? colors.success : colors.textMuted}
          />
          <Text style={[styles.saveText, { color: colors.text }]}>
            {t("payments.card.save", "Save this card for next time")}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.secondary,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md + 2,
                paddingVertical: spacing.sm + 2,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>{t("common.cancel", "Cancel")}</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primary,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md + 2,
                paddingVertical: spacing.sm + 2,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.primaryText, { color: colors.surface }]}>
              {t("checkout.actions.completeOrder", "Complete Order")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  error,
  style,
  colors,
  radius,
  spacing,
}) => (
  <View style={[styles.field, style]}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      style={[
        styles.input,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.text,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        },
        error && { borderColor: colors.danger },
      ]}
    />
    {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  form: { gap: 12 },
  field: { gap: 6 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  inputError: {},
  errorText: { fontSize: 12, fontWeight: "600" },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -6,
    marginBottom: 6,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  brandText: { fontSize: 12, fontWeight: "700" },
  brandTextMuted: { fontSize: 12, fontWeight: "700" },
  validity: { flexDirection: "row", alignItems: "center", gap: 6 },
  validityText: { fontSize: 12, fontWeight: "700" },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  saveText: { fontSize: 13, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  secondary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  primary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryText: { fontWeight: "700" },
  primaryText: { fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
