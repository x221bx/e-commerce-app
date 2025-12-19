// src/homeCom/HeroBanner.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import Swiper from "react-native-swiper";
import { fetchHeroBanners } from "../services/homeData";

const { width } = Dimensions.get("window");

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroBanners()
      .then(setBanners)
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#ff4500"
        style={{ height: 220, margin: 16 }}
      />
    );
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <Swiper
        autoplay
        autoplayTimeout={5}
        height={220}
        showsPagination={true}
        dotColor="#ccc"
        activeDotColor="#ff4500"
      >
        {banners.map((banner) => (
          <ImageBackground
            key={banner.id}
            source={{ uri: banner.imageUrl }}
            style={styles.slide}
            imageStyle={{ borderRadius: 16 }}

          >
            <View style={styles.overlay}>
              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.subtitle}>{banner.subtitle}</Text>
            </View>
          </ImageBackground>
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 220, marginHorizontal: 16, marginTop: 12 },
  slide: { flex: 1, justifyContent: "flex-end" },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 20,
    borderRadius: 16,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: { color: "#fff", fontSize: 16, marginTop: 6 },
});
