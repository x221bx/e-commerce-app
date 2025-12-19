import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useUserNotifications } from "../hooks/useUserNotifications";
import { useNavigation } from "@react-navigation/native";

export default function InAppNotifier() {
  const user = useSelector(selectCurrentUser);
  const { notifications } = useUserNotifications(user?.uid);
  const nav = useNavigation();

  const lastIdRef = useRef(null);
  const [toast, setToast] = useState({ visible: false, message: "", id: null });
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const newest = notifications[0];
    if (!newest) return;

    // show toast only for new unread notifications
    if (newest.id !== lastIdRef.current && !newest.read) {
      lastIdRef.current = newest.id;
      setToast({ visible: true, message: newest.message || newest.title || "", id: newest.id });
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      const t = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast({ visible: false, message: "", id: null }));
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [notifications, anim]);

  if (!toast.visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 10] }) }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.toast}
        onPress={() => {
          // navigate to notifications list
          nav.navigate("Notifications");
          setToast({ visible: false, message: "", id: null });
        }}
      >
        <Text style={styles.title}>{toast.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    minWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { fontSize: 14, fontWeight: "700" },
});
