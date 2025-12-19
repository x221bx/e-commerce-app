// src/homeCom/ProductCard.js
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getLangKey, getLocalizedName } from "../utils/productLocalization";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AR_DIGITS = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
const toArabic = (value, langKey) =>
  langKey === "ar" ? value?.toString()?.replace(/\d/g, (d) => AR_DIGITS[Number(d)]) : value?.toString();

export default function ProductCard({
  item,
  onAddToCart,
  onFavoriteToggle,
  isFavorite = false,
  isInCart = false,
  onPress,
  isTrending,
  variant = "featured",
}) {
  const { t, i18n } = useTranslation();
  const langKey = getLangKey(i18n.language);
  const isArabic = langKey === "ar";

  const productName = getLocalizedName(item, langKey);
  const imageUrl = item.heroImage || item.imageUrl || item.thumbnailUrl || item.image;
  const stock = Number(item.stock ?? item.quantity ?? 0);
  const isAvailable = stock > 0 && item.isAvailable !== false;

  const handleFavorite = () => onFavoriteToggle?.(item);
  const handleAddToCart = () => {
    if (!isAvailable) return;
    onAddToCart?.(item);
  };

  const isGrid = variant === "grid";
  const cardWidth = isGrid ? Math.floor((SCREEN_WIDTH - 16 * 2 - 12) / 2) : 210;
  const imageHeight = isGrid ? 170 : 200;
  const priceValue = item.price ?? 0;
  const oldPriceValue = item.oldPrice ?? null;

  const formattedPrice =
    isArabic ? `${toArabic(priceValue, langKey)} EGP` : `EGP ${priceValue}`;
  const formattedOldPrice =
    oldPriceValue !== null && oldPriceValue !== undefined
      ? isArabic
        ? `${toArabic(oldPriceValue, langKey)} EGP`
        : `EGP ${oldPriceValue}`
      : null;

  const ratingText = isArabic ? toArabic(item.rating || "4.9", langKey) : item.rating || "4.9";
  const reviewsText = isArabic ? `| ${toArabic(item.reviews || "2.1k", langKey)}` : `| ${item.reviews || "2.1k"}`;

  const availabilityLabel = !isAvailable
    ? t("cart.outOfStock", "Out of stock")
    : stock === 1
      ? t("cart.lastPiece", "Last piece")
      : stock <= 3
        ? `${t("cart.lowStock", "Low stock")} (${stock})`
        : null;

  return (
    <Animated.View entering={FadeInUp.duration(450).delay(40)}>
      <TouchableOpacity activeOpacity={0.95} style={[styles.card, isGrid && { marginRight: 0 }]} onPress={onPress}>
        <View style={[styles.glassCard, { width: cardWidth }]}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { height: imageHeight }]}
              resizeMode="cover"
              blurRadius={!isAvailable ? 6 : 0}
            />

            {isTrending && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t("products.trending", "Trending")}</Text>
              </View>
            )}

            {!isAvailable && (
              <View style={styles.soldOutOverlay}>
                <Text style={styles.soldOutText}>{t("cart.outOfStock", "Out of stock")}</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Text style={[styles.name, { writingDirection: isArabic ? "rtl" : "ltr" }]} numberOfLines={2}>
              {productName}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formattedPrice}</Text>
              {formattedOldPrice ? <Text style={styles.oldPrice}>{formattedOldPrice}</Text> : null}
            </View>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{ratingText}</Text>
              <Text style={styles.reviews}>{reviewsText}</Text>
            </View>

            {availabilityLabel && (
              <View style={[styles.stockBadge, !isAvailable && styles.stockBadgeDanger]}>
                <Ionicons
                  name={isAvailable ? "warning-outline" : "close-circle"}
                  size={14}
                  color={isAvailable ? "#C27B00" : "#E53935"}
                />
                <Text style={[styles.stockBadgeText, !isAvailable && styles.stockBadgeTextDanger]}>{availabilityLabel}</Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleFavorite}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#E53935" : "#999"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleAddToCart} disabled={!isAvailable} style={!isAvailable && styles.disabledAction}>
                <Ionicons
                  name={isInCart ? "cart" : "cart-outline"}
                  size={24}
                  color={!isAvailable ? "#B0B0B0" : isInCart ? "#0D6E0D" : "#007BFF"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 16,
    borderRadius: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glassCard: {
    backgroundColor: "rgba(245, 248, 250, 0.95)",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(0, 123, 255, 0.15)",
    width: 210,
  },
  imageWrapper: { position: "relative" },
  image: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  soldOutOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#0D6E0D",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  content: { padding: 16 },
  name: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  price: { fontSize: 18, fontWeight: "800", color: "#0D6E0D" },
  oldPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  rating: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  reviews: { fontSize: 13, color: "#666" },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(194, 123, 0, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(194, 123, 0, 0.35)",
    marginBottom: 12,
  },
  stockBadgeDanger: {
    backgroundColor: "rgba(229, 57, 53, 0.12)",
    borderColor: "rgba(229, 57, 53, 0.4)",
  },
  stockBadgeText: { fontSize: 12, fontWeight: "700", color: "#8A5B00" },
  stockBadgeTextDanger: { color: "#B71C1C" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  disabledAction: { opacity: 0.45 },
});
