// UserSettings Validation Functions
import { getSettingsMessage } from "./translations";

export const validateProfileField = (field, value) => {
  switch (field) {
    case "email":
      if (value) {
        const emailRegex =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(value) || value.length > 254) {
          return getSettingsMessage("invalidEmail");
        }
      }
      break;
    case "firstName":
      if (!value.trim()) return getSettingsMessage("firstNameRequired");
      if (value.trim().length < 2) return getSettingsMessage("firstNameTooShort");
      if (value.trim().length > 50) return getSettingsMessage("firstNameTooLong");
      break;
    case "lastName":
      if (!value.trim()) return getSettingsMessage("lastNameRequired");
      if (value.trim().length < 2) return getSettingsMessage("lastNameTooShort");
      if (value.trim().length > 50) return getSettingsMessage("lastNameTooLong");
      break;
    case "username":
      if (!value.trim()) return getSettingsMessage("usernameRequired");
      if (value.trim().length < 3) return getSettingsMessage("usernameTooShort");
      if (value.trim().length > 30) return getSettingsMessage("usernameTooLong");
      if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) return getSettingsMessage("usernameInvalid");
      break;
    case "phone": {
      const digitsOnly = (value || "").replace(/\D/g, "");
      if (!digitsOnly) return getSettingsMessage("phoneRequiredGeneric");
      const isValidEgyptianMobile = digitsOnly.startsWith("01") && digitsOnly.length === 11;
      if (!isValidEgyptianMobile) {
        return getSettingsMessage("invalidEgyptPhone");
      }
      break;
    }
    default:
      return "";
  }
  return "";
};

export const validateSecurityField = (field, value, formData) => {
  switch (field) {
    case "currentPassword":
      if (!value) return getSettingsMessage("currentPasswordRequired");
      break;
    case "newPassword":
      if (!value) return getSettingsMessage("newPasswordRequired");
      if (value.length < 8) return getSettingsMessage("passwordTooShort");
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return getSettingsMessage("passwordWeak");
      }
      break;
    case "confirmPassword":
      if (!value) return getSettingsMessage("newPasswordRequired");
      if (value !== formData.newPassword) return getSettingsMessage("passwordsNotMatch");
      break;
    default:
      return "";
  }
  return "";
};

export const calculatePasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Add uppercase letters");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Add numbers");

  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  else feedback.push("Add special characters");

  return { score: Math.min(score, 5), feedback };
};
