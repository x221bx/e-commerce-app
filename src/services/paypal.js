// src/services/paypal.js
import { getEnv } from "../utils/env";

const PAYPAL_CLIENT_ID = getEnv("EXPO_PUBLIC_PAYPAL_CLIENT_ID");
const PAYPAL_SECRET = getEnv("EXPO_PUBLIC_PAYPAL_SECRET");
const PAYPAL_BASE = getEnv("EXPO_PUBLIC_PAYPAL_BASE", "https://api-m.sandbox.paypal.com");
const PAYPAL_CURRENCY = getEnv("EXPO_PUBLIC_PAYPAL_CURRENCY", "USD");
const PAYPAL_EGP_TO_USD_RATE = Number(getEnv("PAYPAL_EGP_TO_USD_RATE", "0.02")) || 0.02;

const convertAmount = (amount, currency) => {
  const val = Number(amount || 0);
  if (!Number.isFinite(val) || val <= 0) return 0;
  if ((currency || "").toUpperCase() === "USD") {
    return Number((val * PAYPAL_EGP_TO_USD_RATE).toFixed(2));
  }
  return Number(val.toFixed(2));
};

const ensureCredentials = () => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error("PayPal credentials are missing");
  }
};

const jsonHeaders = { "Content-Type": "application/json" };

const request = async (path, { method = "GET", headers = {}, body, token } = {}) => {
  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    method,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message || data?.name || data?.error_description || `PayPal request failed (${res.status})`;
    const err = new Error(message);
    err.payload = data;
    throw err;
  }
  return data;
};

const getAccessToken = async () => {
  ensureCredentials();

  const toBase64 = (val) => {
    try {
      return globalThis.Buffer ? globalThis.Buffer.from(val).toString("base64") : Buffer.from(val).toString("base64");
    } catch {
      if (typeof btoa === "function") return btoa(val);
      throw new Error("Base64 not supported");
    }
  };

  const creds = toBase64(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  const body = new URLSearchParams({ grant_type: "client_credentials" }).toString();

  const data = await request("/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return data?.access_token;
};

export const createPaypalOrder = async ({ amount, currency = PAYPAL_CURRENCY, cartItems = [], reference }) => {
  const accessToken = await getAccessToken();
  const convertedAmount = convertAmount(amount, currency);

  const body = JSON.stringify({
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: reference,
        amount: {
          value: convertedAmount.toFixed(2),
          currency_code: (currency || "USD").toUpperCase(),
        },
      },
    ],
    application_context: {
      return_url: "https://example.com/paypal-success",
      cancel_url: "https://example.com/paypal-cancel",
      user_action: "PAY_NOW",
      shipping_preference: "NO_SHIPPING",
    },
  });

  const order = await request("/v2/checkout/orders", {
    method: "POST",
    headers: { ...jsonHeaders },
    token: accessToken,
    body,
  });

  const approvalLink = order?.links?.find?.((l) => l.rel === "approve")?.href;

  return {
    paypalOrderId: order?.id,
    approvalUrl: approvalLink,
    accessToken,
  };
};

export const capturePaypalOrder = async (orderId, token, payerId) => {
  if (!orderId) throw new Error("Missing order id");
  if (!token || !payerId) throw new Error("Missing token or payerId");

  const accessToken = await getAccessToken();

  const capture = await request(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      ...jsonHeaders,
    },
    token: accessToken,
    body: JSON.stringify({
      payment_source: {
        paypal: { token, payer_id: payerId },
      },
    }),
  });

  const status = capture?.status;
  const captureId =
    capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
    capture?.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;

  return { status, captureId, raw: capture };
};

export const parsePaypalRedirect = (url = "") => {
  const lower = url.toLowerCase();
  if (lower.includes("paypal-cancel")) return { status: "cancel" };

  const query = url.split("?")[1] || "";
  const params = new URLSearchParams(query);
  const token = params.get("token");
  const payer = params.get("PayerID") || params.get("payer_id");

  if (payer || lower.includes("paypal-success")) return { status: "success", token, payer };

  return { status: "pending" };
};
