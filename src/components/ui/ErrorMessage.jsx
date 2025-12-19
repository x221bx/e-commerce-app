import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function ErrorMessage({
  title,
  message,
  showBackButton = true,
  backTo = "Articles",
  backText,
  icon = "bookmark-outline",
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={42} color="#94A3B8" />
        </View>
        <Text style={styles.title}>
          {title || t("articles.detail.notFound", "Article Not Found")}
        </Text>
        <Text style={styles.message}>
          {message ||
            t(
              "articles.detail.notFoundDesc",
              "The article you're looking for doesn't exist or has been moved."
            )}
        </Text>
        {showBackButton && (
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate(backTo)}
          >
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={styles.backText}>
              {backText || t("articles.detail.back", "Back to Articles")}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#F8FAFC" },
  card: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  message: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#10B981",
    borderRadius: 12,
    alignItems: "center",
  },
  backText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.85 },
});
