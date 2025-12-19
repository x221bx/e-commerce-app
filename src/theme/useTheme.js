// src/theme/useTheme.js
import { UseTheme } from "./ThemeProvider";

export const useTheme = () => {
  const ctx = UseTheme?.();
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
