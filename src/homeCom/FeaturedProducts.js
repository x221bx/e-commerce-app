// src/homeCom/FeaturedProducts.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from "react-native";
import ProductCard from "./ProductCard";
import theme from "../theme";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite } from "../features/favorites/favoritesSlice";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { selectCurrentUser } from "../features/auth/authSlice";

export default function FeaturedProducts({ titleKey = "home.featuredProducts" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  const cartItems = useSelector((state) => state.cart.items || []);
  const favorites = useSelector((state) => state.favorites.items || []);
  const { t } = useTranslation();

  const isInCart = (id) => cartItems.some((p) => p.id === id);
  const isFav = (id) => favorites.some((f) => f.id === id && f.type !== "article");

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      try {
        const { fetchFeaturedProducts } = await import("../services/homeData");
        const data = await fetchFeaturedProducts();
        if (mounted) setProducts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={{ marginVertical: theme.SPACING * 10 }}
      />
    );
  if (!products.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t(titleKey, "Handpicked for You")}</Text>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onAddToCart={(product) => {
              if (!user) {
                Alert.alert(t("common.error", "Error"), t("cart.loginToAddToCart", "Please login to add to cart."));
                return;
              }
              dispatch(addToCart(product));
            }}
            onFavoriteToggle={(product) => dispatch(toggleFavorite(product))}
            isFavorite={isFav(item.id)}
            isInCart={isInCart(item.id)}
            onPress={() => navigation.navigate("ProductDetails", { product: item })}
          />
        )}
        contentContainerStyle={styles.list}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: theme.SPACING * 6 },
  title: {
    fontSize: theme.typography.scale(2),
    fontWeight: theme.typography.weights.heavy,
    color: theme.colors.text,
    paddingHorizontal: theme.SPACING * 2,
    marginBottom: theme.SPACING * 3,
    letterSpacing: -0.6,
  },
  list: { paddingHorizontal: theme.SPACING * 2 },
});
