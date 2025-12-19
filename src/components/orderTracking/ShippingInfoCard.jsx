// src/components/ordertracking/ShippingInfoCard.jsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useTranslation } from "react-i18next";

export default function ShippingInfoCard({ shippingInfo = {}, trackingUrl, isDark }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const toArabic = (value) => {
    if (lang !== "ar") return value?.toString();
    const digits = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
    return value?.toString().replace(/\d/g, (d) => digits[Number(d)]);
  };

  const formatCurrency = (price, currency = "EGP") => {
    if (!price) return "-";
    const num = Number(price).toFixed(2);
    const currencyMap = {
      EGP: lang === "ar" ? "ج.م" : "EGP",
      USD: lang === "ar" ? "دولار" : "USD",
      EUR: lang === "ar" ? "يورو" : "EUR",
    };
    const translatedCurrency = currencyMap[currency] || currency;
    return lang === "ar" ? `${toArabic(num)} ${translatedCurrency}` : `${num} ${translatedCurrency}`;
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const formatted = d.toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });
    return lang === "ar" ? toArabic(formatted.replace(/[A-Za-z]/g, "")) : formatted;
  };

  const mutedColor = isDark ? "#94A3B8" : "#64748B";
  const strongColor = isDark ? "#E2E8F0" : "#0F172A";
  const surfaceColor = isDark ? "#0f172a" : "#FFFFFF";
  const borderColor = isDark ? "#1f2937" : "#E2E8F0";
  const linkColor = isDark ? "#34D399" : "#10B981";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surfaceColor,
          borderColor,
          writingDirection: lang === "ar" ? "rtl" : "ltr",
        },
      ]}
    >
      <Text style={[styles.title, { color: strongColor }]}>
        {t("tracking.shippingInfo", "Shipping Information")}
      </Text>

      <View style={styles.row}>
        <Text style={[styles.label, { color: mutedColor }]}>{t("tracking.shippingTo", "Shipping To")}</Text>
        <Text style={[styles.value, { color: strongColor }]}>{shippingInfo.recipient || "-"}</Text>
        <Text style={[styles.value, { color: mutedColor }]}>{shippingInfo.address || "-"}</Text>
        {shippingInfo.date ? (
          <Text style={[styles.value, { color: mutedColor }]}>
            {t("tracking.date", "Date")}: {formatDate(shippingInfo.date)}
          </Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: mutedColor }]}>{t("tracking.carrier", "Carrier")}</Text>
        <Text style={[styles.value, { color: strongColor }]}>{shippingInfo.carrier || "-"}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: mutedColor }]}>{t("tracking.trackingNumber", "Tracking Number")}</Text>
        <Text style={[styles.value, { color: strongColor }]}>
          {shippingInfo.trackingNumber ? toArabic(shippingInfo.trackingNumber) : t("tracking.awaitingUpdate", "Awaiting update")}
        </Text>
        {shippingInfo.price ? (
          <Text style={[styles.value, { color: strongColor }]}>
            {t("tracking.cost", "Cost")}: {formatCurrency(shippingInfo.price, shippingInfo.currency)}
          </Text>
        ) : null}
        {trackingUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(trackingUrl)} style={{ marginTop: 6 }}>
            <Text style={{ color: linkColor, fontWeight: "700" }}>
              {t("tracking.trackCarrier", "Track on carrier site")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "700" },
  row: { gap: 4 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  value: { fontSize: 13, fontWeight: "600" },
});
