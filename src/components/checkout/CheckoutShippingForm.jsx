import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";

export default function CheckoutShippingForm({ form, setForm, errors }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const inputStyle = {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  };

  return (
    <View style={[styles.section, { gap: spacing.md, marginBottom: spacing.md }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("checkout.sections.shipping")}</Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t("checkout.fields.address", "Address")}
        </Text>
        <TextInput
          value={form.address}
          onChangeText={(v) => setField("address", v)}
          placeholder={t("checkout.fields.address", "Address")}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputStyle, errors.address && { borderColor: colors.danger }]}
        />
        {errors.address ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errors.address}</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>{t("checkout.fields.city")}</Text>
        <TextInput
          value={form.city}
          onChangeText={(v) => setField("city", v)}
          placeholder={t("checkout.fields.city")}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputStyle, errors.city && { borderColor: colors.danger }]}
        />
        {errors.city ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{errors.city}</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t("checkout.fields.notes", "Notes (optional)")}
        </Text>
        <TextInput
          value={form.notes}
          onChangeText={(v) => setField("notes", v)}
          placeholder={t("checkout.fields.notes", "Notes (optional)")}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, inputStyle, styles.textArea, { minHeight: 80, textAlignVertical: "top" }]}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: { fontSize: 18, fontWeight: "700" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {},
  errorText: { fontSize: 12, fontWeight: "600" },
});
