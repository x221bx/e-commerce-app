import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function Spinner({ size = 24, color = "#3B82F6" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
});
