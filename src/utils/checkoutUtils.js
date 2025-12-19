const PHONE_MAX_LENGTH = 11;
const EGYPTIAN_PHONE_REGEX = /^01(0|1|2|5)\d{8}$/;
const ORDER_PREFIX = "AGRI-";

export const EMPTY_FORM = {
  fullName: "",
  phone: "",
  walletPhone: "",
  address: "",
  city: "",
  notes: "",
};

export const normalizePhone = (val = "") => val.replace(/\D/g, "").slice(0, PHONE_MAX_LENGTH);
export const isValidEgyptPhone = (digits) => EGYPTIAN_PHONE_REGEX.test(digits);
export const isLettersOnly = (val = "") => /^[A-Za-z\u0600-\u06FF\s]+$/.test(val.trim());

export const validateFormFields = (form, t, paymentMethod) => {
  const digits = normalizePhone(form.phone);
  const walletDigits = normalizePhone(form.walletPhone);

  return {
    fullName: form.fullName
      ? isLettersOnly(form.fullName)
        ? ""
        : t("checkout.errors.nameLetters", "Name must be letters only")
      : t("checkout.errors.required", "Required"),
    phone: digits
      ? isValidEgyptPhone(digits)
        ? ""
        : t("checkout.errors.phoneInvalid", "Enter a valid 11-digit Egyptian mobile")
      : t("checkout.errors.required", "Required"),
    walletPhone:
      paymentMethod === "paymob_wallet"
        ? walletDigits
          ? isValidEgyptPhone(walletDigits)
            ? ""
            : t("checkout.errors.phoneInvalid", "Enter a valid 11-digit Egyptian mobile")
          : t("checkout.errors.required", "Required")
        : "",
    address: form.address
      ? isLettersOnly(form.address)
        ? ""
        : t("checkout.errors.addressLetters", "Address must be letters only")
      : t("checkout.errors.required", "Required"),
    city: form.city
      ? isLettersOnly(form.city)
        ? ""
        : t("checkout.errors.cityLetters", "City must be letters only")
      : t("checkout.errors.required", "Required"),
  };
};

const buildPaymentDetails = (paymentMethod, form, savedCards, selectedSavedCardId, t) => {
  if (paymentMethod === "paymob_card") {
    return {
      type: "card",
      provider: "paymob",
      gateway: "paymob",
      label: t("checkout.payment.paymobLabel", "Paymob secure card"),
      holder: (form.fullName || "").toUpperCase(),
      last4: savedCards?.find?.((c) => c.id === selectedSavedCardId)?.last4,
    };
  }

  if (paymentMethod === "paymob_wallet") {
    return {
      type: "wallet",
      provider: "paymob",
      gateway: "paymob",
      label: t("checkout.payment.paymobWalletLabel", "Paymob wallet"),
      walletPhone: normalizePhone(form.walletPhone || form.phone),
    };
  }

  if (paymentMethod === "paypal") {
    return {
      type: "wallet",
      provider: "paypal",
      gateway: "paypal",
      label: t("checkout.payment.paypalLabel", "PayPal"),
    };
  }

  return { type: "cash", gateway: "cod", label: t("checkout.payment.cash", "Cash on Delivery") };
};

const buildOrderItems = (cartItems) => {
  return cartItems.map((item) => ({
    id: item.id,
    productId: item.id,
    name: item.name || item.title,
    image: item.thumbnailUrl || item.imageUrl,
    price: item.price || 0,
    quantity: item.quantity || 1,
    total: (item.price || 0) * (item.quantity || 1),
    category: item.category || "General",
  }));
};

export const buildOrderObject = (
  form,
  cartItems,
  summary,
  user,
  paymentMethod,
  savedCards,
  selectedSavedCardId,
  t
) => {
  const orderNumber = `${Math.floor(Math.random() * 900000000)}`;
  const reference = `${ORDER_PREFIX}${orderNumber.slice(0, 6)}`;
  const nowIso = new Date().toISOString();
  const paymentDetails = buildPaymentDetails(paymentMethod, form, savedCards, selectedSavedCardId, t);
  const initialStatus = paymentMethod === "cash" ? "processing" : "pending_payment";
  const paymentStatus = paymentMethod === "cash" ? "cod_pending" : "pending";

  return {
    reference,
    orderNumber,
    userId: user?.uid,
    userEmail: user?.email,
    userName: user?.displayName || form.fullName,
    fullName: form.fullName,
    phone: normalizePhone(form.phone),
    address: form.address || "N/A",
    city: form.city || "N/A",
    notes: form.notes || "",
    paymentMethod,
    paymentDetails,
    paymentSummary: paymentDetails.label,
    paymentStatus,
    paymentGateway: paymentDetails.gateway,
    items: buildOrderItems(cartItems),
    totals: {
      subtotal: summary.subtotal,
      shipping: summary.shipping,
      total: summary.total,
    },
    shipping: {
      recipient: form.fullName,
      fullName: form.fullName,
      phone: normalizePhone(form.phone),
      addressLine1: form.address || "N/A",
      city: form.city || "N/A",
      notes: form.notes || "",
      email: user?.email || "",
    },
    status: initialStatus,
    statusHistory: [{ status: initialStatus, changedAt: nowIso }],
    createdAt: nowIso,
    updatedAt: nowIso,
    uid: user?.uid,
  };
};
