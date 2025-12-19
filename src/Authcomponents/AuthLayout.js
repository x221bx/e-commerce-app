// src/Authcomponents/AuthLayout.native.jsx
import React from "react";
import {
  ImageBackground,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=90&w=1920",
      }}
      style={styles.bg}
      blurRadius={2}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>

            <View style={styles.formWrap}>{children}</View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: "100%", height: "100%" },
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 700,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  header: { marginBottom: 18, alignItems: "center" },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
  },
  formWrap: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
});
