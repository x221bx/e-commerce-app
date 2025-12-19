// Minimal polyfills to keep shared code working on native without browser globals
import "intl-pluralrules";

if (typeof globalThis.localStorage === "undefined") {
  const memoryStorage = {};
  globalThis.localStorage = {
    getItem: (key) =>
      Object.prototype.hasOwnProperty.call(memoryStorage, key)
        ? memoryStorage[key]
        : null,
    setItem: (key, value) => {
      memoryStorage[key] = String(value);
    },
    removeItem: (key) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
  };
}
