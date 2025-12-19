import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/useTheme";

const BASE_STEPS = [
  { key: "pending", label: "tracking.steps.orderPlaced", estimatedDays: 0 },
  { key: "processing", label: "tracking.steps.processing", estimatedDays: 1 },
  { key: "shipped", label: "tracking.steps.shipped", estimatedDays: 3 },
  { key: "out_for_delivery", label: "tracking.steps.outForDelivery", estimatedDays: 5 },
  { key: "delivered", label: "tracking.steps.delivered", estimatedDays: 7 },
];

const normalizeStatusKey = (s = "") => {
  const key = s.toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "pending_payment" || key === "awaiting_payment") return "pending";
  if (key === "in_transit") return "out_for_delivery";
  return key;
};

export default function OrderTimeline({ order, isDark: propIsDark }) {
  const { t } = useTranslation();
  const { colors, spacing, radius, mode } = useTheme();
  const isDark = typeof propIsDark === "boolean" ? propIsDark : mode === "dark";

  const timelineSteps = useMemo(() => {
    const statusOrder = BASE_STEPS.map((step) => step.key);
    const latestHistoryStatus = order?.statusHistory?.[order.statusHistory.length - 1]?.status;
    const currentStatusKey = order
      ? normalizeStatusKey(order.status || latestHistoryStatus || "pending")
      : "pending";
    const lookupIndex = statusOrder.indexOf(currentStatusKey);
    const currentStatusIndex = lookupIndex === -1 ? 0 : lookupIndex;

    const statusTimestamps = {};
    if (order?.statusHistory) {
      order.statusHistory.forEach((history) => {
        statusTimestamps[normalizeStatusKey(history.status)] = history.changedAt;
      });
    }

    return BASE_STEPS.map((step, index) => {
      let state = "pending";
      if (index < currentStatusIndex) state = "done";
      if (index === currentStatusIndex) state = "current";

      let actualTimestamp = null;
      let estimatedTimestamp = null;

      const toDateSafe = (val) => {
        try {
          if (val?.toDate) return val.toDate();
          if (typeof val === "string") return new Date(val);
          return new Date(val || Date.now());
        } catch {
          return new Date();
        }
      };

      if (statusTimestamps[step.key]) {
        actualTimestamp = statusTimestamps[step.key];
      } else if (index > currentStatusIndex) {
        const orderCreated = toDateSafe(order?.createdAt);
        const estimatedDate = new Date(orderCreated);
        estimatedDate.setDate(orderCreated.getDate() + step.estimatedDays);
        estimatedTimestamp = estimatedDate.toISOString();
      }

      return {
        ...step,
        state,
        actualTimestamp,
        estimatedTimestamp,
        isEstimated: !actualTimestamp && index > currentStatusIndex,
      };
    });
  }, [order]);

  const formatDateTime = (step) => {
    if (step.actualTimestamp) {
      try {
        const val = step.actualTimestamp;
        const dt = val?.toDate ? val.toDate() : new Date(val);
        return dt.toLocaleString();
      } catch {
        return t("tracking.awaitingUpdate", "Awaiting update");
      }
    }
    if (step.estimatedTimestamp) {
      return `${t("tracking.estimatedPrefix", "Est.")} ${new Date(step.estimatedTimestamp).toLocaleDateString()}`;
    }
    return t("tracking.awaitingUpdate", "Awaiting update");
  };

  const indicatorStyle = (state) => {
    if (state === "current") return { borderColor: colors.primary, backgroundColor: colors.surfaceMuted };
    if (state === "done") return { borderColor: colors.primary, backgroundColor: colors.primary };
    return { borderColor: colors.border, backgroundColor: colors.surfaceMuted };
  };

  const mutedColor = colors.textMuted;
  const strongColor = colors.text;

  return (
    <View style={[styles.section, { gap: spacing.md }]}>
      <Text style={[styles.heading, { color: mutedColor }]}>{t("tracking.trackingStatus", "Tracking Status")}</Text>
      <View style={[styles.list, { marginTop: spacing.xs, gap: spacing.md + 4 }]}>
        {timelineSteps.map((step, index) => (
          <View key={step.key} style={[styles.item, { gap: spacing.md }]}>
            <View style={styles.timelineColumn}>
              <View style={[styles.indicatorBase, indicatorStyle(step.state), { borderRadius: radius.full }]}>
                <Text
                  style={[
                    styles.indicatorText,
                    { color: step.state === "done" ? colors.surface : colors.text },
                  ]}
                >
                  {step.state === "done" ? "✓" : step.isEstimated ? "~" : index + 1}
                </Text>
              </View>
              {index !== timelineSteps.length - 1 && (
                <View style={[styles.connector, { backgroundColor: colors.border }]} />
              )}
            </View>
            <View style={styles.content}>
              <Text style={[styles.label, { color: strongColor }]}>
                {t(step.label)}
                {step.isEstimated && (
                  <Text style={[styles.estimated, { color: mutedColor }]}>{`  ${t(
                    "tracking.estimated",
                    "Estimated"
                  )}`}</Text>
                )}
              </Text>
              <Text
                style={[
                  styles.dateText,
                  { color: step.actualTimestamp ? strongColor : mutedColor },
                ]}
              >
                {formatDateTime(step)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  heading: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  list: { marginTop: 6, gap: 16 },
  item: { flexDirection: "row", gap: 12 },
  timelineColumn: { alignItems: "center" },
  indicatorBase: {
    width: 40,
    height: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorText: { fontWeight: "700" },
  connector: { width: 2, flex: 1, marginTop: 4 },
  content: { flex: 1, paddingTop: 2 },
  label: { fontSize: 14, fontWeight: "700" },
  estimated: { fontSize: 11 },
  dateText: { fontSize: 13, marginTop: 2 },
});
