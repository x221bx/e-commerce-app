import React, { useEffect, useRef, useState } from "react";
import { Modal, SafeAreaView, View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";
import { parsePaymobRedirect } from "../../services/paymob";

export default function PaymobSheet({
  visible,
  paymentUrl,
  onClose,
  onResult,
  title,
  subtitle,
  helper,
  loadingText,
  missingText,
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const handled = useRef(false);

  useEffect(() => {
    if (visible) handled.current = false;
  }, [visible]);

  const handleClose = () => {
    handled.current = false;
    onClose?.();
  };

  const handleNavigation = (navState) => {
    const url = navState?.url || "";
    if (!url || (!url.includes("success=") && !url.includes("txn_response_code"))) return;
    const meta = parsePaymobRedirect(url);

    if (handled.current) return;
    if (["success", "failed", "pending"].includes(meta.status)) {
      handled.current = true;
      onResult?.(meta);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="close" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              {title || t("checkout.payment.paymobTitle", "Pay with card (Paymob)")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {subtitle || t("checkout.payment.paymobSubtitle", "Secure Visa/Mastercard via Paymob")}
            </Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <View
          style={[
            styles.webviewWrapper,
            {
              borderColor: colors.border,
              margin: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {paymentUrl ? (
            <>
              <WebView
                source={{ uri: paymentUrl }}
                onNavigationStateChange={handleNavigation}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                startInLoadingState
                style={{ borderRadius: radius.lg }}
              />
              {isLoading && (
                <View style={[styles.loadingOverlay, { backgroundColor: `${colors.background}CC` }]}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    {loadingText || t("checkout.payment.paymobLoading", "Opening secure payment...")}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.missing}>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                {missingText || t("checkout.payment.paymobMissing", "Payment link unavailable.")}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.helper,
            {
              color: colors.textMuted,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          {helper || t("checkout.payment.paymobHelper", "Powered by Paymob. We never store your card details.")}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 12 },
  webviewWrapper: {
    flex: 1,
    borderWidth: 1,
    overflow: "hidden",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { fontSize: 12, fontWeight: "700" },
  missing: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  helper: { fontSize: 12, textAlign: "center", marginBottom: 12 },
});
