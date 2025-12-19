import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";
import { getLangKey, getLocalizedName } from "../../utils/productLocalization";

export default function OrderItemsList({ items = [], isDark: propIsDark }) {
  const { t, i18n } = useTranslation();
  const langKey = getLangKey(i18n.language);
  const { colors, radius, spacing, mode } = useTheme();
  const isDark = typeof propIsDark === "boolean" ? propIsDark : mode === "dark";

  if (!items.length) return null;

  const toArabic = (num) => {
    if (langKey !== "ar") return num?.toString();
    const digits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
    return num?.toString().replace(/\d/g, (d) => digits[Number(d)]);
  };

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: spacing.lg,
          gap: spacing.sm,
          writingDirection: langKey === "ar" ? "rtl" : "ltr",
        },
      ]}
    >
      <Text
        style={[
          styles.heading,
          { color: colors.textMuted, writingDirection: langKey === "ar" ? "rtl" : "ltr" },
        ]}
      >
        {t("tracking.orderItems", "Order Items")}
      </Text>

      <View style={[styles.list, { gap: spacing.sm }]}>
        {items.map((item, index) => (
          <View
            key={item.id || item.productId || index}
            style={[
              styles.card,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                padding: spacing.md,
                flexDirection: langKey === "ar" ? "row-reverse" : "row",
              },
            ]}
          >
            {item.thumbnailUrl || item.img || item.image || item.imageUrl ? (
              <Image
                source={{
                  uri:
                    item.thumbnailUrl ||
                    item.img ||
                    item.image ||
                    item.imageUrl,
                }}
                style={[
                  styles.image,
                  {
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.image,
                  {
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
              />
            )}

            <View
              style={[
                styles.content,
                { gap: spacing.xs, writingDirection: langKey === "ar" ? "rtl" : "ltr" },
              ]}
            >
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {getLocalizedName(item, langKey)}
              </Text>

              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {t("tracking.qty", { count: toArabic(item.quantity || 1) })}
              </Text>
            </View>

            <Text
              style={[
                styles.price,
                {
                  color: colors.text,
                  writingDirection: langKey === "ar" ? "rtl" : "ltr",
                },
              ]}
            >
              {item.price
                ? langKey === "ar"
                  ? `${toArabic(Number(item.price).toFixed(2))} EGP`
                  : `${Number(item.price).toFixed(2)} EGP`
                : "-"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, gap: 10 },
  heading: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  list: { gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  image: { width: 56, height: 56 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  price: { fontSize: 16, fontWeight: "800" },
});
