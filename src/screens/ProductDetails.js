import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/useTheme";
import { getLangKey, getLocalizedDescription, getLocalizedName } from "../utils/productLocalization";
 //function product
export default function ProductDetails() {
  const route = useRoute();
  const initialProduct = route.params?.product;
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { i18n, t } = useTranslation();
  const langKey = getLangKey(i18n.language);
  const isRTL = (i18n?.dir?.() || "ltr") === "rtl" || langKey === "ar";
  const { colors, shadow, spacing, radius, typography } = useTheme();
  const dangerColor = colors.error || "#E53935";
  const neutralBorder = colors.border || "#D1D5DB";

  useEffect(() => {
    const fetchFresh = async () => {
      const id = initialProduct?.id;
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        }
      } catch {
        // ignore fetch errors; keep initial data
      } finally {
        setLoading(false);
      }
    };

    fetchFresh();
  }, [initialProduct]);

  const productName = getLocalizedName(product, langKey);
  const imageUrl =
    product?.heroImage ||
    product?.imageUrl ||
    product?.thumbnailUrl ||
    product?.image ||
    product?.photo ||
    "https://via.placeholder.com/600x400";
  const description =
    getLocalizedDescription(product, langKey) ||
    product?.description ||
    product?.summary ||
    product?.details ||
    product?.body ||
    "No description available.";
  const priceVal = Number(product?.price) || 0;
  const stockCount = Number(product?.stock ?? product?.quantity ?? 0);
  const isAvailable = stockCount > 0 && product?.isAvailable !== false;
  const availabilityLabel = !isAvailable
    ? t("cart.outOfStock", "Out of stock")
    : stockCount === 1
      ? t("cart.lastPiece", "Last piece")
      : stockCount <= 3
        ? `${t("cart.lowStock", "Low stock")} (${stockCount})`
        : t("cart.inStock", "In stock");

  const descriptionLines = useMemo(() => {
    return description
      .split(/\r?\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 40);
  }, [description]);

  if (!product && loading) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
    >
      <View style={[styles.topBar, isRTL && styles.topBarRTL, { paddingBottom: spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[
            styles.iconBtn,
            { backgroundColor: colors.surface, borderRadius: radius.md, shadowColor: "transparent" },
          ]}
        >
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, isRTL && styles.textRTL, { color: colors.text }]} numberOfLines={2}>
          {productName}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            shadowColor: shadow.color,
            shadowOpacity: shadow.opacity,
            shadowRadius: shadow.radius,
            shadowOffset: shadow.offset,
          },
        ]}
      >
        <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceMuted }]}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        </View>
        <Text style={[styles.title, isRTL && styles.textRTL, { color: colors.text }]}>{productName}</Text>
        <Text style={[styles.price, { color: colors.success }]}>{priceVal.toLocaleString()} EGP</Text>
        <View
          style={[
            styles.statusRow,
            {
              backgroundColor: isAvailable ? "rgba(13, 110, 13, 0.08)" : "rgba(229, 57, 53, 0.12)",
              borderColor: isAvailable ? "rgba(13, 110, 13, 0.35)" : "rgba(229, 57, 53, 0.4)",
            },
          ]}
        >
          <Ionicons
            name={isAvailable ? "checkmark-circle" : "alert-circle"}
            size={18}
            color={isAvailable ? colors.success : dangerColor}
          />
          <Text
            style={[
              styles.statusText,
              { color: isAvailable ? colors.success : dangerColor },
            ]}
          >
            {availabilityLabel}
          </Text>
        </View>

        <View style={[styles.descBox, { gap: spacing.xs }]}>
          {descriptionLines.map((line, idx) => {
            const isHeading = /[:‹¬s]$/.test(line) || /OU,U.U.USOýOO¦|OU,U.U.USOý|OúOñUSU,Oc OU,OO3O¦OrO_OU.|OúOñUSU,Oc OU,OO3O¦O1U.OU,/i.test(line);
            const bullet = "•";
            return (
              <View key={`${idx}-${line}`} style={[styles.descLine, isRTL && styles.descLineRtl, { gap: spacing.xs }]}>
                <Text style={[styles.bullet, isRTL && styles.bulletRtl, { color: colors.primary }]}>{bullet}</Text>
                <Text
                  style={[
                    styles.descText,
                    { color: colors.textMuted, fontSize: typography.sizes.md - 1 },
                    isHeading && [styles.descHeading, { color: colors.text }],
                    isRTL && styles.textRTL,
                  ]}
                >
                  {line.replace(/[:‹¬s]$/, "")}
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.add,
            {
              backgroundColor: isAvailable ? colors.primary : neutralBorder,
              borderRadius: radius.md,
              paddingVertical: spacing.md,
              opacity: isAvailable ? 1 : 0.65,
            },
          ]}
          onPress={() => isAvailable && dispatch(addToCart(product))}
          disabled={!isAvailable}
        >
          <Text
            style={[
              styles.addText,
              {
                color: isAvailable ? colors.surface : colors.textMuted,
                fontSize: typography.sizes.md,
              },
            ]}
          >
            {isAvailable
              ? t("cart.add", "Add to Cart")
              : t("cart.outOfStock", "Out of stock")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarRTL: { flexDirection: "row-reverse" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", marginHorizontal: 8 },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  imageWrapper: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  title: { fontSize: 20, fontWeight: "800" },
  price: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: { fontWeight: "700" },
  descBox: { marginTop: 6 },
  descLine: { flexDirection: "row", alignItems: "flex-start" },
  descLineRtl: { flexDirection: "row-reverse" },
  bullet: { marginTop: 2, fontSize: 12, width: 12, textAlign: "center" },
  bulletRtl: { textAlign: "center" },
  descText: { flex: 1, lineHeight: 20, fontSize: 14 },
  descHeading: { fontWeight: "700", marginTop: 4 },
  textRTL: { textAlign: "right" },
  add: {
    marginTop: 12,
    alignItems: "center",
  },
  addText: { fontWeight: "700", fontSize: 15 },
});
