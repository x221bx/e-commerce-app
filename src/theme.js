// src/theme.js
import { Dimensions, PixelRatio } from "react-native";

const { width, height } = Dimensions.get("window");

// base unit (8pt grid)
export const SPACING = 8;

// responsive scale based on width
const guidelineBaseWidth = 375;
const scale = (size) => (width / guidelineBaseWidth) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Typographic scale (modular)
export const typography = {
  scale: (step) => {
    const safeStep = Math.round(step);
    const base = 14;
    const ratios = [12, 13, 14, 16, 18, 20, 24, 32];
    const idx = Math.max(0, Math.min(ratios.length - 1, safeStep + 2));
    return Math.round(moderateScale(ratios[idx]));
  },
  weights: {
    regular: "400",
    medium: "600",
    bold: "800",
    heavy: "900",
  },
};

// Color system (accessible contrast)
export const colors = {
  bg: "#FAFDF9",
  surface: "#FFFFFF",
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  accent: "#FFB300",
  danger: "#C62828",
  text: "#0F1720",
  textMuted: "#6B7280",
  overlay: "rgba(0,0,0,0.36)",
  cardBorder: "rgba(16, 24, 32, 0.06)",
  border: "rgba(16, 24, 32, 0.08)",
  shadow: "rgba(2, 6, 23, 0.12)",
};

// Measurements
export const SIZES = {
  width,
  height,
  heroHeight: Math.round(height * 0.35),
  cardWidth: Math.round(Math.min(140, width * 0.56)),
};

export const radius = {
  small: 8,
  normal: 16,
  large: 28,
};

export const metrics = {
  scale,
  moderateScale,
  pixel: 1 / PixelRatio.get(),
};

export default {
  SPACING,
  typography,
  colors,
  SIZES,
  radius,
  metrics,
};
