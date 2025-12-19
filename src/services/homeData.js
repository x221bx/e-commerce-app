// src/services/homeData.js
import { db } from "./firebase";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";

const mapProduct = (docSnap) => {
  const data = docSnap.data() || {};
  const stock = Number(data.stock ?? data.quantity ?? 0);
  const isAvailable = stock > 0 && (data.isAvailable ?? true);
  return { id: docSnap.id, ...data, stock, isAvailable };
};

const isHomeApproved = (product) =>
  Boolean(product.showOnHome ?? product.featureHome ?? product.isFeatured);

const filterAvailable = (products) => products.filter((p) => p.isAvailable && p.stock > 0);

// Hero banners shown on home
export const fetchHeroBanners = async () => {
  try {
    const q = query(collection(db, "home_banners"), orderBy("order"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching hero banners:", error);
    return [];
  }
};

// Flash sale countdown
export const fetchFlashSale = async () => {
  try {
    const settingsRef = doc(db, "settings", "general");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data?.flashSaleEndTime?.toDate() || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching flash sale time:", error);
    return null;
  }
};

// Categories list
export const fetchCategories = async () => {
  try {
    const snapshot = await getDocs(collection(db, "categories"));
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Featured products with fallback to latest
export const fetchFeaturedProducts = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "products"), orderBy("createdAt", "desc"), limit(50))
    );

    const homeApproved = filterAvailable(snapshot.docs.map(mapProduct).filter((p) => isHomeApproved(p)));

    return homeApproved.slice(0, 12);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
};

// Trending products ordered by sales, fallback to latest
export const fetchTrendingProducts = async () => {
  try {
    const trendingQuery = query(collection(db, "products"), orderBy("sales", "desc"), limit(12));

    let snapshot = await getDocs(trendingQuery);

    if (snapshot.empty) {
      const fallbackQuery = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12));
      snapshot = await getDocs(fallbackQuery);
    }

    return filterAvailable(snapshot.docs.map(mapProduct));
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
};

// Exclusive deals
export const fetchExclusiveDeals = async () => {
  try {
    const q = query(collection(db, "exclusive_deals"), orderBy("order"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching exclusive deals:", error);
    return [];
  }
};

// Brands list
export const fetchBrands = async () => {
  try {
    const q = query(collection(db, "brands"), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

// Generic products fetch (used by product listing)
export const getProducts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map(mapProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};
