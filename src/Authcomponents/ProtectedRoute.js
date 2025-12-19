// src/Authcomponents/ProtectedRoute.native.jsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import {
  selectCurrentUser,
  selectIsAuthInitialized,
} from "../features/auth/authSlice";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const user = useSelector(selectCurrentUser);
  const isInitialized = useSelector(selectIsAuthInitialized);
  const navigation = useNavigation();

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      navigation.replace("Login");
    } else if (requireAdmin && !user?.isAdmin) {
      navigation.replace("NotAuthorized");
    }
  }, [isInitialized, user, requireAdmin, navigation]);

  if (!isInitialized || !user || (requireAdmin && !user?.isAdmin)) {
    // While redirecting / initializing, show loader (or null)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1F2937" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
