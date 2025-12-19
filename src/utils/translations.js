// Translation helpers for user settings
import i18n from "../../../i18n";

const BASE_KEY = "userSettings.messages";

const translateWithFallback = (key, locale) => {
  const fullKey = `${BASE_KEY}.${key}`;
  const primaryLocale = locale || i18n.language || "en";
  const primary = i18n.t(fullKey, { lng: primaryLocale, defaultValue: "" });

  if (primary && primary !== fullKey) {
    return primary;
  }

  const fallback = i18n.t(fullKey, { lng: "en", defaultValue: "" });
  if (fallback && fallback !== fullKey) {
    return fallback;
  }

  return key;
};

export const getSettingsMessage = (key, locale) =>
  translateWithFallback(key, locale);

// Backwards compatibility for older imports
export const getErrorMessage = (key, locale) =>
  getSettingsMessage(key, locale);

export const getCurrentLocale = () => i18n.language || "en";
