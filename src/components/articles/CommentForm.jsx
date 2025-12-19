import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { addArticleComment } from "../../services/articlesService";

const CommentForm = ({ articleId, user, onCommentAdded }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.uid || !comment.trim()) return;
    setSubmitting(true);
    try {
      await addArticleComment(
        articleId,
        user.uid,
        comment,
        user.displayName || user.email
      );
      setComment("");
      onCommentAdded?.();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={18} color="#0F172A" />
        <Text style={styles.title}>{t("articles.commentTitle", "Send Comment to Admin")}</Text>
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder={t(
          "articles.commentPlaceholder",
          "Write your comment here... (Only visible to administrators)"
        )}
        multiline
        numberOfLines={4}
        style={styles.textarea}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={submitting || !comment.trim()}
        style={({ pressed }) => [
          styles.submit,
          pressed && styles.pressed,
          (submitting || !comment.trim()) && styles.disabled,
        ]}
      >
        <Text style={styles.submitText}>
          {submitting ? t("articles.sending", "Sending...") : t("articles.send", "Send to Admin")}
        </Text>
      </Pressable>
    </View>
  );
};

export default CommentForm;

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  textarea: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  submit: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#10B981",
    borderRadius: 12,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
