import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { UseTheme } from "../../theme/ThemeProvider";

export default function Button({
  text = "Click Me",
  onPress = () => {},
  full = false,
  size = "md", // sm | md | lg
  disabled = false,
}) {
  const { theme } = UseTheme();
  const isDark = theme === "dark";

  const sizeStyle =
    size === "sm" ? styles.sm : size === "lg" ? styles.lg : styles.md;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        full && styles.full,
        isDark ? styles.dark : styles.light,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.text, isDark ? styles.textDark : styles.textLight]}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sm: { height: 32, paddingHorizontal: 12 },
  md: { height: 40, paddingHorizontal: 16 },
  lg: { height: 48, paddingHorizontal: 20 },
  full: { width: "100%" },
  light: { backgroundColor: "#2F7E80" },
  dark: { backgroundColor: "#B8E4E6" },
  text: { fontWeight: "700" },
  textLight: { color: "#fff" },
  textDark: { color: "#0e1b1b" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
