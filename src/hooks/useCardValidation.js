import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const useCardValidation = () => {
  const { t } = useTranslation();
  const [cardForm, setCardForm] = useState({
    holder: "",
    number: "",
    exp: "",
    cvv: "",
    nickname: "",
  });
  const [cardErrors, setCardErrors] = useState({});
  const [cardValid, setCardValid] = useState(false);

  const luhnCheck = (raw) => {
    let sum = 0;
    let shouldDouble = false;
    for (let i = raw.length - 1; i >= 0; i -= 1) {
      let digit = parseInt(raw[i], 10);
      if (Number.isNaN(digit)) return false;
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const detectBrand = (number) => {
    const cleaned = number.replace(/\s+/g, "");
    if (/^4\d{12,18}$/.test(cleaned)) return "visa";
    if (/^3[47]\d{13}$/.test(cleaned)) return "amex";
    if (
      /^5[1-5]\d{14}$/.test(cleaned) ||
      /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)\d{12}$/.test(cleaned)
    ) {
      return "mastercard";
    }
    return null;
  };

  const getExpectedLength = (brand) => {
    switch (brand) {
      case "amex":
        return 15;
      case "visa":
        return [13, 16, 18, 19];
      case "mastercard":
        return 16;
      default:
        return [13, 14, 15, 16, 17, 18, 19];
    }
  };

  const validateExpiry = (value) => {
    const match = /^(\d{2})\/(\d{2})$/.exec(value);
    if (!match) return false;
    const [, month, year] = match;
    const monthNum = Number(month);
    if (monthNum < 1 || monthNum > 12) return false;
    const fullYear = 2000 + Number(year);
    const expiry = new Date(fullYear, monthNum - 1, 1);
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry > new Date();
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatHolderName = (value) => value.replace(/[^A-Za-z\s]/g, "").toUpperCase();

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const handleCardFormChange = (field, value) => {
    setCardForm((prev) => ({ ...prev, [field]: value }));
    setCardErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  useEffect(() => {
    const sanitizedNumber = cardForm.number.replace(/\s+/g, "");
    const brand = detectBrand(sanitizedNumber);
    const expectedLengths = getExpectedLength(brand);
    const isValidLength = Array.isArray(expectedLengths)
      ? expectedLengths.includes(sanitizedNumber.length)
      : sanitizedNumber.length === expectedLengths;

    const isValid = brand && isValidLength && luhnCheck(sanitizedNumber);
    setCardValid(isValid);
  }, [cardForm.number]);

  const validateCard = () => {
    const errors = {};
    const holder = cardForm.holder.trim();
    const sanitizedNumber = cardForm.number.replace(/\s+/g, "");
    const cvvTrimmed = cardForm.cvv.trim();
    const brand = detectBrand(sanitizedNumber);

    if (!holder) {
      errors.holder = t("payments.errors.holder", "Please enter the card holder name.");
    } else if (!/^[A-Z\s]+$/.test(holder)) {
      errors.holder = t("payments.errors.holder", "Use letters only (A-Z).");
    }

    const numberTooShort = sanitizedNumber.length < 13;
    const numberTooLong = sanitizedNumber.length > 19;
    const invalidLuhn = !luhnCheck(sanitizedNumber);

    const brandLengthOk =
      (brand === "visa" &&
        (sanitizedNumber.length === 13 ||
          sanitizedNumber.length === 16 ||
          sanitizedNumber.length === 19)) ||
      (brand === "mastercard" && sanitizedNumber.length === 16) ||
      (brand === "amex" && sanitizedNumber.length === 15);

    if (!brand || numberTooShort || numberTooLong || invalidLuhn || !brandLengthOk) {
      errors.number = t("payments.errors.number", "Enter a valid card number.");
    }
    if (!validateExpiry(cardForm.exp)) {
      errors.exp = t("payments.errors.expiry", "Expiry must be MM/YY and in the future.");
    }
    const expectedCvvLen = brand === "amex" ? 4 : 3;
    if (cvvTrimmed.length !== expectedCvvLen || /\D/.test(cvvTrimmed)) {
      errors.cvv = t("payments.errors.cvv", "Enter the 3 or 4 digit CVV.");
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetCard = () => {
    setCardForm({ holder: "", number: "", exp: "", cvv: "", nickname: "" });
    setCardErrors({});
  };

  return {
    cardForm,
    setCardForm,
    cardErrors,
    setCardErrors,
    cardValid,
    handleCardFormChange,
    validateCard,
    resetCard,
    detectBrand,
    formatCardNumber,
    formatHolderName,
    formatExpiry,
    validateExpiry,
    luhnCheck,
  };
};
