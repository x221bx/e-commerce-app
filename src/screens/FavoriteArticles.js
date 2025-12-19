// src/screens/FavoriteArticles.js
import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Pressable,
  I18nManager,
} from "react-native";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useTranslation } from "react-i18next";

import { loadFavorites, toggleFavorite } from "../features/favorites/favoritesSlice";
import { useTheme } from "../theme/useTheme";

const toArabic = (v, lang) =>
  lang === "ar" ? v?.toString()?.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]) : v;

export default function FavoriteArticles({ navigation }) {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { colors, shadow, spacing, radius } = useTheme();

  const favoriteItems = useSelector((state) => state.favorites?.items, shallowEqual);
  const items = useMemo(
    () => (favoriteItems || []).filter((i) => i.type === "article"),
    [favoriteItems]
  );

  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  const renderArticle = ({ item }) => (
    <Pressable
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
          flexDirection: lang === "ar" ? "row-reverse" : "row",
        },
      ]}
      onPress={() => navigation.navigate("ArticleDetails", { article: item })}
    >
      <Image
        source={{
          uri:
            item.heroImage ||
            item.thumbnailUrl ||
            item.imageUrl ||
            "https://via.placeholder.com/120",
        }}
        style={[
          styles.thumb,
          {
            backgroundColor: colors.surfaceMuted,
            borderRadius: radius.md,
          },
        ]}
      />

      <View
        style={{
          flex: 1,
          gap: spacing.xs,
          writingDirection: lang === "ar" ? "rtl" : "ltr",
        }}
      >
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {item.title || item.name}
        </Text>

        {item.summary ? (
          <Text
            style={[styles.summary, { color: colors.textMuted }]}
            numberOfLines={3}
          >
            {item.summary}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.remove,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.border,
              borderRadius: radius.sm,
            },
          ]}
          onPress={() => dispatch(toggleFavorite(item))}
        >
          <Text
            style={[
              styles.removeText,
              { color: colors.danger, writingDirection: lang === "ar" ? "rtl" : "ltr" },
            ]}
          >
            {t("cart.remove", "Remove")}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          padding: spacing.md,
          writingDirection: lang === "ar" ? "rtl" : "ltr",
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colors.text, textAlign: lang === "ar" ? "right" : "left" },
        ]}
      >
        {t("navbar.favArticles", "Favorite Articles")}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderArticle}
        contentContainerStyle={{
          paddingVertical: spacing.xs,
          gap: spacing.sm,
        }}
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: colors.textMuted, writingDirection: lang === "ar" ? "rtl" : "ltr" },
            ]}
          >
            {t("articles.empty", "No articles available right now.")}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
  },
  thumb: { width: 80, height: 80 },
  name: { fontSize: 16, fontWeight: "700" },
  summary: { fontSize: 12, lineHeight: 17 },
  remove: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  removeText: { fontWeight: "700", fontSize: 12 },
  empty: { textAlign: "center", marginTop: 20, fontSize: 14, fontWeight: "600" },
});
