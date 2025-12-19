// src/screens/ArticleDetails.js
/**
 * Article Details Screen
 * Shows a single article with localized content, reactions, and favorites.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import ErrorMessage from "../components/ui/ErrorMessage";
import { selectCurrentUser } from "../features/auth/authSlice";
import { toggleFavorite } from "../features/favorites/favoritesSlice";
import {
  subscribeToArticle,
  incrementArticleView,
  updateArticleReactions,
} from "../services/articlesService";
import { useTheme } from "../theme/useTheme";

export default function ArticleDetails() {
  const route = useRoute();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();

  const user = useSelector(selectCurrentUser);
  const favorites = useSelector((state) => state.favorites?.items || []);

  const initialArticle = route.params?.article;
  const [article, setArticle] = useState(initialArticle || null);

  const articleId = initialArticle?.id || route.params?.id;

  const heroImage = article?.heroImage || article?.image || article?.coverImage;

  // Sync article in real time
  useEffect(() => {
    if (!articleId) return;

    const unsub = subscribeToArticle(articleId, (data) => {
      if (data) setArticle(data);
    });

    incrementArticleView(articleId).catch(() => {});
    return () => unsub && unsub();
  }, [articleId]);

  // Localized fields
  const localeFields = useMemo(() => {
    if (!article) return { title: "", summary: "", content: "" };

    const lang = i18n.language || "en";
    const isAr = lang.startsWith("ar");

    if (isAr && article.translations?.ar) {
      return {
        title: article.translations.ar.title || article.title,
        summary: article.translations.ar.summary || article.summary,
        content: article.translations.ar.content || article.content || article.summary,
      };
    }

    return {
      title: article.title,
      summary: article.summary,
      content: article.content || article.body || article.summary,
    };
  }, [article, i18n.language]);

  // Reactions & Favorites
  const likesBy = Array.isArray(article?.likesBy) ? article.likesBy : [];
  const dislikesBy = Array.isArray(article?.dislikesBy) ? article.dislikesBy : [];

  const isLiked = user ? likesBy.includes(user.uid) : false;
  const isDisliked = user ? dislikesBy.includes(user.uid) : false;

  const isFavorite = favorites.some((f) => f.id === articleId && f.type === "article");

  // Handlers
  const onLike = async () => {
    if (!user) {
      return Alert.alert(
        t("auth.login_required", "Login required"),
        t("articles.login_to_react", "Please sign in to react to articles.")
      );
    }

    await updateArticleReactions({
      articleId,
      userId: user.uid,
      like: !isLiked,
      dislike: false,
      likeDelta: isLiked ? -1 : 1,
      dislikeDelta: isDisliked ? -1 : 0,
    }).catch(() => {});
  };

  const onDislike = async () => {
    if (!user) {
      return Alert.alert(
        t("auth.login_required", "Login required"),
        t("articles.login_to_react", "Please sign in to react to articles.")
      );
    }

    await updateArticleReactions({
      articleId,
      userId: user.uid,
      like: false,
      dislike: !isDisliked,
      likeDelta: isLiked ? -1 : 0,
      dislikeDelta: isDisliked ? -1 : 1,
    }).catch(() => {});
  };

  // No article found
  if (!article) {
    return <ErrorMessage backTo="Articles" />;
  }

  // Render UI
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: 16, gap: 10 }]}
    >
      {heroImage ? (
        <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceMuted }]}>
          <Image source={{ uri: heroImage }} style={styles.image} resizeMode="cover" />
        </View>
      ) : null}

      <Text style={[styles.title, { color: colors.text }]}>{localeFields.title}</Text>

      {article.tag ? (
        <Text style={[styles.tag, { color: colors.primary }]}>{article.tag}</Text>
      ) : null}

      <Text style={[styles.body, { color: colors.textMuted }]}>{localeFields.content}</Text>

      <View style={styles.actions}>
        <Action
          icon={isLiked ? "thumbs-up" : "thumbs-up-outline"}
          color={colors.success}
          onPress={onLike}
        />

        <Action
          icon={isDisliked ? "thumbs-down" : "thumbs-down-outline"}
          color={colors.danger}
          onPress={onDislike}
        />

        <Action
          icon={favoritesIcon(isFavorite)}
          color={isFavorite ? colors.danger : colors.text}
          onPress={() =>
            dispatch(
              toggleFavorite({
                id: articleId,
                type: "article",
                title: localeFields.title,
                summary: localeFields.summary,
                heroImage: heroImage || null,
              })
            )
          }
        />
      </View>
    </ScrollView>
  );
}

// Helpers
const favoritesIcon = (fav) => (fav ? "heart" : "heart-outline");

const Action = ({ icon, color, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
    <Ionicons name={icon} size={20} color={color} />
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
  imageWrapper: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  tag: {
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
});
