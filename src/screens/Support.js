// src/screens/Support.js
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../services/firebase";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useTheme } from "../theme/useTheme";
import { getEnv } from "../utils/env";

const extractResponseText = (payload) => {
  if (!payload) return "";
  if (typeof payload.output_text === "string") return payload.output_text;

  if (Array.isArray(payload.output)) {
    for (const item of payload.output) {
      const textValue =
        item?.content?.[0]?.text?.value || item?.content?.[0]?.text || item?.content?.[0]?.value;
      if (typeof textValue === "string") return textValue;
    }
  }

  if (Array.isArray(payload.choices)) {
    const choice = payload.choices[0];
    if (typeof choice?.message?.content === "string") return choice.message.content;
    if (Array.isArray(choice?.message?.content))
      return choice.message.content.map((part) => part?.text || part).join(" ");
    if (typeof choice?.text === "string") return choice.text;
  }

  return "";
};

const normalizePhoneInput = (value = "") => value.replace(/\D/g, "").slice(0, 11);
const isValidEgyptMobile = (digits) => /^01(0|1|2|5)\d{8}$/.test(digits);

export default function Support() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === "ar";
  const user = useSelector(selectCurrentUser);

  const { colors, spacing, radius, shadow, mode } = useTheme();
  const isDark = mode === "dark";

  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("orders");
  const [phoneNumber, setPhoneNumber] = useState(normalizePhoneInput(user?.phone || ""));
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);

  const supportCollection = useMemo(() => collection(db, "support"), []);

  const topics = [
    { key: "orders", label: t("support.topics.orders", "Orders & Logistics") },
    { key: "billing", label: t("support.topics.billing", "Billing & Payments") },
    { key: "product", label: t("support.topics.product", "Product Feedback") },
    { key: "ai", label: t("support.topics.ai", "AI Assistant") },
    { key: "technical", label: t("support.topics.technical", "Technical Issues") },
    { key: "other", label: t("support.topics.other", "Other") },
  ];

  const currentTopicLabel = topics.find((tpc) => tpc.key === topic)?.label || topics[0].label;

  const validatePhoneNumber = (value = "") => {
    const digits = normalizePhoneInput(value);
    if (!digits) return t("support.phoneRequired");
    if (!isValidEgyptMobile(digits)) return t("support.phoneInvalid");
    return "";
  };

  const moderateMessage = async (text) => {
    const API_KEY = getEnv(["EXPO_PUBLIC_OR_KEY", "EXPO_PUBLIC_OPENAI_KEY"]);

    if (!API_KEY) return { allowed: true };

    const prompt = `
You are a strict content moderator. Review the following message and respond with either:
- "ALLOW"
- "REJECT: <short reason>"
Message:
"""${text}"""
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "X-Title": "V Shop Support",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
      });

      if (!response.ok) throw new Error("Moderation request failed");

      const data = await response.json();
      const verdictRaw = extractResponseText(data).trim().toUpperCase();

      if (!verdictRaw || verdictRaw.startsWith("ALLOW")) return { allowed: true };

      if (verdictRaw.startsWith("REJECT")) {
        const reason = extractResponseText(data).split(":").slice(1).join(":").trim();
        return { allowed: false, reason };
      }

      return { allowed: true };
    } catch {
      return { allowed: false, reason: t("support.moderationFailed") };
    }
  };

  const submitSupport = async () => {
    if (!message.trim()) {
      Alert.alert(t("common.error"), t("support.messageRequired"));
      return;
    }

    if (!user) {
      Alert.alert(t("common.error"), t("support.loginRequired"));
      return;
    }

    const sanitized = normalizePhoneInput(phoneNumber);
    const validation = validatePhoneNumber(sanitized);

    setPhoneError(validation);
    if (validation) return;

    setIsSubmitting(true);

    try {
      const randomSegment = (len) =>
        Array.from({ length: len }, () =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))
        ).join("");

      const ticketId = `TCK-${randomSegment(8)}-${randomSegment(5)}`;
      const verdict = await moderateMessage(message);

      if (!verdict.allowed) {
        Alert.alert(t("common.error"), verdict.reason);
        return;
      }

      const userName =
        user?.name || user?.username || user?.displayName || user?.email?.split("@")?.[0] || "User";

      await addDoc(supportCollection, {
        uid: user.uid,
        userId: user.uid,
        userEmail: user.email || null,
        userName,
        ticketId,
        phoneNumber: sanitized,
        topic,
        category: topic,
        subject: message.trim().slice(0, 80) || "Support request",
        description: message.trim(),
        source: "mobile_app",
        channel: "mobile",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const resetPhone = normalizePhoneInput(user?.phone || "");

      setMessage("");
      setPhoneNumber(resetPhone);
      setPhoneError(validatePhoneNumber(resetPhone));

      Alert.alert(t("common.success"), t("support.messageSent"));
    } catch (error) {
      Alert.alert(t("common.error"), error.message || t("support.messageError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, writingDirection: isRTL ? "rtl" : "ltr" },
      ]}
    >
      <View style={[styles.topBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconBtn, { backgroundColor: colors.card, shadowColor: shadow.color }]}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: colors.text, textAlign: "center", flex: 1 }]}>
          {t("support.title")}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { writingDirection: isRTL ? "rtl" : "ltr" }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroIcon,
            {
              backgroundColor: isDark ? "rgba(11,163,77,0.25)" : "rgba(11,163,77,0.14)",
            },
          ]}
        >
          <Ionicons name="mail-outline" size={26} color={colors.primary} />
        </View>

        <Text
          style={[styles.headerTitle, { color: colors.text, textAlign: isRTL ? "right" : "center" }]}
        >
          {t("support.title")}
        </Text>

        <Text
          style={[
            styles.headerSubtitle,
            { color: colors.textMuted, textAlign: isRTL ? "right" : "center" },
          ]}
        >
          {t("support.subtitle")}
        </Text>

        {/* CARD */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              shadowColor: shadow.color,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.formHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, textAlign: isRTL ? "right" : "left", flex: 1 },
              ]}
            >
              {t("support.title")}
            </Text>

            <TouchableOpacity
              onPress={() => setTopicPickerOpen(true)}
              style={[
                styles.topicBtn,
                { backgroundColor: isDark ? "#123d23" : "rgba(11,163,77,0.08)" },
              ]}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text
                style={[
                  styles.topicBtnText,
                  { color: colors.primary, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("support.topic")}: {currentTopicLabel}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.label, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}
          >
            {t("support.phoneNumber")} *
          </Text>

          <TextInput
            value={phoneNumber}
            onChangeText={(v) => {
              const sanitized = normalizePhoneInput(v);
              setPhoneNumber(sanitized);
              setPhoneError(validatePhoneNumber(sanitized));
            }}
            onBlur={() => setPhoneError(validatePhoneNumber(phoneNumber))}
            keyboardType="phone-pad"
            maxLength={11}
            placeholder={t("support.phonePlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: phoneError ? colors.danger : colors.border,
                color: colors.text,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          />

          {phoneError ? (
            <Text
              style={[
                styles.errorText,
                { color: colors.danger, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {phoneError}
            </Text>
          ) : (
            <Text
              style={[
                styles.helperText,
                { color: colors.textMuted, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("support.phoneRequired")}
            </Text>
          )}

          <Text
            style={[styles.label, { color: colors.text, textAlign: isRTL ? "right" : "left" }]}
          >
            {t("support.message")}
          </Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            placeholder={t("support.placeholder")}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                height: 120,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                textAlignVertical: "top",
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          />

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting ? 0.7 : 1,
              },
            ]}
            onPress={submitSupport}
            disabled={isSubmitting}
          >
            <Text style={[styles.primaryText, { color: colors.surface }]}>
              {isSubmitting ? t("support.sending") : t("support.sendMessage")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={topicPickerOpen} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setTopicPickerOpen(false)} />

        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              shadowColor: shadow.color,
            },
          ]}
        >
          {topics.map((tpc) => (
            <TouchableOpacity
              key={tpc.key}
              style={[styles.modalItem, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => {
                setTopic(tpc.key);
                setTopicPickerOpen(false);
              }}
            >
              <Text style={[styles.modalText, { color: colors.text }]}>{tpc.label}</Text>
              {topic === tpc.key && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  topTitle: { fontSize: 16, fontWeight: "800" },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },

  heroIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
  },

  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    paddingHorizontal: 10,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 12,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },

  sectionTitle: { fontSize: 15, fontWeight: "800" },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  errorText: { fontSize: 12, marginTop: 4 },
  helperText: { fontSize: 12, marginTop: 4 },

  primaryBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryText: { fontWeight: "800" },

  topicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  topicBtnText: { fontSize: 13, fontWeight: "700" },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  modalSheet: {
    position: "absolute",
    left: 20,
    right: 20,
    top: Platform.select({ ios: 140, android: 120 }),
    borderRadius: 14,
    paddingVertical: 8,
    elevation: 8,
  },

  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  modalText: { fontSize: 14, fontWeight: "700" },
});
