// UserSettings Helper Functions
import { notificationDefaults, preferenceDefaults } from "./constants";

export const splitName = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(" ");
  if (parts.length === 1) return { first: parts[0], last: "" };
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts.slice(-1).join(" "),
  };
};

export const getProfileState = (profile) => {
  if (!profile) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
      location: "",
      photoURL: "",
    };
  }

  const fallback = splitName(profile.name || "");

  return {
    firstName: profile.firstName ?? fallback.first,
    lastName: profile.lastName ?? fallback.last,
    email: profile.email ?? "",
    username: profile.username ?? "",
    phone: profile.contact?.phone ?? "",
    location: profile.contact?.location ?? "",
    photoURL: profile.photoURL ?? profile.photoUrl ?? profile.avatarUrl ?? "",
  };
};

export const getNotificationState = (profile) => ({
  ...notificationDefaults,
  ...(profile?.preferences?.notifications || {}),
});

export const getPreferenceState = (profile) => ({
  ...preferenceDefaults,
  ...(profile?.preferences || {}),
});

export const formatNotificationKey = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (char) => char.toUpperCase())
    .trim();

export const formatLastUpdated = (raw) => {
  const date = parseTimestamp(raw);
  if (!date) {
    return { relative: "No updates yet", absolute: "—" };
  }
  return {
    relative: formatRelativeTime(date),
    absolute: date.toLocaleString(),
  };
};

export const parseTimestamp = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") return new Date(raw);
  if (typeof raw === "string") {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof raw?.toDate === "function") {
    try {
      const parsed = raw.toDate();
      if (parsed) return parsed;
    } catch (error) {
      // ignore parsing error
    }
  }
  if (raw?.seconds) return new Date(raw.seconds * 1000);
  if (raw?._seconds) return new Date(raw._seconds * 1000);
  return null;
};

export const formatRelativeTime = (date) => {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

export const formatStatusLabel = (value) => {
  return value.replace(/-/g, " ").replace(/^\w/, (char) => char.toUpperCase());
};

export const formatLocaleLabel = (value) => {
  switch (value) {
    case "ar":
      return "Arabic";
    case "en":
    default:
      return "English";
  }
};

export const formatMeasurementLabel = (value) => {
  switch (value) {
    case "imperial":
      return "Imperial units";
    case "metric":
    default:
      return "Metric units";
  }
};
