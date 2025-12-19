import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function LoadingSpinner({ size = "large", text = "Loading..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#10B981" />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: 12 },
  text: { marginTop: 6, fontSize: 13, color: "#475569" },
});
