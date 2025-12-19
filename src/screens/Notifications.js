import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { useUserNotifications } from "../hooks/useUserNotifications";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useTheme } from "../theme/useTheme";

const screenByType = {
  complaint: "MyInquiries",
  support: "Support",
  order: "Orders",
};

const targetRouteMap = {
  "account/tracking": { screen: "Orders", paramKey: "orderId" },
  "account/support": { screen: "Support" },
  "account/inquiries": { screen: "MyInquiries" },
  cart: { screen: "Cart" },
  favorites: { screen: "Favorites" },
};

const formatDetails = (item, t) => {
  const parts = [];
  if (item.ticketId) {
    parts.push(
      t("notifications.ticketId", "Ticket ID: {{ticketId}}", {
        ticketId: item.ticketId,
      })
    );
  }
  if (item.complaintId) {
    parts.push(
      t("notifications.complaintId", "Complaint: {{complaintId}}", {
        complaintId: item.complaintId,
      })
    );
  }
  if (item.referenceId) {
    parts.push(
      t("notifications.referenceId", "Reference: {{referenceId}}", {
        referenceId: item.referenceId,
      })
    );
  }
  if (item.relatedOrder) {
    parts.push(
      t("notifications.orderId", "Order: {{orderId}}", {
        orderId: item.relatedOrder,
      })
    );
  }
  if (item.detail) parts.push(item.detail);
  return parts.join(" | ");
};

const resolveNotificationRoute = (item) => {
  if (!item) return null;

  if (item.screen) {
    return { screen: item.screen, params: item.params };
  }

  const complaintCandidate =
    item.complaintId || item.meta?.complaintId || item.meta?.ticketId || item.ticketId;
  if (complaintCandidate) {
    return {
      screen: "MyInquiries",
      params: { complaintId: complaintCandidate },
    };
  }

  if (item.target) {
    const normalized = item.target.replace(/^\//, "");
    const entry = targetRouteMap[normalized];
    if (entry) {
      const params = entry.paramKey
        ? { [entry.paramKey]: item.meta?.[entry.paramKey] || item.meta?.orderId }
        : undefined;
      return { screen: entry.screen, params };
    }
  }

  if (item.type) {
    const screen = screenByType[item.type];
    if (screen) return { screen, params: item.params };
  }

  return { screen: "Home" };
};

export default function Notifications() {
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  const { notifications, loading, markAllRead, markRead } = useUserNotifications(user?.uid);
  const { colors, spacing, radius } = useTheme();

  const handleNotificationPress = useCallback(
    (item) => {
      if (!item) return;
      markRead(item.id);
      const screenInfo = resolveNotificationRoute(item);
      if (screenInfo?.screen) {
        navigation.navigate(screenInfo.screen, screenInfo.params);
      }
    },
    [markRead, navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.lg }]}>
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("notifications.title", "Notifications")}</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity
            style={[styles.readAll, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}
            onPress={markAllRead}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.readAllText, { color: colors.primary }]}>
                {t("notifications.readAll", "Mark all as read")}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}
        renderItem={({ item }) => {
          const details = formatDetails(item, t);
          const timestampLabel = item.timestamp ? new Date(item.timestamp).toLocaleString?.() || "" : "";

          return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => handleNotificationPress(item)}>
              <View
                style={[
                  styles.card,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    borderRadius: radius.md,
                  },
                  item.read && styles.cardRead,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.heading, { color: colors.text }]}>
                    {item.title || t("notifications.item", "Notification")}
                  </Text>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      if (!item.read) markRead(item.id);
                    }}
                    disabled={item.read}
                    style={({ pressed }) => [
                      styles.markBtn,
                      {
                        borderColor: colors.primary,
                        backgroundColor: item.read ? colors.surfaceMuted : colors.primary,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.markText,
                        { color: item.read ? colors.textMuted : colors.surface },
                      ]}
                    >
                      {item.read ? t("notifications.read", "Read") : t("notifications.markRead", "Mark as read")}
                    </Text>
                  </Pressable>
                </View>
                <Text style={[styles.body, { color: colors.textMuted }]}>{item.body || item.message}</Text>
                {details ? <Text style={[styles.detail, { color: colors.textMuted }]}>{details}</Text> : null}
                {timestampLabel ? (
                  <Text style={[styles.timestamp, { color: colors.textMuted }]}>{timestampLabel}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyWrap, { marginTop: spacing.lg }]}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                {t("notifications.empty", "No notifications yet.")}
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800" },
  readAll: { paddingHorizontal: 12, paddingVertical: 6 },
  readAllText: { fontWeight: "700", fontSize: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardRead: { opacity: 0.7 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  markBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  markText: { fontSize: 12, fontWeight: "700" },
  detail: { fontSize: 12, marginTop: 6 },
  timestamp: { fontSize: 11, marginTop: 4 },
  heading: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 13, marginTop: 4 },
  emptyWrap: { alignItems: "center", marginTop: 20 },
  empty: { textAlign: "center" },
});
