import React, { useCallback, useMemo, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, TouchableOpacity, Modal, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../theme/useTheme";
import { selectCurrentUser, signOutUser } from "../../features/auth/authSlice";
import i18n from "../../i18n";
import { useUserNotifications } from "../../hooks/useUserNotifications";
import { clearCart } from "../../features/cart/cartSlice";
import {
  clearFavorites,
  loadFavorites,
} from "../../features/favorites/favoritesSlice";

export default function Navbar({ currentRoute }) {
  const navigation = useNavigation();
  const routeName = currentRoute || "";
  const { t } = useTranslation();
  const { mode, colors, shadow, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const favorites = useSelector((state) => state.favorites?.items || []);
  const user = useSelector(selectCurrentUser);
  const isDelivery = user?.role === "delivery" || user?.isDelivery;
  const { unreadCount } = useUserNotifications(user?.uid);
  const [menuOpen, setMenuOpen] = useState(false);
  const [botVisible, setBotVisible] = useState(!(globalThis.__hideBot));
  const isRTL = i18n?.language?.startsWith("ar");

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("account.logout_title", "Sign out"),
      t("account.logout_confirm", "Are you sure you want to sign out?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("navbar.logout", "Logout"),
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(signOutUser());
              dispatch(clearCart());
              dispatch(clearFavorites());
              dispatch(loadFavorites());
            } catch (error) {
              Alert.alert(
                t("common.error", "Error"),
                t("auth.logout_failed", "Logout failed")
              );
            } finally {
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [dispatch, navigation, t]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item?.quantity || 1), 0),
    [cartItems]
  );
  const favoritesCount = (favorites || []).filter((f) => f.type !== "article").length;

  // Hide navbar on specific routes (after all hooks above have executed)
  const hiddenRoutes = ["Login", "Register", "Reset"];
  if (hiddenRoutes.includes(routeName)) return null;

  const titles = {
    Home: t("nav.home", "Home"),
    Shop: t("nav.products", "Products"),
    Articles: t("nav.articles", "Articles"),
    ArticleDetails: t("nav.articles", "Articles"),
    Account: t("navbar.account", "Account"),
    Cart: t("navbar.cart", "Cart"),
    Favorites: t("navbar.favorites", "Favorites"),
    Notifications: t("navbar.notifications", "Notifications"),
  };
  const title = titles[routeName] || t("brand.name", "V Shop");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.card, shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset },
        ]}
      >
        <Pressable
          style={styles.iconBtn}
          onPress={() => setMenuOpen((p) => !p)}
        >
          <Ionicons name="menu" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {!isDelivery && (
          <View style={styles.actions}>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.badgeText, { color: colors.surface }]}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Cart")}>
              <Ionicons name="cart-outline" size={20} color={colors.text} />
              {cartCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.badgeText, { color: colors.surface }]}>{cartCount > 9 ? "9+" : cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Favorites")}>
              <Ionicons name="heart-outline" size={20} color={colors.text} />
              {favoritesCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.badgeText, { color: colors.surface }]}>{favoritesCount > 9 ? "9+" : favoritesCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        )}
      </View>
      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />
        <View
          style={[
            styles.menuWrapper,
            isRTL ? styles.menuWrapperRTL : styles.menuWrapperLTR,
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.menuCard, isRTL && styles.menuCardRTL, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: shadow.color, shadowOpacity: shadow.opacity, shadowRadius: shadow.radius, shadowOffset: shadow.offset }]}>
            {(isDelivery
              ? [
                  { icon: "color-palette-outline", label: t("menu.theme", "Switch theme"), action: toggleTheme },
                  {
                    icon: "language-outline",
                    label: t("menu.language", "Switch language"),
                    action: () => {
                      const next = i18n.language === "ar" ? "en" : "ar";
                      i18n.changeLanguage(next).catch(() => {});
                    },
                  },
                  {
                    icon: botVisible ? "eye-off-outline" : "eye-outline",
                    label: botVisible ? t("menu.hideBot", "Hide AI Bot") : t("menu.showBot", "Show AI Bot"),
                    action: () => {
                      setBotVisible((v) => {
                        const next = !v;
                        globalThis.__hideBot = !next;
                        const listeners = globalThis.__botToggleListeners || [];
                        setTimeout(() => listeners.forEach((fn) => fn(!next)), 0);
                        return next;
                      });
                    },
                  },
                  { icon: "log-out-outline", label: t("navbar.logout", "Logout"), action: handleLogout },
                ]
              : [
                  { icon: "home-outline", label: t("navbar.home", "Home"), nav: () => navigation.navigate("MainTabs", { screen: "Home" }) },
                  ...(user
                    ? [{ icon: "cube-outline", label: t("navbar.orders", "My Orders"), screen: "OrdersList" }]
                    : []),
                  {
                    icon: "newspaper-outline",
                    label: t("navbar.favArticles", "Favorite Articles"),
                    nav: () => navigation.navigate("FavoriteArticles"),
                  },
                  { icon: "color-palette-outline", label: t("menu.theme", "Switch theme"), action: toggleTheme },
                  {
                    icon: "language-outline",
                    label: t("menu.language", "Switch language"),
                    action: () => {
                      const next = i18n.language === "ar" ? "en" : "ar";
                      i18n.changeLanguage(next).catch(() => {});
                    },
                  },
                  {
                    icon: botVisible ? "eye-off-outline" : "eye-outline",
                    label: botVisible ? t("menu.hideBot", "Hide AI Bot") : t("menu.showBot", "Show AI Bot"),
                    action: () => {
                      setBotVisible((v) => {
                        const next = !v;
                        globalThis.__hideBot = !next;
                        const listeners = globalThis.__botToggleListeners || [];
                        setTimeout(() => listeners.forEach((fn) => fn(!next)), 0);
                        return next;
                      });
                    },
                  },
                  { icon: "help-circle-outline", label: t("navbar.support", "Support"), screen: "Support", params: { initialSection: "feedback" } },
                  ...(user
                    ? [{ icon: "log-out-outline", label: t("navbar.logout", "Logout"), action: handleLogout }]
                    : [
                        { icon: "log-in-outline", label: t("auth.login", "Login"), screen: "Login" },
                        { icon: "person-add-outline", label: t("auth.register", "Create account"), screen: "Register" },
                      ]),
                ]).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  if (item.action) return item.action();
                  if (item.nav) return item.nav();
                  if (item.screen) navigation.navigate(item.screen, item.params);
                }}
              >
                <Ionicons name={item.icon} size={18} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { position: "relative", zIndex: 100 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 14,
    elevation: 3,
  },
  iconBtn: {
    height: 32,
    width: 32,
    borderRadius: 10,
    backgroundColor: "rgba(15,23,42,0.05)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginRight: 8,
  },
  title: { fontSize: 16, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  menuWrapper: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 60,
    justifyContent: "flex-start",
  },
  menuWrapperLTR: { alignItems: "flex-start", paddingLeft: 12 },
  menuWrapperRTL: { alignItems: "flex-start", paddingRight: 12 },
  menuCard: {
    width: "78%",
    borderRadius: 16,
    paddingVertical: 4,
    borderWidth: 1,
    elevation: 6,
    zIndex: 200,
  },
  menuCardRTL: { alignItems: "flex-start", writingDirection: "ltr" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    writingDirection: "ltr",
  },
  menuText: { fontSize: 14, fontWeight: "700" },
});
