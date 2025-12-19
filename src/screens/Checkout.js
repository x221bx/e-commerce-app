import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { addDoc, collection, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import CheckoutSummary from "../components/checkout/CheckoutSummary";
import CheckoutContactForm from "../components/checkout/CheckoutContactForm";
import CheckoutShippingForm from "../components/checkout/CheckoutShippingForm";
import CheckoutPaymentSection from "../components/checkout/CheckoutPaymentSection";
import PaymobSheet from "../components/checkout/PaymobSheet";
import PayPalSheet from "../components/checkout/PayPalSheet";
import InvoiceSection from "../components/checkout/InvoiceSection";
import { db } from "../services/firebase";
import { selectCurrentUser } from "../features/auth/authSlice";
import { clearCart } from "../features/cart/cartSlice";
import { useTheme } from "../theme/useTheme";
import { EMPTY_FORM, validateFormFields, buildOrderObject } from "../utils/checkoutUtils";
import { useUserProfile } from "../hooks/useUserProfile";
import { createPaymobCardPayment, createPaymobWalletPayment } from "../services/paymob";
import { createPaypalOrder, capturePaypalOrder } from "../services/paypal";
import { getEnv } from "../utils/env";
import { getShippingCost, subscribeShippingCost } from "../services/shippingService";

const PAYPAL_CURRENCY = getEnv("EXPO_PUBLIC_PAYPAL_CURRENCY", "USD");

export default function Checkout() {
  const navigation = useNavigation();
  const cartItems = useSelector((state) => state.cart.items || []);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { colors, radius, spacing, shadow, typography } = useTheme();

  const paymobLogo = require("../../assets/paymob.png");
  const paypalLogo = require("../../assets/paypla_logo.png");

  const paymentOptions = useMemo(
    () => [
      {
        value: "paymob_card",
        title: t("checkout.payment.paymobTitle", "Pay with card"),
        subtitle: "",
        image: paymobLogo,
        icon: "card-outline",
        iconBg: `${colors.primary}1a`,
        iconColor: colors.primary,
        helper: t("checkout.payment.paymobTagline", "Secured by Paymob Accept"),
        helperColor: colors.primary,
        imageStyle: { width: 110, height: 32 },
      },
      {
        value: "paymob_wallet",
        title: t("checkout.payment.paymobWalletTitle", "Pay with wallet"),
        subtitle: "",
        image: paymobLogo,
        icon: "wallet-outline",
        iconBg: `${colors.success}12`,
        iconColor: colors.success,
        helper: t("checkout.payment.paymobWalletTagline", "Wallets: Vodafone Cash, Orange, Etisalat, WE"),
        helperColor: colors.accent,
        imageStyle: { width: 110, height: 32 },
      },
      {
        value: "paypal",
        title: t("checkout.payment.paypalTitle", "Pay with PayPal"),
        subtitle: t("checkout.payment.paypalSubtitle", "Use your PayPal balance or saved cards"),
        image: paypalLogo,
        icon: "logo-paypal",
        iconBg: "#e7effb",
        iconColor: "#003087",
        helper: t("checkout.payment.paypalTagline", "Checkout with PayPal"),
        helperColor: "#003087",
      },
      {
        value: "cash",
        title: t("checkout.payment.cash", "Cash on Delivery"),
        subtitle: t("checkout.payment.payOnDelivery", "Pay when delivered"),
        image: null,
        icon: "cash-outline",
        iconBg: colors.surfaceMuted,
        iconColor: colors.text,
      },
    ],
    [t, colors.primary, colors.success, colors.text, colors.surfaceMuted, colors.accent]
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("paymob_card");
  const [showInvoice, setShowInvoice] = useState(false);
  const [paymobSession, setPaymobSession] = useState(null);
  const [paymobWalletSession, setPaymobWalletSession] = useState(null);
  const [paypalSession, setPaypalSession] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCapturingPayment, setIsCapturingPayment] = useState(false);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const isPaymentBusy = isCreatingPayment || isCapturingPayment || isValidatingStock;

  useUserProfile(user?.uid, form, setForm);

  useEffect(() => {
    let active = true;

    // Load once
    getShippingCost()
      .then((cost) => {
        if (active) setShippingFee(cost);
      })
      .catch((err) => console.warn("Failed to load shipping fee from Firestore", err));

    // Subscribe to live updates
    const unsubscribe = subscribeShippingCost((cost) => {
      if (active) setShippingFee(cost);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!cartItems.length) {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs", params: { screen: "Shop" } }],
        });
      }
    }, [cartItems.length, navigation])
  );

  const summary = useMemo(() => {
    const subtotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
    const shipping = cartItems.length ? shippingFee : 0;
    return { subtotal, shipping, total: subtotal + shipping };
  }, [cartItems, shippingFee]);

  const handlePaymentSelection = (method) => {
    setPaymentMethod(method);
  };

  const updateStockLevels = async (items = []) => {
    if (!Array.isArray(items) || !items.length) return;

    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const item of items) {
      const productId = item.productId || item.id;
      const quantity = Math.max(0, Number(item.quantity || 0));
      if (!productId || !quantity) continue;

      try {
        const ref = doc(db, "products", productId);
        const snap = await getDoc(ref);
        if (!snap.exists()) continue;
        const data = snap.data() || {};
        const currentStock = Number(data.stock ?? data.quantity ?? 0);
        const newStock = Math.max(currentStock - quantity, 0);

        batch.update(ref, {
          stock: newStock,
          isAvailable: newStock > 0,
          lastPiece: newStock === 1,
          updatedAt: serverTimestamp(),
        });
        hasUpdates = true;
      } catch (error) {
        console.error(`Failed to update stock for product ${productId}`, error);
      }
    }

    if (hasUpdates) {
      try {
        await batch.commit();
      } catch (error) {
        console.error("Failed to commit stock updates", error);
      }
    }
  };

  const placeOrder = async (order, { skipAlert = false } = {}) => {
    const sanitize = (val) => {
      if (val === undefined) return null;
      if (Array.isArray(val)) return val.map(sanitize);
      if (val && typeof val === "object") {
        return Object.entries(val).reduce((acc, [k, v]) => {
          const clean = sanitize(v);
          // skip explicit undefined only (we convert it to null above)
          if (clean !== undefined) acc[k] = clean;
          return acc;
        }, {});
      }
      return val;
    };

    const cleanOrder = sanitize(order);
    let persisted = order;
    try {
      const ordersRef = collection(db, "orders");
      const docRef = await addDoc(ordersRef, {
        ...cleanOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      persisted = { ...cleanOrder, id: docRef.id };
    } catch (e) {
      console.error("Failed to persist order, using local copy", e);
    }

    await updateStockLevels(order.items || []);

    setShowInvoice(true);
    if (!skipAlert) {
      const statusLabel =
        order.paymentStatus === "paid"
          ? t("checkout.payment.statusPaid", "Payment confirmed")
          : order.paymentStatus === "pending"
            ? t("checkout.payment.statusPending", "Awaiting confirmation")
            : t("checkout.payment.statusCash", "Cash on delivery");

      Alert.alert(
        t("checkout.confirm_title", "Order confirmed"),
        t("checkout.confirm_message", "Your order total is {{amount}}. Reference: {{reference}} ({{status}}).", {
          amount: `EGP ${summary.total.toFixed(2)}`,
          reference: persisted.reference,
          status: statusLabel,
        }),
        [{ text: t("checkout.track_order", "Track order"), onPress: () => navigation.navigate("Orders", { order: persisted }) }],
        { cancelable: false }
      );
    }
    dispatch(clearCart());
  };

  const startPaymobPayment = async (order) => {
    setIsCreatingPayment(true);
    try {
      const session = await createPaymobCardPayment({
        amount: summary.total,
        cartItems,
        form,
        user,
        merchantOrderId: order.reference,
      });
      setPaymobSession({ ...session, order });
    } catch (error) {
      console.error("Failed to initialize Paymob payment", error);
      Alert.alert(
        t("common.error", "Error"),
        error?.message || t("checkout.payment.paymobInitError", "Could not start Paymob checkout. Please try again.")
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const startPaymobWalletPayment = async (order) => {
    setIsCreatingPayment(true);
    try {
      const session = await createPaymobWalletPayment({
        amount: summary.total,
        cartItems,
        form,
        user,
        merchantOrderId: order.reference,
      });
      if (!session?.paymentUrl) {
        throw new Error(t("checkout.payment.paymobWalletMissing", "Wallet payment link unavailable."));
      }
      setPaymobWalletSession({ ...session, order });
    } catch (error) {
      console.error("Failed to initialize Paymob wallet payment", error);
      Alert.alert(
        t("common.error", "Error"),
        error?.message || t("checkout.payment.paymobWalletInitError", "Could not start Paymob wallet. Please try again.")
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const startPaypalPayment = async (order) => {
    setIsCreatingPayment(true);
    try {
      const session = await createPaypalOrder({
        amount: summary.total,
        currency: PAYPAL_CURRENCY,
        cartItems,
        reference: order.reference,
      });

      if (!session?.approvalUrl) throw new Error("Missing PayPal approval link");
      setPaypalSession({ ...session, order });
    } catch (error) {
      console.error("Failed to initialize PayPal payment", error);
      Alert.alert(
        t("common.error", "Error"),
        error?.message || t("checkout.payment.paypalInitError", "Could not start PayPal checkout. Please try again.")
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePaymobResult = async (result) => {
    const session = paymobSession;
    setPaymobSession(null);

    if (!session?.order) return;

    if (result?.status === "failed") {
      const code = result?.txnCode ? ` (code ${result.txnCode})` : "";
      Alert.alert(t("common.error", "Error"), t("checkout.payment.paymobFailed", "Payment was not completed. Please try again.") + code);
      return;
    }

    const nextStatus = result?.status === "success" ? "processing" : "pending_payment";
    const nextPaymentStatus = result?.status === "success" ? "paid" : "pending";
    const updatedHistory = Array.isArray(session.order.statusHistory) ? [...session.order.statusHistory] : [];
    if (updatedHistory.every((h) => h.status !== nextStatus)) {
      updatedHistory.push({ status: nextStatus, changedAt: new Date().toISOString() });
    }

    const enrichedOrder = {
      ...session.order,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      statusHistory: updatedHistory,
      paymentDetails: {
        ...(session.order.paymentDetails || {}),
        provider: "paymob",
        gateway: "paymob",
        label: t("checkout.payment.paymobLabel", "Paymob secure card"),
        paymobOrderId: session.paymobOrderId,
        paymentKey: session.paymentKey,
        transactionId: result?.transactionId,
        txnCode: result?.txnCode,
        status: result?.status,
      },
    };

    await placeOrder(enrichedOrder);
  };

  const handlePaymobWalletResult = async (result) => {
    const session = paymobWalletSession;
    setPaymobWalletSession(null);

    if (!session?.order) return;

    if (result?.status === "failed") {
      const code = result?.txnCode ? ` (code ${result.txnCode})` : "";
      Alert.alert(t("common.error", "Error"), t("checkout.payment.paymobFailed", "Payment was not completed. Please try again.") + code);
      return;
    }

    const nextStatus = result?.status === "success" ? "processing" : "pending_payment";
    const nextPaymentStatus = result?.status === "success" ? "paid" : "pending";
    const updatedHistory = Array.isArray(session.order.statusHistory) ? [...session.order.statusHistory] : [];
    if (updatedHistory.every((h) => h.status !== nextStatus)) {
      updatedHistory.push({ status: nextStatus, changedAt: new Date().toISOString() });
    }

    const enrichedOrder = {
      ...session.order,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      statusHistory: updatedHistory,
      paymentDetails: {
        ...(session.order.paymentDetails || {}),
        provider: "paymob",
        gateway: "paymob",
        type: "wallet",
        label: t("checkout.payment.paymobWalletLabel", "Paymob wallet"),
        paymobOrderId: session.paymobOrderId,
        paymentKey: session.paymentKey,
        transactionId: result?.transactionId,
        txnCode: result?.txnCode,
        status: result?.status,
        walletPhone: session.walletPhone,
      },
    };

    await placeOrder(enrichedOrder);
  };

  const handlePaypalResult = async (result) => {
    const session = paypalSession;
    setPaypalSession(null);

    if (!session?.order) return;

    if (result?.status === "cancel") {
      Alert.alert(t("common.error", "Error"), t("checkout.payment.paypalCancelled", "Payment was cancelled."));
      return;
    }

    const token = result?.token;
    const payerId = result?.payer;
    const paypalOrderId = result?.paypalOrderId || session.paypalOrderId;

    if (!paypalOrderId || !token || !payerId) {
      Alert.alert(t("common.error", "Error"), "Missing required PayPal approval data (token / payerId).");
      return;
    }

    setIsCapturingPayment(true);
    try {
      const capture = await capturePaypalOrder(paypalOrderId, token, payerId);

      const success = capture?.status === "COMPLETED";
      const nextStatus = success ? "processing" : "pending_payment";
      const nextPaymentStatus = success ? "paid" : "pending";

      const updatedHistory = Array.isArray(session.order.statusHistory) ? [...session.order.statusHistory] : [];
      if (updatedHistory.every((h) => h.status !== nextStatus)) {
        updatedHistory.push({ status: nextStatus, changedAt: new Date().toISOString() });
      }

      const enrichedOrder = {
        ...session.order,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        statusHistory: updatedHistory,
        paymentDetails: {
          ...(session.order.paymentDetails || {}),
          provider: "paypal",
          gateway: "paypal",
          label: t("checkout.payment.paypalLabel", "PayPal"),
          paypalOrderId,
          paypalCaptureId: capture?.captureId ?? null,
          status: capture?.status ?? null,
        },
      };

      await placeOrder(enrichedOrder);
    } catch (error) {
      console.error("Failed to capture PayPal order", error);
      const message = error?.payload?.details?.[0]?.description || error?.message;
      Alert.alert(
        t("common.error", "Error"),
        message || t("checkout.payment.paypalCaptureError", "Could not confirm PayPal payment.")
      );
    } finally {
      setIsCapturingPayment(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (isCreatingPayment) return;

    if (!cartItems.length) {
      Alert.alert(t("common.error", "Error"), t("checkout.errors.emptyCart", "Please add at least one item before checkout."));
      return;
    }

    setIsValidatingStock(true);
    try {
      const unavailable = [];
      for (const item of cartItems) {
        const productId = item.productId || item.id;
        const qty = Number(item?.quantity || 1);
        if (!productId) continue;
        try {
          const snap = await getDoc(doc(db, "products", productId));
          if (!snap.exists()) {
            unavailable.push(item);
            continue;
          }
          const data = snap.data() || {};
          const stock = Number(data.stock ?? data.quantity ?? 0);
          const allow = stock > 0 && data.isAvailable !== false && qty <= stock;
          if (!allow) unavailable.push(item);
        } catch {
          unavailable.push(item);
        }
      }

      if (unavailable.length) {
        Alert.alert(
          t("common.error", "Error"),
          t("checkout.errors.outOfStock", "One or more items are out of stock. Please update your cart.")
        );
        return;
      }
    } finally {
      setIsValidatingStock(false);
    }

    const newErrors = validateFormFields(form, t, paymentMethod);
    setErrors(newErrors);
    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) {
      Alert.alert(t("common.error", "Error"), t("checkout.errors.missingInfo", "Please fix the highlighted fields."));
      return;
    }

    const order = buildOrderObject(form, cartItems, summary, user, paymentMethod, [], null, t);

    const formatCurrency = (value) => `EGP ${Number(value || 0).toFixed(2)}`;
    const confirmMessage = t("checkout.confirm_before_message", {
      subtotal: formatCurrency(summary.subtotal),
      shipping: formatCurrency(summary.shipping),
      total: formatCurrency(summary.total),
    });

    const confirmActionLabel =
      paymentMethod === "paymob_card"
        ? t("checkout.confirm_before_action_pay", "Proceed to secure payment")
        : paymentMethod === "paymob_wallet"
          ? t("checkout.confirm_before_action_wallet", "Proceed to wallet payment")
          : paymentMethod === "paypal"
            ? t("checkout.confirm_before_action_paypal", "Proceed to PayPal")
            : t("checkout.confirm_before_action", "Confirm and charge");

    Alert.alert(
      t("checkout.confirm_before_title", "Review order before checkout"),
      confirmMessage,
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: confirmActionLabel,
          onPress: () => {
            if (paymentMethod === "paymob_card") {
              startPaymobPayment(order);
            } else if (paymentMethod === "paymob_wallet") {
              startPaymobWalletPayment(order);
            } else if (paymentMethod === "paypal") {
              startPaypalPayment(order);
            } else {
              placeOrder(order);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: spacing.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xxl }]}>{t("checkout.title", "Checkout")}</Text>
      <CheckoutContactForm form={form} setForm={setForm} errors={errors} />
      <CheckoutShippingForm form={form} setForm={setForm} errors={errors} />
      <CheckoutPaymentSection
        paymentMethod={paymentMethod}
        handlePaymentSelection={handlePaymentSelection}
        paymentOptions={paymentOptions}
        form={form}
        setForm={setForm}
        errors={errors}
      />
      <CheckoutSummary cartItems={cartItems} summary={summary} />
      {showInvoice && <InvoiceSection cartItems={cartItems} summary={summary} colors={colors} radius={radius} shadow={shadow} />}
      <Pressable
        style={[
          styles.confirmBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.lg,
            paddingVertical: spacing.lg,
            shadowColor: shadow.color,
            shadowOpacity: shadow.opacity,
            shadowRadius: shadow.radius,
            shadowOffset: shadow.offset,
            opacity: isPaymentBusy ? 0.7 : 1,
          },
        ]}
        onPress={handleConfirmOrder}
        disabled={isPaymentBusy}
      >
        {isPaymentBusy ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={[styles.confirmText, { color: colors.surface }]}>{t("checkout.confirm", "Confirm Order")}</Text>
        )}
      </Pressable>
      <PaymobSheet visible={!!paymobSession} paymentUrl={paymobSession?.paymentUrl} onClose={() => setPaymobSession(null)} onResult={handlePaymobResult} />
      <PaymobSheet
        visible={!!paymobWalletSession}
        paymentUrl={paymobWalletSession?.paymentUrl}
        onClose={() => setPaymobWalletSession(null)}
        onResult={handlePaymobWalletResult}
        title={t("checkout.payment.paymobWalletTitle", "Pay with wallet (Paymob)")}
        subtitle={t("checkout.payment.paymobWalletSubtitle", "Vodafone Cash, Orange, Etisalat, WE Pay")}
        helper={t("checkout.payment.paymobWalletHelper", "Use your mobile wallet. You'll confirm inside your wallet app.")}
        loadingText={t("checkout.payment.paymobWalletLoading", "Redirecting to your wallet...")}
        missingText={t("checkout.payment.paymobWalletMissing", "Wallet payment link unavailable.")}
      />
      <PayPalSheet
        visible={!!paypalSession}
        approvalUrl={paypalSession?.approvalUrl}
        paypalOrderId={paypalSession?.paypalOrderId}
        onClose={() => setPaypalSession(null)}
        onResult={handlePaypalResult}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 14, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  confirmBtn: {
    marginTop: 8,
    alignItems: "center",
  },
  confirmText: { fontWeight: "800", fontSize: 16 },
});
