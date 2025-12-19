import { useState } from "react";
import { useTranslation } from "react-i18next";

const phoneRegex = /^(01)[0-9]{9}$/;

const normalizePhone = (value = "") => value.replace(/\D/g, "").slice(0, 11);

const buildInitialForm = (user) => {
  const phone =
    user?.phone || user?.phoneNumber || user?.profile?.phone || user?.profileForm?.phone || "";
  return {
    fullName: user?.name || user?.displayName || "",
    phone: normalizePhone(phone),
    address: "",
    city: "",
    notes: "",
  };
};

export const useCheckoutForm = (user) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [errors, setErrors] = useState({});
  const [formErrors, setFormErrors] = useState("");

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = t("checkout.errors.fullName");
    if (!phoneRegex.test(form.phone)) nextErrors.phone = t("checkout.errors.phone");
    if (!form.address.trim()) nextErrors.address = t("checkout.errors.address");
    if (!form.city.trim()) nextErrors.city = t("checkout.errors.city");

    setErrors(nextErrors);
    setFormErrors(Object.keys(nextErrors).length ? Object.values(nextErrors).join(", ") : "");
    return Object.keys(nextErrors).length === 0;
  };

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(buildInitialForm(user));
    setErrors({});
    setFormErrors("");
  };

  return {
    form,
    setForm,
    errors,
    formErrors,
    validate,
    updateForm,
    resetForm,
    normalizePhone,
  };
};
