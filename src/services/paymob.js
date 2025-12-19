// src/services/paymob.js
import { normalizePhone } from "../utils/checkoutUtils";
import { getEnv } from "../utils/env";

const API_BASE = getEnv("EXPO_PUBLIC_PAYMOB_API_BASE", "https://accept.paymob.com/api");
const API_KEY = getEnv("EXPO_PUBLIC_PAYMOB_API_KEY");
const IFRAME_ID = getEnv("EXPO_PUBLIC_PAYMOB_IFRAME_ID");
const CARD_INTEGRATION_ID = getEnv("EXPO_PUBLIC_PAYMOB_CARD_INTEGRATION_ID");
const WALLET_INTEGRATION_ID = getEnv("EXPO_PUBLIC_PAYMOB_WALLET_INTEGRATION_ID");

const jsonHeaders = { "Content-Type": "application/json" };

const request = async (path, payload) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message || data?.detail || data?.error_msg || `Paymob request failed (${res.status})`;
    const err = new Error(message);
    err.payload = data;
    throw err;
  }
  return data;
};

const getAuthToken = async () => {
  if (!API_KEY) {
    throw new Error("Paymob API key is missing");
  }
  const auth = await request("/auth/tokens", { api_key: API_KEY });
  const authToken = auth?.token;
  if (!authToken) {
    throw new Error("Failed to obtain Paymob auth token");
  }
  return authToken;
};

const buildBillingData = (form = {}, user = {}) => {
  const full = (form.fullName || user?.displayName || "Guest User").trim();
  const [firstName = "Guest", ...rest] = full.split(/\s+/);
  const lastName = rest.join(" ") || "User";
  const phoneDigits = normalizePhone(form.phone || "");

  return {
    first_name: firstName,
    last_name: lastName,
    email: user?.email || "unknown@example.com",
    phone_number: phoneDigits ? `+2${phoneDigits}` : "+201000000000",
    apartment: "NA",
    floor: "NA",
    street: form.address || "NA",
    building: "NA",
    shipping_method: "PKG",
    postal_code: "00000",
    city: form.city || "Cairo",
    state: form.city || "NA",
    country: "EG",
  };
};

const mapItems = (cartItems = []) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return [
      {
        name: "Order",
        amount_cents: 0,
        description: "Cart order",
        quantity: 1,
      },
    ];
  }

  return cartItems.map((item) => ({
    name: item.name || item.title || "Item",
    amount_cents: Math.round(Number(item.price || 0) * 100),
    description: item.description || item.name || "Cart item",
    quantity: Number(item.quantity || 1),
  }));
};

export const createPaymobCardPayment = async ({
  amount,
  currency = "EGP",
  cartItems = [],
  form = {},
  user = {},
  merchantOrderId,
}) => {
  if (!API_KEY || !CARD_INTEGRATION_ID || !IFRAME_ID) {
    throw new Error("Paymob configuration is missing");
  }

  const amountCents = Math.max(100, Math.round(Number(amount || 0) * 100));

  const authToken = await getAuthToken();

  const order = await request("/ecommerce/orders", {
    auth_token: authToken,
    delivery_needed: "false",
    amount_cents: amountCents,
    currency,
    items: mapItems(cartItems),
    merchant_order_id: merchantOrderId,
  });

  const payment = await request("/acceptance/payment_keys", {
    auth_token: authToken,
    amount_cents: amountCents,
    currency,
    order_id: order?.id,
    integration_id: Number(CARD_INTEGRATION_ID),
    billing_data: buildBillingData(form, user),
    lock_order_when_paid: true,
  });

  const paymentUrl = `${API_BASE}/acceptance/iframes/${IFRAME_ID}?payment_token=${payment?.token}`;

  return {
    paymentUrl,
    paymentKey: payment?.token,
    paymobOrderId: order?.id,
    amountCents,
  };
};

export const createPaymobWalletPayment = async ({
  amount,
  currency = "EGP",
  cartItems = [],
  form = {},
  user = {},
  merchantOrderId,
}) => {
  if (!API_KEY || !WALLET_INTEGRATION_ID) {
    throw new Error("Paymob wallet configuration is missing");
  }

  const walletDigits = normalizePhone(form.walletPhone || form.phone || user?.phoneNumber || "");
  if (!walletDigits) {
    throw new Error("Wallet phone number is required");
  }

  const amountCents = Math.max(100, Math.round(Number(amount || 0) * 100));
  const authToken = await getAuthToken();

  const order = await request("/ecommerce/orders", {
    auth_token: authToken,
    delivery_needed: "false",
    amount_cents: amountCents,
    currency,
    items: mapItems(cartItems),
    merchant_order_id: merchantOrderId,
  });

  const payment = await request("/acceptance/payment_keys", {
    auth_token: authToken,
    amount_cents: amountCents,
    currency,
    order_id: order?.id,
    integration_id: Number(WALLET_INTEGRATION_ID),
    billing_data: buildBillingData(form, user),
    lock_order_when_paid: true,
  });

  const walletCharge = await request("/acceptance/payments/pay", {
    source: {
      identifier: walletDigits,
      subtype: "WALLET",
    },
    payment_token: payment?.token,
  });

  const paymentUrl = walletCharge?.redirect_url || walletCharge?.iframe_redirection_url;

  if (!paymentUrl) {
    throw new Error("Paymob wallet redirect link unavailable");
  }

  return {
    paymentUrl,
    paymentKey: payment?.token,
    paymobOrderId: order?.id,
    amountCents,
    walletPhone: walletDigits,
  };
};

export const parsePaymobRedirect = (url) => {
  if (!url) return { status: "unknown" };
  const parts = url.split("?");
  const query = parts[1] || "";
  const params = new URLSearchParams(query);
  const successFlag = params.get("success");
  const pendingFlag = params.get("pending");
  const txnCode = params.get("txn_response_code");
  const transactionId = params.get("id") || params.get("transaction_id");

  const successCodes = ["APPROVED", "00", "0"];
  const pendingCodes = ["10"];
  const isSuccess = successFlag === "true" || successCodes.includes(txnCode);
  const isPending = pendingFlag === "true" || pendingCodes.includes(txnCode);

  return {
    status: isSuccess ? "success" : isPending ? "pending" : "pending",
    txnCode,
    transactionId,
    rawUrl: url,
  };
};
