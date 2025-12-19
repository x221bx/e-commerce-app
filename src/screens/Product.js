// src/screens/ProductsScreen.js
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../homeCom/ProductCard";
import { getProducts } from "../services/homeData";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite } from "../features/favorites/favoritesSlice";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/useTheme";
import { selectCurrentUser } from "../features/auth/authSlice";
import { Alert } from "react-native";
import { getLocalizedName } from "../utils/productLocalization";

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const cartItems = useSelector((state) => state.cart.items || []);
  const favorites = useSelector((state) => state.favorites.items || []);
  const { colors, spacing, radius, typography, shadow } = useTheme();

  const isInCart = (id) => cartItems.some((p) => p.id === id);
  const isFav = (id) => favorites.some((f) => f.id === id && f.type !== "article");

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCardPress = (product) => {
    navigation.navigate("ProductDetails", { product });
  };

  const filtered = products.filter((p) => {
    const text = search.trim().toLowerCase();
    if (!text) return true;
    const localizedName = getLocalizedName(p, i18n.language).toLowerCase();
    return localizedName.includes(text);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id?.toString()}
        numColumns={2}
        columnWrapperStyle={[styles.column, { marginBottom: spacing.md }]}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProducts();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.header, { paddingVertical: spacing.md }]}>
            <Text
              style={{
                fontSize: typography.sizes.xl + 2,
                fontWeight: typography.weights.extrabold,
                color: colors.text,
              }}
            >
              {t("products.title", "Our Products")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t("products.subtitle", "Premium picks for farm, garden, and pets")}
            </Text>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  gap: spacing.sm,
                  borderRadius: radius.md,
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
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => handleCardPress(item)}
            onAddToCart={(product) => {
              const stock = Number(product?.stock ?? product?.quantity ?? 0);
              if (stock <= 0 || product?.isAvailable === false) {
                Alert.alert(t("common.error", "Error"), t("cart.outOfStock", "Out of stock"));
                return;
              }
              if (!user) {
                Alert.alert(t("common.error", "Error"), t("cart.loginToAddToCart", "Please login to add to cart."));
                return;
              }
              dispatch(addToCart({ ...product, stock }));
            }}
            onFavoriteToggle={(product) => dispatch(toggleFavorite(product))}
            isFavorite={isFav(item.id)}
            isInCart={isInCart(item.id)}
            variant="grid"
          />
        )}
        ListEmptyComponent={
          !loading && (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t("products.empty", "No products available right now.")}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}
 // Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
  },
  header: {
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A" },
  column: {
    justifyContent: "space-between",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
  },
});
