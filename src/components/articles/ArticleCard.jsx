// ArticleCard.jsx

/**
 * ArticleCard Component
 * ---------------------------------------------------------------
 * Reusable UI card for displaying article previews throughout the app.
 *
 * FEATURES:
 * - Displays hero image, tag, title, summary and action buttons.
 * - Supports:
 *      • Favorite toggle
 *      • Like / Dislike actions
 *      • Optional compact mode
 *      • Optional comments preview
 *      • Press to open full article
 *
 * PROPS:
 * - article: Full article object
 * - showFavorite: toggle display of favorite button
 * - showComments: show latest 1–2 article comments
 * - onFavoriteToggle, onLike, onDislike: callbacks
 * - isFavorite, isLiked, isDisliked: controlled states
 * - isCompact: reduces text lines for list display
 * - onPress: opens ArticleDetails
 *
 * NOTES:
 * - No logic or UI behavior has been modified in this refactor.
 * - Only formatting, structuring and documentation improvements added.
 * ---------------------------------------------------------------
 */

import React, { useMemo } from "react";

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/useTheme";



export default function ArticleCard({
  article,
  showFavorite = true,
  showComments = false,
  onFavoriteToggle,
  onLike,
  onDislike,
  isFavorite = false,
  isLiked = false,
  isDisliked = false,
  isCompact = false,
  onPress,
}) {
  // -------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------
  const { t, i18n } = useTranslation();
  const { colors, shadow, radius, spacing, typography, mode } = useTheme();

  const isDark = mode === "dark";

  // -------------------------------------------------------------
  // Memoized localization fields
  // -------------------------------------------------------------
  const localeFields = useMemo(() => {
    const langKey = (i18n?.language || "en").split("-")[0];
    const translated = article?.translations?.[langKey];

    return {
      title: translated?.title || article.title,
      summary:
        translated?.summary ||
        translated?.content ||
        article.summary ||
        article.content ||
        article.body ||
        "",
      tag: translated?.tag || article.tag,
    };
  }, [article, i18n?.language]);



  // -------------------------------------------------------------
  // Internal handlers
  // -------------------------------------------------------------
  const handleFavorite = () => onFavoriteToggle?.(article);
  const handleLike = () => onLike?.(article);
  const handleDislike = () => onDislike?.(article);
  const handleOpen = () => onPress?.(article);



  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <Pressable
      onPress={handleOpen}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: shadow.color,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          shadowOffset: shadow.offset,
          elevation: 4,
        },
        pressed && styles.pressed,
      ]}
    >
      {article.heroImage ? (
        <ImageBackground
          source={{ uri: article.heroImage }}
          style={styles.image}
          imageStyle={styles.imageRadius}
        />
      ) : null}

      <View
        style={[
          styles.content,
          {
            padding: spacing.md,
            gap: spacing.sm,
          },
        ]}
      >
        {/* Tag */}
        <View
          style={[
            styles.tag,
            { backgroundColor: colors.surfaceMuted },
          ]}
        >
          <Text
            style={[
              styles.tagText,
              { color: colors.primary },
            ]}
          >
            {localeFields.tag ||
              t("articles.tag.insights", "Insights")}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            isCompact && styles.titleCompact,
            {
              color: colors.text,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.extrabold,
            },
          ]}
          numberOfLines={isCompact ? 2 : 3}
        >
          {localeFields.title}
        </Text>

        {/* Summary */}
        <Text
          style={[
            styles.summary,
            {
              color: colors.textMuted,
              fontSize: typography.sizes.sm,
              lineHeight: 18,
            },
          ]}
          numberOfLines={isCompact ? 2 : 4}
        >
          {localeFields.summary}
        </Text>

        {/* Action Buttons */}
        <View
          style={[
            styles.actionsRow,
            { gap: spacing.md },
          ]}
        >
          <IconAction
            icon={isLiked ? "thumbs-up" : "thumbs-up-outline"}
            color={isLiked ? colors.primary : colors.text}
            onPress={handleLike}
          />

          <IconAction
            icon={isDisliked ? "thumbs-down" : "thumbs-down-outline"}
            color={isDisliked ? colors.danger : colors.text}
            onPress={handleDislike}
          />

          {showFavorite && (
            <IconAction
              icon={isFavorite ? "heart" : "heart-outline"}
              color={isFavorite ? colors.danger : colors.text}
              onPress={handleFavorite}
            />
          )}
        </View>

        {/* Comments Section */}
        {showComments &&
          article.comments?.length > 0 && (
            <View
              style={[
                styles.commentsBox,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.commentsTitle,
                  { color: colors.text },
                ]}
              >
                {t("articles.comments", "Comments")} (
                {article.comments.length})
              </Text>

              <View
                style={[
                  styles.commentsList,
                  { gap: spacing.xs },
                ]}
              >
                {article.comments
                  .slice(0, 2)
                  .map((comment, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.commentItem,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.commentAuthor,
                          { color: colors.accent },
                        ]}
                      >
                        {comment.userName}
                      </Text>

                      <Text
                        style={[
                          styles.commentText,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={2}
                      >
                        {comment.comment}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

        {/* Read More Button */}
        {onPress && (
          <Pressable
            onPress={handleOpen}
            style={({ pressed }) => [
              styles.readMore,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingVertical: spacing.sm + 2,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.readMoreText,
                { color: colors.surface },
              ]}
            >
              {t("articles.readMore", "Continue reading")}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.surface}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}



/* -------------------------------------------------------------
 * Sub Component: Action Button
 * ------------------------------------------------------------- */
const IconAction = ({ icon, color, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.iconAction,
      pressed && styles.pressed,
    ]}
  >
    <Ionicons name={icon} size={18} color={color} />
  </Pressable>
);



/* -------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------- */
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },

  pressed: { opacity: 0.9 },

  image: {
    height: 180,
    justifyContent: "flex-start",
  },

  imageRadius: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  content: {
    padding: 14,
    gap: 8,
  },

  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  tagText: {
    fontWeight: "700",
    fontSize: 11,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
  },

  titleCompact: {
    fontSize: 15,
  },

  summary: {
    fontSize: 13,
    lineHeight: 18,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
    alignItems: "center",
  },

  iconAction: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  commentsBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  commentsTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  commentsList: {
    gap: 6,
  },

  commentItem: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  commentAuthor: {
    fontSize: 12,
    fontWeight: "700",
  },

  commentText: {
    fontSize: 12,
  },

  readMore: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  readMoreText: {
    fontWeight: "700",
    fontSize: 13,
  },
});
