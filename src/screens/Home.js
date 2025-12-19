// Main landing page for the V Shop mobile application.

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  RefreshControl,
  StatusBar,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import FeaturedProducts from "../homeCom/FeaturedProducts";
import { useArticles } from "../hooks/useArticles";
import ArticleCard from "../components/articles/ArticleCard";
import Footer from "../components/layout/Footer";
import { useTheme } from "../theme/useTheme";
import { toggleFavorite as toggleFavoriteAction, loadFavorites } from "../features/favorites/favoritesSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import { updateArticleReactions } from "../services/articlesService";

const { width, height } = Dimensions.get("window");

export default function Home() {
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { colors, spacing, radius, shadow, typography, mode } = useTheme();

  const { articles } = useArticles({ featureHome: true });

  // ⭐ NEW — Local state for like/dislike/favorite
  const user = useSelector(selectCurrentUser);
  const favorites = useSelector((state) => state.favorites.items);

  // ⭐ Handlers
  const ensureAuthed = () => {
    if (!user) {
      Alert.alert(
        t("articles.authRequired", "Please login to manage favorites.")
      );
      return false;
    }
    return true;
  };

  const isLikedRemote = (article) =>
    user &&
    Array.isArray(article.likesBy) &&
    article.likesBy.includes(user.uid);

  const isDislikedRemote = (article) =>
    user &&
    Array.isArray(article.dislikesBy) &&
    article.dislikesBy.includes(user.uid);

  const toggleLike = async (article) => {
    if (!ensureAuthed()) return;

    const liked = isLikedRemote(article);
    const disliked = isDislikedRemote(article);

    await updateArticleReactions({
      articleId: article.id,
      userId: user.uid,
      like: !liked,
      dislike: false,
      likeDelta: liked ? -1 : 1,
      dislikeDelta: disliked ? -1 : 0,
    }).catch(() => {});
  };

  const toggleDislike = async (article) => {
    if (!ensureAuthed()) return;

    const liked = isLikedRemote(article);
    const disliked = isDislikedRemote(article);

    await updateArticleReactions({
      articleId: article.id,
      userId: user.uid,
      like: false,
      dislike: !disliked,
      likeDelta: liked ? -1 : 0,
      dislikeDelta: disliked ? -1 : 1,
    }).catch(() => {});
  };

  const toggleFavorite = (article) => {
    if (!article || !ensureAuthed()) return;
    dispatch(toggleFavoriteAction({ ...article, type: "article" }));
  };

  // Filter Articles: remove drafts, scheduled, unpublished
  const filteredArticles = useMemo(() => {
    const now = Date.now();

    return (articles || []).filter((a) => {
      const status = (a.status || a.state || a.visibility || "").toLowerCase();
      const isDraft = a.isDraft || status === "draft";

      const publishAt = a.publishedAt || a.publishDate;
      const ts = publishAt ? new Date(publishAt).getTime() : 0;

      const scheduled = ts && ts > now;
      const statusOk = status === "published" || status === "live";

      return !isDraft && !scheduled && statusOk;
    });
  }, [articles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  useEffect(() => {
    dispatch(loadFavorites());
  }, [dispatch]);

  const heroHeight = Math.round(height * 0.35);

  return (
    <>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
        >
          {/* HERO */}
          <Animated.View entering={FadeInDown.duration(800).springify()}>
            <ImageBackground
              source={{ uri: "https://images.pexels.com/photos/265242/pexels-photo-265242.jpeg?q=85&fit=crop" }}
              style={[styles.hero, { height: heroHeight }]}
              resizeMode="cover"
            >
              <View style={[styles.heroOverlay, { backgroundColor: colors.overlay }]}>
                <View
                  style={{
                    paddingHorizontal: spacing.xl,
                    paddingBottom: spacing.xl * 1.5,
                    justifyContent: "flex-end",
                  }}
                >
                  <Animated.View entering={FadeInDown.delay(200).duration(700)}>
                    <Text
                      style={{
                        fontSize: typography.sizes.xxl,
                        color: colors.card,
                        fontWeight: typography.weights.extrabold,
                        lineHeight: typography.sizes.xxl + 6,
                        letterSpacing: -0.5,
                      }}
                    >
                      {t("home.hero.title", "V Shop Excellence")}
                    </Text>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(350).duration(700)}>
                    <Text
                      style={{
                        marginTop: spacing.md,
                        fontSize: typography.sizes.md,
                        color: colors.card,
                        opacity: 0.9,
                        lineHeight: 22,
                        maxWidth: width * 0.82,
                      }}
                    >
                      {t(
                        "home.hero.subtitle",
                        "Premium nutrition, tools & care for livestock, crops and pets – trusted by professionals."
                      )}
                    </Text>
                  </Animated.View>

                  <Animated.View entering={FadeInDown.delay(600).duration(700)}>
                    <TouchableOpacity
                      style={{
                        marginTop: spacing.lg,
                        backgroundColor: colors.card,
                        paddingVertical: spacing.lg,
                        paddingHorizontal: spacing.xl,
                        borderRadius: radius.lg,
                        alignSelf: "flex-start",
                        shadowColor: shadow.color,
                        shadowOffset: shadow.offset,
                        shadowOpacity: shadow.opacity,
                        shadowRadius: shadow.radius,
                        ...(Platform.OS === "android" ? { elevation: 6 } : {}),
                      }}
                      activeOpacity={0.88}
                      onPress={() => navigation.navigate("Shop")}
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: typography.sizes.md,
                          fontWeight: typography.weights.bold,
                        }}
                      >
                        {t("home.hero.cta", "Explore Products")}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* FEATURED PRODUCTS */}
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 1.25 }}>
            <FeaturedProducts />
          </View>

          {/* ARTICLES */}
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 1.25 }}>
            <Text
              style={{
                fontSize: typography.sizes.xl,
                fontWeight: typography.weights.extrabold,
                color: colors.text,
                marginBottom: spacing.lg,
                letterSpacing: -0.3,
              }}
            >
              {t("home.articles.title", "Articles")}
            </Text>

            <FlatList
              data={filteredArticles}
              keyExtractor={(item) => item.id?.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const isFavorite = !!favorites?.find(
                  (fav) => fav.id === item.id && fav.type === "article"
                );
                const isLiked = isLikedRemote(item);
                const isDisliked = isDislikedRemote(item);

                return (
                  <View style={{ width: width * 0.72, marginRight: spacing.md }}>
                    <ArticleCard
                      article={item}
                      showFavorite
                      isFavorite={isFavorite}
                      isLiked={isLiked}
                      isDisliked={isDisliked}
                      onFavoriteToggle={() => toggleFavorite(item)}
                      onLike={() => toggleLike(item)}
                      onDislike={() => toggleDislike(item)}
                      onPress={() => navigation.navigate("ArticleDetails", { article: item })}
                      isCompact
                    />
                  </View>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            />
          </View>

          {/* FOOTER */}
          <Footer />
          <View style={{ height: spacing.sm }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: "100%", justifyContent: "flex-end" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
});
