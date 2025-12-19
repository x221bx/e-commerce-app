import Constants from "expo-constants";

const readEnvValue = (key) => {
  if (!key) return undefined;
  return (
    (typeof process !== "undefined" ? process.env?.[key] : undefined) ??
    Constants?.expoConfig?.extra?.[key] ??
    Constants?.manifest?.extra?.[key]
  );
};

export const getEnv = (keys, fallback = undefined) => {
  const names = Array.isArray(keys) ? keys : [keys];
  for (const name of names) {
    const value = readEnvValue(name);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};
