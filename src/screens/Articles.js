// src/screens/Articles.js

/**
 * Articles Screen
 * -------------------------------------------------------------
 * This screen is responsible for displaying a dynamic list of 
 * published articles fetched in real time from Firestore via 
 * `subscribeToArticles`. It also handles user interactions such as:
 *
 *  - Opening article details
 *  - Marking items as favorite
 *  - Liking and disliking articles
 *  - Pull-to-refresh integration
 *
 * Filtering:
 * Articles are filtered to only show:
 *  - published / live
 *  - not drafts
 *  - not scheduled for the future
 *
 * State Management:
 *  - Uses Redux to check authentication and manage article favorites.
 * UI Behavior:
 *  - Displays an app-style header with back navigation.
 *  - Supports empty states, refreshing, and theme-based styling.
 *
 * NOTE:
 * No business logic, UI layout, or component behavior has been changed.
 * Only formatting and documentation improvements were made.
 * -------------------------------------------------------------
 */

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";

import ArticleCard from "../components/articles/ArticleCard";
import {
  subscribeToArticles,
  updateArticleReactions,
} from "../services/articlesService";

import { selectCurrentUser } from "../features/auth/authSlice";
import { toggleFavorite } from "../features/favorites/favoritesSlice";

import { useTranslation } from "react-i18next";
import { useTheme } from "../theme/useTheme";



export default function ArticlesScreen({ navigation }) {
  // -----------------------------
  // Local State
  // -----------------------------
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // -----------------------------
  // Global State
  // -----------------------------
  const user = useSelector(selectCurrentUser);
  const favorites = useSelector((state) => state.favorites.items);

  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  // RTL Handling
  const isRTL =
    (i18n?.dir?.() || "ltr") === "rtl" ||
    i18n?.language?.startsWith("ar");

  // Theme
  const { colors, spacing, radius, typography } = useTheme();



  // -----------------------------
  // Filter Articles (Memoized)
  // -----------------------------
  const filteredArticles = useMemo(() => {
    const now = Date.now();

    return articles.filter((a) => {
      const status =
        (a.status || a.state || a.visibility || "").toLowerCase();

      const isDraft = a.isDraft || status === "draft";

      const publishAt = a.publishedAt || a.publishDate;
      const ts = publishAt ? new Date(publishAt).getTime() : 0;

      const scheduled = publishAt && publishAt > now;
      const statusOk = status === "published" || status === "live";

      return !isDraft && !scheduled && statusOk;
    });
  }, [articles]);



  // -----------------------------
  // Subscribe to Articles
  // -----------------------------
  useEffect(() => {
    const unsubscribe = subscribeToArticles({}, (records) => {
      setArticles(records);
    });

    return () => unsubscribe();
  }, []);



  // -----------------------------
  // Refresh Handler
  // -----------------------------
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);



  // -----------------------------
  // Navigation
  // -----------------------------
  const handleOpen = (article) => {
    navigation.navigate("ArticleDetails", { article });
  };



  // -----------------------------
  // Favorites
  // -----------------------------
  const isFav = (id) =>
    favorites.some((f) => f.id === id && f.type === "article");

  const handleFavoriteToggle = (article) => {
    dispatch(
      toggleFavorite({
        id: article.id,
        type: "article",
        title: article.title,
        summary: article.summary,
        heroImage: article.heroImage || null,
      })
    );
  };



  // -----------------------------
  // Ensure user is logged in
  // -----------------------------
  const ensureAuthed = () => {
    if (!user) {
      alert(
        t(
          "articles.authRequired",
          "Please login to manage favorites."
        )
      );
      return false;
    }
    return true;
  };



  // -----------------------------
  // Like / Dislike Handlers
  // -----------------------------
  const handleLike = async (article) => {
    if (!ensureAuthed()) return;

    const liked =
      Array.isArray(article.likesBy) &&
      article.likesBy.includes(user.uid);

    const disliked =
      Array.isArray(article.dislikesBy) &&
      article.dislikesBy.includes(user.uid);

    try {
      await updateArticleReactions({
        articleId: article.id,
        userId: user.uid,
        like: !liked,
        dislike: false,
        likeDelta: liked ? -1 : 1,
        dislikeDelta: disliked ? -1 : 0,
      });
    } catch (e) {
      console.log("like failed", e);
    }
  };

  const handleDislike = async (article) => {
    if (!ensureAuthed()) return;

    const disliked =
      Array.isArray(article.dislikesBy) &&
      article.dislikesBy.includes(user.uid);

    const liked =
      Array.isArray(article.likesBy) &&
      article.likesBy.includes(user.uid);

    try {
      await updateArticleReactions({
        articleId: article.id,
        userId: user.uid,
        like: false,
        dislike: !disliked,
        likeDelta: liked ? -1 : 0,
        dislikeDelta: disliked ? -1 : 1,
      });
    } catch (e) {
      console.log("dislike failed", e);
    }
  };



  // -----------------------------
  // Render
  // -----------------------------
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.topBar,
          isRTL && styles.topBarRTL,
          {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          },
        ]}
      >
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                shadowColor: "transparent",
              },
            ]}
          >
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <Text style={[styles.topTitle, { color: colors.text }]}>
          {t("articles.listTitle", "Articles")}
        </Text>

        <View style={{ width: 36 }} />
      </View>



      {/* Articles List */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={[
          styles.content,
          { padding: spacing.lg, gap: spacing.md },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View
            style={[
              styles.header,
              { paddingBottom: spacing.sm },
            ]}
          >
            <Text
              style={{
                fontSize: typography.sizes.xl,
                fontWeight: typography.weights.extrabold,
                color: colors.text,
              }}
            >
              {t("articles.listTitle", "Articles")}
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.textMuted },
              ]}
            >
              {t(
                "articles.listSubtitle",
                "Fresh guidance and tips from our agronomy and veterinary team."
              )}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            showFavorite
            isFavorite={isFav(item.id)}
            isLiked={
              Array.isArray(item.likesBy) && user
                ? item.likesBy.includes(user.uid)
                : false
            }
            isDisliked={
              Array.isArray(item.dislikesBy) && user
                ? item.dislikesBy.includes(user.uid)
                : false
            }
            onFavoriteToggle={handleFavoriteToggle}
            onLike={handleLike}
            onDislike={handleDislike}
            onPress={() => handleOpen(item)}
          />
        )}
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: colors.textMuted },
            ]}
          >
            {t(
              "articles.empty",
              "No articles available right now."
            )}
          </Text>
        }
      />
    </SafeAreaView>
  );
}



// ---------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------
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
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  content: {},

  header: { paddingBottom: 10 },

  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  empty: {
    textAlign: "center",
    marginTop: 30,
  },
});
