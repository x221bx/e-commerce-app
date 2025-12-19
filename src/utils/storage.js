import AsyncStorage from "@react-native-async-storage/async-storage";

export const getJSON = async (key, fallback = null) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("storage getJSON error", e);
    return fallback;
  }
};

export const setJSON = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("storage setJSON error", e);
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn("storage remove error", e);
  }
};
