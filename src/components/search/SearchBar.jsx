import React, { useMemo, useState } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { UseTheme } from "../../theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import { getLocalizedName } from "../../utils/productLocalization";

/**
 * Mobile-first search bar with inline results list.
 * Replaces DOM/Tailwind + react-router with RN components + React Navigation.
 */
export default function SearchBar({
  products: propProducts = [],
  placeholder = "Search products...",
  onSearch,
}) {
  const navigation = useNavigation();
  const { theme } = UseTheme();
  const { i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const products = propProducts;
  const results = useMemo(() => {
    if (!query.trim() || products.length === 0) return [];
    const normalized = query.toLowerCase();
    return products
      .filter((item) =>
        getLocalizedName(item, i18n.language).toLowerCase().includes(normalized)
      )
      .slice(0, 6);
  }, [products, query, i18n.language]);

  const handleSubmit = () => {
    const value = query.trim();
    if (!value) return;
    onSearch?.(value);
    navigation.navigate("Shop", { search: value });
    setFocused(false);
  };

  const handleSelect = (item) => {
    const name = getLocalizedName(item, i18n.language);
    setQuery(name);
    onSearch?.(name);
    navigation.navigate("Shop", { search: name });
    setFocused(false);
  };

  const isDark = theme === "dark";

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputContainer,
          isDark ? styles.inputContainerDark : styles.inputContainerLight,
          focused && styles.inputContainerFocused,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={isDark ? "#B8E4E6" : "#0F172A"}
          style={styles.icon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#B8E4E6AA" : "#475569"}
          style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {focused && (
        <View
          style={[
            styles.dropdown,
            isDark ? styles.dropdownDark : styles.dropdownLight,
          ]}
        >
          {results.length > 0 ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.map((item) => (
                <Pressable
                  key={item.id || item.name}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.resultItem,
                    pressed && styles.resultItemPressed,
                  ]}
                >
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={isDark ? "#B8E4E6" : "#0F172A"}
                  />
                  <Text
                    style={[
                      styles.resultText,
                      isDark ? styles.resultTextDark : styles.resultTextLight,
                    ]}
                    numberOfLines={1}
                  >
                    {getLocalizedName(item, i18n.language) || "Unnamed"}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : query.trim() ? (
            <View style={styles.emptyState}>
              <Text
                style={[
                  styles.emptyText,
                  isDark ? styles.resultTextDark : styles.resultTextLight,
                ]}
              >
                No results found
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    borderWidth: 1,
  },
  inputContainerDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(184,228,230,0.25)",
  },
  inputContainerLight: {
    backgroundColor: "rgba(15,23,42,0.04)",
    borderColor: "rgba(15,23,42,0.08)",
  },
  inputContainerFocused: {
    borderColor: "#10B981",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  inputDark: {
    color: "#F8FAFC",
  },
  inputLight: {
    color: "#0F172A",
  },
  clearButton: {
    padding: 4,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 50,
    borderRadius: 12,
    maxHeight: 220,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 20,
  },
  dropdownDark: {
    backgroundColor: "#0f172a",
    borderColor: "rgba(184,228,230,0.25)",
  },
  dropdownLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(15,23,42,0.08)",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  resultItemPressed: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  resultText: {
    fontSize: 14,
    flex: 1,
  },
  resultTextDark: {
    color: "#E2E8F0",
  },
  resultTextLight: {
    color: "#0F172A",
  },
  emptyState: {
    padding: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
