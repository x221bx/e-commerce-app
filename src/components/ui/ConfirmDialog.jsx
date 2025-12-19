import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancel,
                pressed && styles.pressed,
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirm,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onConfirm?.();
                onClose?.();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 8,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#0F172A" },
  message: { fontSize: 14, color: "#475569", marginBottom: 16 },
  actions: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancel: { backgroundColor: "#E2E8F0" },
  confirm: { backgroundColor: "#DC2626" },
  cancelText: { color: "#0F172A", fontWeight: "700" },
  confirmText: { color: "#fff", fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
