// src/homeCom/CategoryGrid.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { fetchCategories } from "../services/homeData";

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#ff4500"
        style={{ marginVertical: 30 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.card,
            { backgroundColor: cat.color + "25", borderColor: cat.color },
          ]}
        >
          <Text style={styles.icon}>{cat.icon}</Text>
          <Text style={styles.name}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  card: {
    width: "30%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1.5,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: "700", textAlign: "center", color: "#333" },
});
