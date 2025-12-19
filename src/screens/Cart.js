/**
 * Displays all cart items, supports search, quantity updates,
 * item removal, and navigation to Checkout or Shop.
 * Features:
 * - Load cart from Redux store
 * - Search filter (by product name or title)
 * - Dynamic stock color + text
 * - Increase / decrease item quantity
 * - Remove item from cart
 * - Calculates cart total
 * - Navigates to Checkout or Shop
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getLangKey, getLocalizedName } from "../utils/productLocalization";

// Redux actions
import {
  removeFromCart,
  decreaseQuantity,
  increaseQuantity,
  loadCart,
  setQuantity,
} from "../features/cart/cartSlice";

// Theme hook
import { useTheme } from "../theme/useTheme";

export default function Cart() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const langKey = getLangKey(i18n.language);

  // Get cart items from Redux store
  const { items } = useSelector((state) => state.cart);

  // Local search state
  const [search, setSearch] = useState("");

  // Theme-based styling values
  const { colors, spacing, radius, typography } = useTheme();

  /**
   * Load stored cart items when component mounts
   * Ensures cart persists between app restarts
   */
  useEffect(() => {
    dispatch(loadCart());
  }, [dispatch]);

  /**
   * Filter items based on search term
   * Memoized for performance to avoid recomputation on every render
   */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const name = getLocalizedName(item, langKey).toLowerCase();
      return !search || name.includes(search.trim().toLowerCase());
    });
  }, [items, search, langKey]);

  /**
   * Calculates the total price of the filtered items
   */
  const total = filteredItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const hasOutOfStock = useMemo(
    () =>
      items.some((item) => {
        const stock = Number(item?.stock ?? item?.quantity ?? 0);
        const qty = Number(item?.quantity || 1);
        return stock <= 0 || qty > stock || item?.isAvailable === false;
      }),
    [items]
  );

  // Check if the cart is empty after filtering
  const isEmpty = filteredItems.length === 0;

  /**
   * Render each item in the FlatList
   * Handles UI layout + quantity controls + remove action
   */
  const renderItem = ({ item }) => {
    // Select the best available product image
    const imageUrl =
      item.thumbnailUrl ||
      item.imageUrl ||
      (item.images && item.images[0]) ||
      "https://via.placeholder.com/120";

    const stock = item.stock ?? item.quantityAvailable ?? item.quantity ?? null;
    const isUnavailableFlag = item?.isAvailable === false;
    const realStock = stock == null ? null : stock - (item.quantity || 1);
    const isLastPiece = realStock === 0 && stock > 0;
    const showStock = isUnavailableFlag || (realStock !== null && realStock <= 5);
    const stockText = isUnavailableFlag
      ? t("cart.outOfStock", "Out of stock")
      : realStock == null
        ? null
        : isLastPiece
          ? t("cart.lastPiece", "Last piece")
          : realStock > 0
            ? t("cart.lowStock", "Low stock")
            : t("cart.outOfStock", "Out of stock");
    const stockColor = isUnavailableFlag || realStock <= 0 ? colors.danger : colors.warning;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            gap: spacing.sm,
            borderRadius: radius.md,
          },
        ]}
      >
        {/* Product image */}
        <Image
          source={{ uri: imageUrl }}
          style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}
        />

        {/* Product content */}
        <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                {getLocalizedName(item, langKey)}
              </Text>

          {/* Price + SKU */}
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {(item.price || 0).toFixed(2)} EGP{" "}
            {item.sku ? ` | SKU: ${item.sku}` : ""}
          </Text>

          {/* Stock status */}
          {showStock && stockText ? (
            <Text style={[styles.stock, { color: stockColor }]}>
              {stockText}
            </Text>
          ) : null}

          {/* Quantity controls + delete button */}
          <View style={styles.row}>
            <View
              style={[
                styles.qtyPill,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Pressable onPress={() => dispatch(decreaseQuantity(item.id))}>
                <Ionicons name="remove" size={18} color={colors.text} />
              </Pressable>

              <Text style={[styles.qtyText, { color: colors.text }]}>
                {item.quantity || 1}
              </Text>

              <Pressable onPress={() => dispatch(increaseQuantity(item.id))}>
                <Ionicons name="add" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Remove item */}
            <Pressable onPress={() => dispatch(removeFromCart(item.id))}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingHorizontal: spacing.md },
      ]}
    >
      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            gap: spacing.sm,
            borderRadius: radius.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("products.search", "Search by product name")}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Cart items list */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {t("cart.empty", "Your cart is empty.")}
          </Text>
        }
      />

      {/* Footer (Total + CTA) */}
      <View
        style={[
          styles.footerBar,
          { borderTopColor: colors.border, paddingVertical: spacing.md },
        ]}
      >
        <View>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
            {t("cart.total", "Total")}
          </Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {total.toFixed(2)} EGP
          </Text>
        </View>

        {/* CTA button */}
        {isEmpty ? (
          <Pressable
            style={[
              styles.checkout,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingVertical: spacing.md,
              },
            ]}
            onPress={() => navigation.navigate("Shop")}
          >
            <Text style={[styles.checkoutText, { color: colors.surface }]}>
              {t("cart.add", "Add to Cart")}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.checkout,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingVertical: spacing.md,
                opacity: hasOutOfStock ? 0.5 : 1,
              },
            ]}
            onPress={() => {
              if (hasOutOfStock) {
                Alert.alert(
                  t("common.error", "Error"),
                  t("checkout.errors.outOfStock", "One or more items are out of stock. Please update your cart.")
                );
                return;
              }
              navigation.navigate("Checkout");
            }}
            disabled={hasOutOfStock}
          >
            <Text style={[styles.checkoutText, { color: colors.surface }]}>
              {t("cart.checkout", "Checkout")}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
/* 
 * Styles
 * */

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  card: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "center",
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  name: { fontSize: 15, fontWeight: "800" },
  meta: { fontSize: 12 },
  stock: { fontSize: 12, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 12,
    height: 36,
  },
  qtyText: { fontSize: 14, fontWeight: "800" },

  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 12 },
  totalValue: { fontSize: 18, fontWeight: "800" },

  checkout: {
    paddingHorizontal: 18,
  },
  checkoutText: { fontWeight: "800" },

  empty: {
    textAlign: "center",
    marginTop: 30,
  },
});
