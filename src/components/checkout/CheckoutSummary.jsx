import React from "react";
import { View, Text, Image, StyleSheet, FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";
import { getLangKey, getLocalizedName } from "../../utils/productLocalization";

export default function CheckoutSummary({ cartItems = [], summary = {} }) {
  const { t, i18n } = useTranslation();
  const langKey = getLangKey(i18n.language);
  const { colors, radius, spacing, shadow } = useTheme();
  const data = cartItems || [];
  const totals = summary || { subtotal: 0, shipping: 0, total: 0 };

  const renderItem = ({ item }) => (
    <View style={[styles.itemRow, { gap: spacing.md }]}>
      <Image
        source={{ uri: item.thumbnailUrl || item.img }}
        style={[styles.itemImage, { borderRadius: radius.md, backgroundColor: colors.surfaceMuted }]}
        resizeMode="cover"
      />
      <View style={[styles.itemContent, { gap: spacing.xs }]}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{getLocalizedName(item, langKey)}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>
          {t("checkout.summary.qty", { count: item.quantity ?? 1 })}
        </Text>
      </View>
      <Text style={[styles.itemPrice, { color: colors.text }]}>
        {`${Number(item.price || 0).toLocaleString()} EGP`}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius.lg + 4,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: spacing.lg,
          gap: spacing.md,
          shadowColor: shadow.color,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          shadowOffset: shadow.offset,
        },
      ]}
    >
      <Text style={[styles.heading, { color: colors.text }]}>{t("checkout.summary.title", "Order Summary")}</Text>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => `${item.id || idx}`}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        scrollEnabled={false}
      />

      <View style={[styles.totals, { marginTop: spacing.sm, gap: spacing.xs + 2 }]}>
        <Row
          label={t("checkout.summary.subtotal", "Subtotal")}
          value={`${(totals.subtotal ?? 0).toLocaleString()} EGP`}
          colors={colors}
        />
        <Row
          label={t("checkout.summary.shipping", "Shipping")}
          value={`${(totals.shipping ?? 0).toLocaleString()} EGP`}
          colors={colors}
        />
        <Row
          label={t("checkout.summary.total", "Total")}
          value={`${(totals.total ?? 0).toLocaleString()} EGP`}
          strong
          colors={colors}
        />
      </View>
    </View>
  );
}

const Row = ({ label, value, strong, colors }) => (
  <View style={styles.totalRow}>
    <Text style={[styles.totalLabel, { color: colors.textMuted }, strong && { fontSize: 16, color: colors.text, fontWeight: "800" }]}>
      {label}
    </Text>
    <Text style={[styles.totalValue, { color: colors.text }, strong && { fontSize: 16, fontWeight: "800" }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 64,
    height: 64,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "700" },
  itemSubtitle: { fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: "700" },
  separator: { height: 10 },
  totals: { marginTop: 8, gap: 6 },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: "600" },
  strong: { fontSize: 16, fontWeight: "800" },
});
