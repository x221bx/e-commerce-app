import React from "react";
import { Modal as RNModal, View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../../theme/useTheme";

export default function Modal({ isOpen, onClose, title, children, footer = true }) {
  const { colors, radius, shadow } = useTheme();
  if (!isOpen) return null;

  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderRadius: radius.lg + 10,
              shadowColor: shadow.color,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              shadowOffset: shadow.offset,
            },
          ]}
        >
          {(title || onClose) && (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{title || "Modal"}</Text>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.closeText, { color: colors.text }]}>&times;</Text>
              </Pressable>
            </View>
          )}
          <View style={[styles.body, { backgroundColor: colors.card }]}>{children}</View>
          {footer !== false && (
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              {footer === true ? (
                <Pressable
                  onPress={onClose}
                  style={[styles.defaultAction, { backgroundColor: colors.primary, borderRadius: radius.md }]}
                >
                  <Text style={[styles.defaultActionText, { color: colors.surface }]}>Close</Text>
                </Pressable>
              ) : (
                footer
              )}
            </View>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "700" },
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 18 },
  body: { paddingHorizontal: 16, paddingVertical: 14 },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  defaultAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  defaultActionText: { fontWeight: "700" },
});
