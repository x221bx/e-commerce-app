import React, { useEffect, useRef, useState } from "react";
import { Modal, SafeAreaView, View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";
import { parsePaypalRedirect } from "../../services/paypal";

export default function PayPalSheet({ visible, approvalUrl, onClose, onResult, paypalOrderId }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const handled = useRef(false);

  useEffect(() => {
    if (visible) handled.current = false;
  }, [visible]);

  const handleNavigation = (navState) => {
    const url = navState?.url || "";
    const meta = parsePaypalRedirect(url);

    if (!meta.status || meta.status === "pending") return;
    if (handled.current) return;
    handled.current = true;
    onResult?.({ ...meta, paypalOrderId: paypalOrderId || meta.token });
  };

  const handleClose = () => {
    handled.current = false;
    onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
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
            <Text style={[styles.title, { color: colors.text }]}>{t("checkout.payment.paypalTitle", "Pay with PayPal")}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t("checkout.payment.paypalSubtitle", "Use your PayPal balance or saved cards")}
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
          {approvalUrl ? (
            <>
              <WebView
                source={{ uri: approvalUrl }}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onNavigationStateChange={handleNavigation}
                startInLoadingState
                style={{ borderRadius: radius.lg }}
              />
              {isLoading && (
                <View style={[styles.loadingOverlay, { backgroundColor: `${colors.background}CC` }]}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    {t("checkout.payment.paypalLoading", "Loading PayPal...")}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.missing}>
              <Text style={[styles.subtitle, { color: colors.text }]}>
                {t("checkout.payment.paypalMissing", "PayPal link unavailable.")}
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
          {t("checkout.payment.paypalHelper", "You will be redirected back once PayPal approves or cancels.")}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 12 },
  webviewWrapper: { flex: 1, borderWidth: 1, overflow: "hidden" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { fontSize: 12, fontWeight: "700" },
  missing: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  helper: { fontSize: 12, textAlign: "center", marginBottom: 12 },
});
