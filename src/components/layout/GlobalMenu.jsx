import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import i18n from "../../i18n";
import { useTheme } from "../../theme/useTheme";
import { selectCurrentUser, signOutUser } from "../../features/auth/authSlice";

export default function GlobalMenu() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors, shadow, toggleTheme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const navAndClose = (screen, params) => {
    setOpen(false);
    if (screen) navigation.navigate(screen, params);
  };

  const handleLanguageToggle = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next).catch(() => {});
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    Alert.alert(
      t("common.logout", "Logout"),
      t("auth.logout_confirm", "Are you sure you want to logout?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.logout", "Logout"),
          style: "destructive",
          onPress: () => dispatch(signOutUser()),
        },
      ]
    );
  };

  const openChatBot = () => {
    setOpen(false);
    if (globalThis.__hideBot) {
      globalThis.__hideBot = false;
      const listeners = globalThis.__botToggleListeners || [];
      listeners.forEach((listener) => listener(false));
    }
  };

  const allItems =
    user?.role === "delivery" || user?.isDelivery
      ? [
          { icon: "moon-outline", label: t("menu.theme", "Switch theme"), action: toggleTheme },
          {
            icon: "language-outline",
            label: i18n.language === "ar" ? "Switch to English" : "Switch language",
            action: handleLanguageToggle,
          },
          { icon: "chatbubbles-outline", label: t("menu.chatbot", "AI Assistant"), action: openChatBot },
          { icon: "log-out-outline", label: t("menu.logout", "Logout"), action: handleLogout },
        ]
      : [
          { icon: "moon-outline", label: t("menu.theme", "Switch theme"), action: toggleTheme },
          {
            icon: "language-outline",
            label: i18n.language === "ar" ? "Switch to English" : "Switch language",
            action: handleLanguageToggle,
          },
          { icon: "heart-outline", label: t("menu.favorites", "Favorites"), action: () => navAndClose("Favorites") },
          { icon: "book-outline", label: t("menu.articles", "Articles"), action: () => navAndClose("Articles") },
          { icon: "notifications-outline", label: t("menu.notifications", "Notifications"), action: () => navAndClose("Notifications") },
          ...(user ? [{ icon: "cart-outline", label: t("menu.cart", "Cart"), action: () => navAndClose("Cart") }] : []),
          { icon: "cube-outline", label: t("menu.orders", "Orders"), action: () => navAndClose("OrdersList") },
          { icon: "grid-outline", label: t("menu.products", "Products"), action: () => navAndClose("Shop") },
          { icon: "chatbubbles-outline", label: t("menu.chatbot", "AI Assistant"), action: openChatBot },
          {
            icon: "help-circle-outline",
            label: t("menu.support", "Support"),
            action: () => navAndClose("Support", { initialSection: "feedback" }),
          },
          {
            icon: "chatbubbles-outline",
            label: t("menu.inquiries", "Inquiries"),
            action: () => navAndClose("Support", { initialSection: "inquiries" }),
          },
          { icon: "log-out-outline", label: t("menu.logout", "Logout"), action: handleLogout },
        ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen((p) => !p)}
        style={[
          styles.fab,
          { backgroundColor: colors.primary },
          Platform.select({
            ios: { shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset },
            android: { elevation: 8 },
          }),
        ]}
      >
        <Ionicons name="menu-outline" size={22} color={colors.surface} />
      </TouchableOpacity>

      {open && (
        <>
          <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)} />
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                shadowColor: shadow.color,
                shadowOpacity: shadow.opacity,
                shadowRadius: shadow.radius,
                shadowOffset: shadow.offset,
                borderColor: colors.border,
              },
            ]}
          >
            {allItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.menuItem, { writingDirection: "ltr", flexDirection: "row" }]}
                onPress={() => item.action?.()}
              >
                <Ionicons name={item.icon} size={20} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    top: 18,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menu: {
    position: "absolute",
    top: 70,
    left: 16,
    borderRadius: 14,
    paddingVertical: 10,
    width: 240,
    zIndex: 20,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: { fontSize: 14, fontWeight: "700" },
});
