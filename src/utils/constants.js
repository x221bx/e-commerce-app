import { AlertTriangle, Globe, ShieldCheck, User, Tractor, Sprout, Stethoscope } from "lucide-react";

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export const navItems = [
  {
    id: "personal",
    label: "Personal Info",
    labelKey: "settings.navigation.items.personal.label",
    description: "Update your farming profile",
    descriptionKey: "settings.navigation.items.personal.description",
    icon: User,
    category: "profile",
  },
  {
    id: "security",
    label: "Security",
    labelKey: "settings.navigation.items.security.label",
    description: "Secure your account",
    descriptionKey: "settings.navigation.items.security.description",
    icon: ShieldCheck,
    category: "profile",
  },
  {
    id: "account",
    label: "Account",
    labelKey: "settings.navigation.items.account.label",
    description: "Account management",
    descriptionKey: "settings.navigation.items.account.description",
    icon: Tractor,
    category: "account",
  },
];

export const navCategories = [
  {
    id: "profile",
    label: "Profile",
    labelKey: "settings.navigation.categories.profile.label",
    icon: Stethoscope,
    description: "Your identity and security",
    descriptionKey: "settings.navigation.categories.profile.description",
    helper: "Keep your personal and security details accurate.",
    helperKey: "settings.navigation.categories.profile.helper",
    color: "green",
  },
  {
    id: "account",
    label: "Account",
    labelKey: "settings.navigation.categories.account.label",
    icon: Tractor,
    description: "Manage your account",
    descriptionKey: "settings.navigation.categories.account.description",
    helper: "Take action on your profile status and data requests.",
    helperKey: "settings.navigation.categories.account.helper",
    color: "orange",
  },
];

export const notificationDefaults = {
  productUpdates: true,
  orderUpdates: true,
  securityAlerts: true,
  marketingEmails: false,
};

export const preferenceDefaults = {
  locale: "en",
  measurement: "metric",
  deliveryNotes: "",
};

export const emptySecurityForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const notificationOptions = {
  productUpdates: {
    label: "Product Updates",
    labelKey: "settings.notificationOptions.productUpdates.label",
    description: "Weekly highlights about new agri-vet products and bundles.",
    descriptionKey: "settings.notificationOptions.productUpdates.description",
  },
  orderUpdates: {
    label: "Order Updates",
    labelKey: "settings.notificationOptions.orderUpdates.label",
    description: "Delivery tracking and billing reminders for every purchase.",
    descriptionKey: "settings.notificationOptions.orderUpdates.description",
  },
  securityAlerts: {
    label: "Security Alerts",
    labelKey: "settings.notificationOptions.securityAlerts.label",
    description: "Sign-in alerts and unusual activity notifications.",
    descriptionKey: "settings.notificationOptions.securityAlerts.description",
  },
  marketingEmails: {
    label: "Marketing Emails",
    labelKey: "settings.notificationOptions.marketingEmails.label",
    description: "Seasonal promotions and educational content.",
    descriptionKey: "settings.notificationOptions.marketingEmails.description",
  },
};

export const notificationGroups = [
  {
    id: "orders",
    label: "Orders & fulfillment",
    description: "Stay in sync with shipments, invoices, and restocks.",
    keys: ["orderUpdates", "productUpdates"],
  },
  {
    id: "security",
    label: "Security & sign-in",
    description: "Be alerted whenever something looks suspicious.",
    keys: ["securityAlerts"],
  },
  {
    id: "marketing",
    label: "Learning & offers",
    description: "Occasional tips, education, and seasonal deals.",
    keys: ["marketingEmails"],
  },
];

export const accountActionCopy = {
  deactivate: {
    title: "Confirm deactivation",
    description: "We'll pause your activity and hide your storefront until you sign back in.",
    confirmLabel: "Yes, deactivate",
  },
  delete: {
    title: "Request permanent deletion",
    description:
      "This removes your data after a manual review by our team. You'll lose access to order history and saved preferences.",
    confirmLabel: "Request deletion",
  },
};

export const sectionToneStyles = {
  neutral: {
    light: "border border-green-200/30 bg-white/90 backdrop-blur-sm",
    dark: "border border-slate-700 bg-slate-900/90",
  },
  highlight: {
    light: "border border-green-300/60 bg-gradient-to-b from-white/95 to-green-50/80 backdrop-blur-sm",
    dark: "border border-green-800/40 bg-gradient-to-b from-slate-900/90 to-green-950/40",
  },
  danger: {
    light: "border border-red-200/50 bg-red-50/90 backdrop-blur-sm",
    dark: "border border-red-900/40 bg-red-950/30",
  },
};
