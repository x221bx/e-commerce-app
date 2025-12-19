import { useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useThemeSetup(theme, setTheme) {
  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("theme");
      if (stored) {
        setTheme?.(stored);
      } else {
        const system = Appearance.getColorScheme();
        if (system && setTheme) setTheme(system);
      }
    };
    load();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme && setTheme) setTheme(colorScheme);
    });

    return () => sub.remove();
  }, [setTheme]);

  useEffect(() => {
    if (!theme) return;
    AsyncStorage.setItem("theme", theme).catch(() => {});
  }, [theme]);
}
