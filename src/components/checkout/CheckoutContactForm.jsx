import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";

export default function CheckoutContactForm({ form, setForm, errors }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={[styles.section, { gap: spacing.md, marginBottom: spacing.md }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t("checkout.sections.contact")}</Text>
      <View style={[styles.row, { gap: spacing.md }]}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>{t("checkout.fields.fullName")}</Text>
          <TextInput
            value={form.fullName}
            onChangeText={(v) => setField("fullName", v)}
            placeholder={t("checkout.fields.fullName")}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
                borderRadius: radius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
              },
              errors.fullName && { borderColor: colors.danger },
            ]}
          />
          {errors.fullName ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{errors.fullName}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>{t("checkout.fields.phone")}</Text>
          <TextInput
            value={form.phone}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 11);
              setField("phone", digits);
            }}
            placeholder={t("checkout.fields.phone")}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={11}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
                borderRadius: radius.lg,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
              },
              errors.phone && { borderColor: colors.danger },
            ]}
          />
          {errors.phone ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{errors.phone}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  title: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "column" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  errorText: { fontSize: 12, fontWeight: "600" },
});
