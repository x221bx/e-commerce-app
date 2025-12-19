// src/theme/ThemeProvider.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tokens } from "./tokens";

const ThemeContext = createContext();

export const UseTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "theme"; // values: "light" | "dark" | "system"

const resolveMode = (pref) => {
  if (pref === "light" || pref === "dark") return pref;
  const sys = Appearance.getColorScheme();
  return sys === "dark" ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreference] = useState("light"); // user choice
  const [mode, setMode] = useState("light"); // effective mode

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const pref = saved || "light";
      setPreference(pref);
      setMode(resolveMode(pref));
    };

    load();

    const sub = Appearance.addChangeListener(() => {
      setMode(resolveMode(preference === "system" ? "system" : preference));
    });
    return () => sub?.remove();
  }, []);

  // When preference changes, recompute mode
  useEffect(() => {
    setMode(resolveMode(preference));
    AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => {});
  }, [preference]);

  const toggleTheme = () => {
    setPreference((p) => {
      if (p === "light") return "dark";
      if (p === "dark") return "system";
      return "light";
    });
  };

  const value = useMemo(() => {
    const palette = mode === "dark" ? tokens.colors.dark : tokens.colors.light;
    return {
      mode,
      preference,
      colors: palette,
      radius: tokens.radius,
      spacing: tokens.spacing,
      shadow: mode === "dark" ? tokens.shadow.dark : tokens.shadow.light,
      typography: tokens.typography,
      toggleTheme,
      setPreference,
    };
  }, [mode, preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
