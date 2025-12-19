import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const fallbackLng = "en";
const deviceLocales = Localization.getLocales();
const deviceLang = deviceLocales?.[0]?.languageCode || fallbackLng;

// Apply RTL for Arabic
if (deviceLang === "ar" && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
if (deviceLang !== "ar" && I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLang,
  fallbackLng,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
