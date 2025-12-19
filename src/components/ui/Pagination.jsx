import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  onPageChange,
  hideOnSinglePage = true,
  showInfo = true,
}) {
  if (hideOnSinglePage && totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <View style={styles.container}>
      {showInfo && (
        <Text style={styles.info}>
          {totalItems > 0
            ? `Showing ${rangeStart} to ${rangeEnd} of ${totalItems} results`
            : "No results found"}
        </Text>
      )}

      <View style={styles.controls}>
        <PagerButton
          icon="chevron-back"
          label="Previous"
          disabled={currentPage <= 1}
          onPress={() => onPageChange(currentPage - 1)}
        />

        <View style={styles.pages}>
          {visiblePages.map((page, idx) =>
            page === "..." ? (
              <Text key={`dots-${idx}`} style={styles.dots}>
                ...
              </Text>
            ) : (
              <Pressable
                key={page}
                onPress={() => onPageChange(page)}
                style={({ pressed }) => [
                  styles.page,
                  page === currentPage && styles.pageActive,
                  pressed && styles.pagePressed,
                ]}
              >
                <Text
                  style={[
                    styles.pageText,
                    page === currentPage && styles.pageTextActive,
                  ]}
                >
                  {page}
                </Text>
              </Pressable>
            )
          )}
        </View>

        <PagerButton
          icon="chevron-forward"
          label="Next"
          disabled={currentPage >= totalPages}
          onPress={() => onPageChange(currentPage + 1)}
        />
      </View>
    </View>
  );
}

const PagerButton = ({ icon, label, disabled, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.pager,
      disabled && styles.disabled,
      pressed && !disabled && styles.pagePressed,
    ]}
  >
    <Ionicons name={icon} size={16} color="#0F172A" />
    <Text style={styles.pagerText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  info: { fontSize: 13, color: "#475569" },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pagerText: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  pages: { flexDirection: "row", alignItems: "center", gap: 6 },
  page: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  pageActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  pageText: { fontSize: 13, color: "#0F172A", fontWeight: "700" },
  pageTextActive: { color: "#fff" },
  dots: { color: "#94A3B8", fontSize: 13 },
  disabled: { opacity: 0.5 },
  pagePressed: { opacity: 0.8 },
});
