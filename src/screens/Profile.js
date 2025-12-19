// -------------------------------------------------------------
// Profile.js
// -------------------------------------------------------------
// Account Home Screen
//
// DESCRIPTION:
// - Displays logged in user info (avatar, name, email)
// - Renders main account navigation cards (Profile, Payments, Orders, Tracking, Favorites, Support, Inquiries)
// - Includes logout action with Redux + Firebase signOut
// - RTL aware layout
// - Uses theme colors + dynamic UI
//
// NOTE:
// - NO logic, UI, or functional behavior has been changed.
// - Only formatting, comments, organizing code blocks, and readability improvements.
// -------------------------------------------------------------

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

// Redux
import {
  refreshCurrentUser,
  signOutUser,
  selectCurrentUser,
} from "../features/auth/authSlice";
import { clearCart } from "../features/cart/cartSlice";
import {
  clearFavorites,
  loadFavorites,
} from "../features/favorites/favoritesSlice";

// Theme
import { useTheme } from "../theme/useTheme";


// -------------------------------------------------------------
// Component
// -------------------------------------------------------------
export default function Profile() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const user = useSelector(selectCurrentUser);
  const { mode, colors, shadow } = useTheme();
  const { t, i18n } = useTranslation();
  const isDelivery = user?.role === "delivery" || user?.isDelivery;

  const isRTL =
    (i18n?.dir?.() || "ltr") === "rtl" || i18n?.language?.startsWith("ar");

  // -----------------------------
  // User info display
  // -----------------------------
  const displayName =
    user?.name ||
    user?.displayName ||
    user?.username ||
    t("account.guest_name", "Guest");

  const displayEmail =
    user?.email ||
    user?.contactEmail ||
    t("account.guest_email", "guest");

  const avatarUrl =
    user?.photoURL ||
    user?.avatar ||
    user?.image ||
    user?.photo ||
    user?.profilePicture ||
    null;

  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        dispatch(refreshCurrentUser());
      }
    }, [user?.uid, dispatch])
  );

  // -----------------------------
  // Account Navigation Sections
  // -----------------------------
  const sections = isDelivery
    ? []
    : [
        {
          icon: "person-circle-outline",
          title: t("account.profile_preferences", "Profile & Preferences"),
          subtitle: t(
            "account.profile_description",
            "Name, language, and security"
          ),
          action: () => navigation.navigate("ProfilePreferences"),
        },
        {
          icon: "receipt-outline",
          title: t("account.order_history", "My orders"),
          subtitle: t("account.order_description", "Invoices and receipts"),
          action: () => navigation.navigate("OrdersList"),
        },
        {
          icon: "map-outline",
          title: t("account.order_tracking", "Order Tracking"),
          subtitle: t("account.tracking_description", "Live delivery status"),
          action: () => navigation.navigate("Orders"),
        },
        {
          icon: "heart-outline",
          title: t("account.favorite_articles", "Favorite Articles"),
          subtitle: t(
            "account.articles_description",
            "Guides and resources"
          ),
          action: () => navigation.navigate("FavoriteArticles"),
        },
        {
          icon: "help-circle-outline",
          title: t("account.feedback_support", "Feedback & Support"),
          subtitle: t(
            "account.support_description",
            "Share your opinion or get help"
          ),
          action: () =>
            navigation.navigate("Support", { initialSection: "feedback" }),
        },
        {
          icon: "chatbubbles-outline",
          title: t("account.complaints_title", "My Inquiries"),
          subtitle: t(
            "account.complaints_description",
            "Submit and track your inquiries"
          ),
          action: () => navigation.navigate("MyInquiries"),
        },
      ];


  // -------------------------------------------------------------
  // Logout Handler
  // -------------------------------------------------------------
  const handleLogout = () => {
    Alert.alert(
      t("account.logout_title", "Sign out"),
      t("account.logout_confirm", "Are you sure you want to sign out?"),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },

        {
          text: t("account.logout", "Log out"),
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(signOutUser());
              dispatch(clearCart());
              dispatch(clearFavorites());
              dispatch(loadFavorites());

              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              Alert.alert(
                t("common.error", "Error"),
                t("auth.logout_failed", "Logout failed")
              );
            }
          },
        },
      ]
    );
  };


  // -------------------------------------------------------------
  // Render UI
  // -------------------------------------------------------------
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* ------------------- Header ------------------- */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={[styles.headerInfo, isRTL && styles.headerInfoRTL]}>
          <View
            style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Ionicons
                name="person-outline"
                size={28}
                color={colors.primary}
              />
            )}
          </View>

          <View style={[styles.headerText, isRTL && styles.headerTextRTL]}>
            <Text
              style={[
                styles.name,
                { color: colors.text },
                isRTL && styles.textRTL,
              ]}
            >
              {displayName}
            </Text>

            <Text
              style={[
                styles.email,
                { color: colors.textMuted },
                isRTL && styles.textRTL,
              ]}
            >
              {displayEmail}
            </Text>

            {user?.phone ? (
              <Text
                style={[
                  styles.infoText,
                  { color: colors.textMuted },
                  isRTL && styles.textRTL,
                ]}
              >
                {user.phone}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* ------------------- Sections List ------------------- */}
      <View style={styles.sectionList}>
        {sections.map((section, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={section.action}
            style={[
              styles.sectionCard,
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
            <View
              style={[
                styles.sectionIconWrap,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons
                name={section.icon}
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {section.title}
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textMuted },
                ]}
              >
                {section.subtitle}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* ------------------- Logout Button ------------------- */}
      {user ? (
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: colors.danger },
          ]}
          onPress={handleLogout}
        >
          <Text
            style={[styles.logoutText, { color: colors.surface }]}
          >
            {t("account.logout", "Log out")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}


// -------------------------------------------------------------
// Styles
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerRTL: { justifyContent: "flex-end" },

  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerInfoRTL: { flexDirection: "row-reverse" },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },

  headerText: { gap: 4 },
  headerTextRTL: { alignItems: "flex-end" },

  name: { fontSize: 18, fontWeight: "800" },
  email: { fontSize: 13 },
  infoText: { fontSize: 12 },

  textRTL: { textAlign: "right" },

  sectionList: {
    gap: 14,
    paddingVertical: 8,
  },

  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
    minHeight: 72,
    elevation: 2,
    borderWidth: 1,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: { fontSize: 14, fontWeight: "800" },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },

  logoutBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  logoutText: { fontSize: 15, fontWeight: "800" },
});
