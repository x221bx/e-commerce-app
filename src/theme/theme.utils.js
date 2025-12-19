import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getInitialTheme = async () => {
  try {
    const storedTheme = await AsyncStorage.getItem("theme");
    if (storedTheme) return storedTheme;
  } catch (e) {
    // ignore
  }
  const system = Appearance.getColorScheme();
  return system || "light";
};
