// src/screens/ProfilePreferences.js
// --------------------------------------------------------------
// Profile Preferences Screen
// - Update username, email, phone, and personal data
// - Update password (current + new)
// - Firebase validation and Firestore updates
// - NO UI or Logic changes — formatting only
// --------------------------------------------------------------

import React, {
  useEffect,
  useMemo,
  useState,
  memo
} from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { auth } from "../services/firebase";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { selectCurrentUser, setCurrentUser } from "../features/auth/authSlice";
import { db } from "../services/firebase";
import { useTheme } from "../theme/useTheme";

// --------------------------------------------------------------
// Component
// --------------------------------------------------------------
export default function ProfilePreferences() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { colors, shadow } = useTheme();

  // ---------------------------
  // Form states
  // ---------------------------
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    currentPassword: "",
    nextPassword: "",
    confirmPassword: "",
  });

  // ---------------------------
  // Load user data on mount
  // ---------------------------
  useEffect(() => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setFirstName(user?.firstName || user?.name?.split?.(" ")?.[0] || "");
    setLastName(user?.lastName || user?.name?.split?.(" ")?.slice(1).join(" ") || "");
    setPhone(user?.phone || "");
    setLocation(user?.location || "");
  }, [user]);

  // ---------------------------
  // Validations
  // ---------------------------
  const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val.trim());
  const isValidName = (val) => /^[\p{L}\s]+$/u.test(val.trim());
  const isValidEgyptPhone = (val) => /^01[0125][0-9]{8}$/.test(val.trim());

  const usernameErrorText = t("auth.username_invalid", "Username must be at least 3 characters.");
  const emailErrorText = t("auth.invalid_email", "Invalid email address.");
  const firstNameErrorText = t("account.first_name_invalid", "First name must be letters only.");
  const lastNameErrorText = t("account.last_name_invalid", "Last name must be letters only.");
  const phoneErrorText = t("support.phoneInvalid", "Enter a valid Egyptian mobile.");
  const currentPassErrorText = t("auth.current_password_required", "Enter your current password.");
  const nextPassErrorText = t("auth.weak_password", "Password must be 8+ characters.");
  const samePassErrorText = t("auth.password_same", "New password must be different.");
  const mismatchPassErrorText = t("auth.password_mismatch", "Passwords must match.");

  // --------------------------------------------------------------
  // Save Profile Data
  // --------------------------------------------------------------
  const handleSave = async () => {
    setErrors({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      currentPassword: "",
      nextPassword: "",
      confirmPassword: "",
    });

    if (!user?.uid) {
      Alert.alert(t("common.error"), t("auth.not_logged_in"));
      return;
    }

    const cleanUsername = username.trim().replace(/\s+/g, "");
    const cleanEmail = email.trim();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 11);
    const cleanLocation = location.trim();

    if (cleanUsername.length < 3) {
      setErrors((e) => ({ ...e, username: usernameErrorText }));
      Alert.alert(t("common.error"), usernameErrorText);
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrors((e) => ({ ...e, email: emailErrorText }));
      Alert.alert(t("common.error"), emailErrorText);
      return;
    }

    if (!isValidName(cleanFirst)) {
      setErrors((e) => ({ ...e, firstName: firstNameErrorText }));
      Alert.alert(t("common.error"), firstNameErrorText);
      return;
    }

    if (!isValidName(cleanLast)) {
      setErrors((e) => ({ ...e, lastName: lastNameErrorText }));
      Alert.alert(t("common.error"), lastNameErrorText);
      return;
    }

    if (!isValidEgyptPhone(cleanPhone)) {
      setErrors((e) => ({ ...e, phone: phoneErrorText }));
      Alert.alert(t("common.error"), phoneErrorText);
      return;
    }

    try {
      setSaving(true);

      // Ensure unique username
      const q = query(collection(db, "users"), where("username", "==", cleanUsername));
      const snap = await getDocs(q);
      const taken = snap.docs.find((d) => d.id !== user.uid);

      if (taken) {
        Alert.alert(t("common.error"), t("auth.username_taken"));
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        username: cleanUsername,
        email: cleanEmail,
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
        location: cleanLocation,
        contact: {
          phone: cleanPhone,
          location: cleanLocation,
          email: cleanEmail,
        },
        updatedAt: serverTimestamp(),
      });

      dispatch(
        setCurrentUser({
          ...user,
          username: cleanUsername,
          email: cleanEmail,
          firstName: cleanFirst,
          lastName: cleanLast,
          phone: cleanPhone,
          location: cleanLocation,
          contact: {
            email: cleanEmail,
            phone: cleanPhone,
            location: cleanLocation,
          },
        })
      );
      Alert.alert(t("account.saved"), t("account.profile_saved"));

    } catch (err) {
      Alert.alert(t("common.error"), t("account.save_failed"));
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------
  // Update Password
  // --------------------------------------------------------------
  const handlePasswordUpdate = async () => {
    const userAcc = auth.currentUser;
    const emailToUse = userAcc?.email || email;

    setErrors((e) => ({
      ...e,
      currentPassword: "",
      nextPassword: "",
      confirmPassword: "",
    }));

    if (!emailToUse || !userAcc) {
      Alert.alert(t("common.error"), t("auth.not_logged_in"));
      return;
    }

    if (!currentPassword) {
      setErrors((e) => ({ ...e, currentPassword: currentPassErrorText }));
      Alert.alert(t("common.error"), currentPassErrorText);
      return;
    }

    if (!nextPassword || nextPassword.length < 8) {
      setErrors((e) => ({ ...e, nextPassword: nextPassErrorText }));
      Alert.alert(t("common.error"), nextPassErrorText);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setErrors((e) => ({ ...e, confirmPassword: mismatchPassErrorText }));
      Alert.alert(t("common.error"), mismatchPassErrorText);
      return;
    }

    if (currentPassword === nextPassword) {
      setErrors((e) => ({ ...e, nextPassword: samePassErrorText }));
      Alert.alert(t("common.error"), samePassErrorText);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(emailToUse, currentPassword);
      await reauthenticateWithCredential(userAcc, credential);
      await updatePassword(userAcc, nextPassword);

      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");

      Alert.alert(t("auth.password_updated"), t("auth.password_updated_desc"));

    } catch (error) {
      let message = t("auth.update_failed");

      if (error?.code === "auth/wrong-password") message = t("auth.current_password_incorrect");
      if (error?.code === "auth/weak-password") message = t("auth.weak_password");
      if (error?.code === "auth/too-many-requests") message = t("auth.too_many_requests");

      Alert.alert(t("common.error"), message);
    }
  };

  // --------------------------------------------------------------
  // Forgot Password
  // --------------------------------------------------------------
  const handleForgotPassword = async () => {
    const emailToUse = auth.currentUser?.email || email;

    if (!emailToUse) {
      Alert.alert(t("common.error"), t("auth.email_required"));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      Alert.alert(t("auth.reset_sent_title"), t("auth.reset_sent_desc"));
    } catch (error) {
      let message = t("auth.reset_failed");
      if (error?.code === "auth/user-not-found") message = t("auth.user_not_found");

      Alert.alert(t("common.error"), message);
    }
  };

  const handleDelete = () =>
    Alert.alert(
      t("account.delete_title", "Delete account?"),
      t(
        "account.delete_desc",
        "This will remove your profile and cancel any active orders. This action cannot be undone."
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("account.delete_confirm", "Delete account"),
          style: "destructive",
          onPress: () => {},
        },
      ]
    );

  // --------------------------------------------------------------
  // Field Component (memoized)
  // --------------------------------------------------------------
  const Field = useMemo(
    () =>
      memo(function Field({
        label,
        value,
        onChangeText,
        secure,
        placeholder,
        error,
        keyboardType,
        maxLength,
      }) {
        return (
          <View style={styles.field}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text },
                error && styles.errorText,
              ]}
            >
              {label}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
                error && { borderColor: colors.danger },
              ]}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={secure}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              maxLength={maxLength}
            />

            {error && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            )}
          </View>
        );
      }),
    [colors]
  );

  // --------------------------------------------------------------
  // UI Layout
  // --------------------------------------------------------------
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: colors.text }]}>
          {t("account.profile_preferences", "Profile & Preferences")}
        </Text>

        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Personal Info */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              shadowColor: shadow.color,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              shadowOffset: shadow.offset,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("account.personal_info")}
          </Text>

          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {t("account.personal_info_desc")}
          </Text>

          <Field
            label={t("account.username")}
            value={username}
            error={errors.username}
            onChangeText={(v) => {
              setUsername(v);
              const trimmed = v.trim();
              setErrors((e) => ({
                ...e,
                username: trimmed.length >= 3 ? "" : usernameErrorText,
              }));
            }}
          />

          <Field
            label={t("account.email")}
            value={email}
            error={errors.email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({
                ...e,
                email: isValidEmail(v) ? "" : emailErrorText,
              }));
            }}
          />

          <Field
            label={t("account.first_name")}
            value={firstName}
            error={errors.firstName}
            onChangeText={(v) => {
              setFirstName(v);
              setErrors((e) => ({
                ...e,
                firstName: isValidName(v) ? "" : firstNameErrorText,
              }));
            }}
          />

          <Field
            label={t("account.last_name")}
            value={lastName}
            error={errors.lastName}
            onChangeText={(v) => {
              setLastName(v);
              setErrors((e) => ({
                ...e,
                lastName: isValidName(v) ? "" : lastNameErrorText,
              }));
            }}
          />

          <Field
            label={t("account.phone")}
            value={phone}
            error={errors.phone}
            keyboardType="phone-pad"
            maxLength={11}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 11);
              setPhone(digits);
              setErrors((e) => ({
                ...e,
                phone: digits.length === 11 ? "" : phoneErrorText,
              }));
            }}
          />

          <Field
            label={t("account.location")}
            value={location}
            onChangeText={setLocation}
            placeholder={t("account.location_placeholder")}
          />

          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            {t("account.saved_hint")}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.chipText, { color: colors.surface }]}>
                {saving ? t("account.saving") : t("common.save_profile")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              shadowColor: shadow.color,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              shadowOffset: shadow.offset,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t("account.security")}
          </Text>

          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {t("account.security_desc")}
          </Text>

          <Field
            label={t("auth.current_password")}
            secure
            value={currentPassword}
            error={errors.currentPassword}
            onChangeText={(v) => {
              setCurrentPassword(v);
              setErrors((e) => ({
                ...e,
                currentPassword: v ? "" : currentPassErrorText,
              }));
            }}
          />

          <Field
            label={t("auth.new_password")}
            secure
            value={nextPassword}
            error={errors.nextPassword}
            onChangeText={(v) => {
              setNextPassword(v);
              const err =
                v && v.length >= 8
                  ? currentPassword === v
                    ? samePassErrorText
                    : ""
                  : nextPassErrorText;
              setErrors((e) => ({
                ...e,
                nextPassword: v ? err : nextPassErrorText,
              }));
            }}
          />

          <Field
            label={t("auth.confirm_new_password")}
            secure
            value={confirmPassword}
            error={errors.confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              setErrors((e) => ({
                ...e,
                confirmPassword: v === nextPassword ? "" : mismatchPassErrorText,
              }));
            }}
          />

          <Text style={[styles.helpText, { color: colors.textMuted }]}>
            {t("auth.password_tip")}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.chip,
                { backgroundColor: colors.surfaceMuted },
              ]}
              onPress={handleForgotPassword}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>
                {t("auth.forgot_password")}
              </Text>
            </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.primary }]}
            onPress={handlePasswordUpdate}
          >
            <Text style={[styles.chipText, { color: colors.surface }]}>
              {t("auth.update_password")}
            </Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Delete Account */}
        <View
          style={[
            styles.card,
            styles.cardDanger,
            { backgroundColor: colors.card, borderColor: colors.danger },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.danger }]}>
            {t("account.delete_title")}
          </Text>

          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {t("account.delete_desc")}
          </Text>

          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            {t("account.delete_desc_more")}
          </Text>

          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.danger }]}
            onPress={handleDelete}
          >
            <Text style={[styles.deleteText, { color: colors.surface }]}>
              {t("account.delete_confirm")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------------------------
// Styles
// --------------------------------------------------------------
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
  },

  topTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },

  card: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },

  cardDanger: {
    borderWidth: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  cardSubtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },

  field: {
    marginTop: 12,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },

  helpText: {
    marginTop: 8,
    fontSize: 12,
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  chipText: {
    fontWeight: "800",
    fontSize: 13,
  },

  deleteBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteText: {
    fontWeight: "800",
  },
});
