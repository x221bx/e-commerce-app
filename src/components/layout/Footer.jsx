// Footer.jsx
//footer fixs
/**
 * Footer Component (React Native)
 * ---------------------------------------------------------------
 * This component replaces the web footer for the mobile app.
 *
 * FEATURES:
 * - Displays brand name, description, quick links and social links.
 * - Supports dark/light themes via UseTheme provider.
 * - Uses React Navigation for internal links.
 * - Uses Linking API for external social platforms.
 *
 * NOTE:
 * - No logic has been changed — only formatting, structure
 *   improvement, documentation, and small UI adjustments
 *   (brand size + spacing) to avoid layout overlap.
 * ---------------------------------------------------------------
 */// housekeeping: minor formatting update for maintainability

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { UseTheme } from "../../theme/ThemeProvider";
import { useTranslation } from "react-i18next";



export default function Footer() {
  const { theme } = UseTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const isDark = theme === "dark";
  const background = isDark ? styles.darkBg : styles.lightBg;



  // -------------------------------------------------------------
  // Quick Navigation Links
  // -------------------------------------------------------------
  const quickLinks = [
    { label: t("footer.home", "Home"), screen: "Home" },
    { label: t("footer.products", "Products"), screen: "Shop" },
    { label: t("footer.orders", "Orders"), screen: "OrdersList" },
    { label: t("footer.support", "Support"), screen: "Support" },
  ];

  // Social Media Links
  const socialLinks = [
    { icon: "globe-outline", url: "https://example.com" },
    { icon: "logo-facebook", url: "https://facebook.com" },
    { icon: "logo-instagram", url: "https://instagram.com" },
    { icon: "logo-twitter", url: "https://twitter.com" },
  ];

  const openUrl = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.warn("Failed to open link", e);
    }
  };



  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <View style={[styles.container, background]}>
      <View style={styles.columns}>

        {/* BRAND SECTION */}
        <View style={styles.column}>
          <View style={styles.brandRow}>
            <Ionicons name="leaf-outline" size={18} color="#34D399" />
            <Text
              style={[
                styles.brandText,
                isDark && styles.textLight,
              ]}
            >
              {t("footer.brandName", "V Shop")}
            </Text>
          </View>

          <Text
            style={[
              styles.description,
              isDark ? styles.textMutedLight : styles.textMutedDark,
            ]}
          >
            {t(
              "footer.brandDescription",
              "Premium nutrition, tools and care for livestock, crops and pets."
            )}
          </Text>
        </View>

        {/* QUICK LINKS */}
        <View style={styles.column}>
          <Text
            style={[
              styles.heading,
              isDark && styles.textLight,
            ]}
          >
            {t("footer.quickLinks", "Quick Links")}
          </Text>

          {quickLinks.map((link) => (
            <Pressable
              key={link.screen}
              onPress={() => navigation.navigate(link.screen)}
              style={({ pressed }) => [
                styles.linkRow,
                pressed && styles.linkRowPressed,
              ]}
            >
              <Text
                style={[
                  styles.linkText,
                  isDark && styles.textLight,
                ]}
              >
                {link.label}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={14}
                color={isDark ? "#B8E4E6" : "#0F172A"}
              />
            </Pressable>
          ))}
        </View>

        {/* SOCIAL LINKS */}
        <View style={styles.column}>
          <Text
            style={[
              styles.heading,
              isDark && styles.textLight,
            ]}
          >
            {t("footer.followUs", "Follow Us")}
          </Text>

          <View style={styles.socialRow}>
            {socialLinks.map((item) => (
              <Pressable
                key={item.icon}
                onPress={() => openUrl(item.url)}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialButtonPressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isDark ? "#B8E4E6" : "#0F172A"}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* COPYRIGHT SECTION */}
      <View
        style={[
          styles.copy,
          isDark ? styles.borderDark : styles.borderLight,
        ]}
      >
        <Text
          style={[
            styles.copyText,
            isDark ? styles.textMutedLight : styles.textMutedDark,
          ]}
        >
          {t("footer.copyright", {
            year: new Date().getFullYear(),
            defaultValue: `© ${new Date().getFullYear()} V Shop. All rights reserved.`,
          })}
        </Text>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 8,
  },

  lightBg: {
    backgroundColor: "#0E3B2F",
  },

  darkBg: {
    backgroundColor: "#0A2A22",
  },
  // style audit: no behavioral changes

  columns: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 22,
  },

  column: {
    flex: 1,
    gap: 10,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#E8F4F2",
  },

  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#CDE7E2",
  },

  heading: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#E8F4F2",
  },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  linkRowPressed: {
    opacity: 0.7,
  },

  linkText: {
    fontSize: 14,
    color: "#D6E6E3",
  },

  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  socialButton: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  socialButtonPressed: {
    transform: [{ scale: 0.96 }],
  },

  copy: {
    marginTop: 18,
    paddingTop: 12,
  },

  copyText: {
    textAlign: "center",
    fontSize: 13,
    color: "#CDE7E2",
  },

  borderLight: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },

  borderDark: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },

  textLight: {
    color: "#E8F4F2",
  },

  textMutedLight: {
    color: "#C0DAD7",
  },

  textMutedDark: {
    color: "rgba(255,255,255,0.78)",
  },
});
