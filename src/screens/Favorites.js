// src/screens/Favorites.js
import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  Alert,
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { loadFavorites, toggleFavorite } from "../features/favorites/favoritesSlice";
import { addToCart } from "../features/cart/cartSlice";

import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/useTheme";
import { getLangKey, getLocalizedName } from "../utils/productLocalization";

export default function Favorites() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const langKey = getLangKey(i18n.language);
  const { colors, shadow, spacing, radius } = useTheme();

  const rawItems = useSelector((state) => state.favorites?.items || []);

  const items = React.useMemo(() => {
    return rawItems.filter((i) => i.type !== "article");
  }, [rawItems]);

  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  const renderProduct = ({ item }) => {
    const imageUri =
      item.thumbnailUrl ||
      item.imageUrl ||
      (item.images && item.images[0]) ||
      "https://via.placeholder.com/120";

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: shadow.color,
            shadowOpacity: shadow.opacity,
            shadowRadius: shadow.radius,
            shadowOffset: shadow.offset,
            borderRadius: radius.md,
            gap: spacing.sm,
          },
        ]}
      >
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.thumb,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.sm,
            },
          ]}
        />

        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>
            {getLocalizedName(item, langKey)}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {(item.price || 0).toLocaleString()} EGP
          </Text>
        </View>

        <View style={[styles.actions, { gap: spacing.xs }]}>
          <Pressable
            style={[
              styles.add,
              { backgroundColor: colors.primary, borderRadius: radius.sm },
            ]}
            onPress={() => {
              const stock = Number(item?.stock ?? item?.quantity ?? 0);
              if (stock <= 0 || item?.isAvailable === false) {
                Alert.alert(
                  t("common.error", "Error"),
                  t("checkout.errors.outOfStock", "One or more items are out of stock. Please update your cart.")
                );
                return;
              }
              dispatch(addToCart({ ...item, stock }));
              dispatch(toggleFavorite(item));
            }}
          >
            <Text style={[styles.addText, { color: colors.surface }]}>
              {t("cart.add", "Add to Cart")}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.remove,
              {
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.sm,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => dispatch(toggleFavorite(item))}
          >
            <Text style={[styles.removeText, { color: colors.danger }]}>
              {t("cart.remove", "Remove")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.md },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {t("navbar.favorites", "Favorites")}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={{
          paddingVertical: spacing.xs,
          gap: spacing.sm,
        }}
        renderItem={renderProduct}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {t("favorites.empty", "No favorites yet.")}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },

  thumb: {
    width: 60,
    height: 60,
    marginRight: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  actions: {
    gap: 6,
  },

  add: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  addText: {
    fontWeight: "700",
    fontSize: 12,
  },

  remove: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  removeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
  },
});
