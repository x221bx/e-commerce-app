import React, { useEffect, useMemo } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AuthLayout from "../Authcomponents/AuthLayout";
import InputField from "../Authcomponents/InputField";
import PasswordField from "../Authcomponents/PasswordField";
import AuthActions from "../Authcomponents/AuthActions";
import {
  signInWithIdentifier,
  clearAuthError,
  selectCurrentUser,
  resetPassword,
} from "../features/auth/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();

  const LoginSchema = useMemo(
    () =>
      Yup.object({
        identifier: Yup.string()
          .required(t("auth.required", "Required"))
          .test("email-or-username", t("auth.invalid_email", "Invalid email format"), (value) => {
            if (value && value.includes("@")) {
              return Yup.string().email().isValidSync(value);
            }
            return true;
          }),
        password: Yup.string()
          .min(6, t("auth.too_short", "Too short"))
          .required(t("auth.required", "Required")),
      }),
    [t]
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "Home" } }],
      });
    }
  }, [user, navigation]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    const resultAction = await dispatch(signInWithIdentifier(values));
    setSubmitting(false);

    if (signInWithIdentifier.fulfilled.match(resultAction)) return;

    if (signInWithIdentifier.rejected.match(resultAction)) {
      const err = resultAction.payload;
      if (err?.fieldErrors) {
        Object.entries(err.fieldErrors).forEach(([key, msg]) => {
          setFieldError(key, msg);
        });
      }
      Alert.alert(t("common.error", "Error"), err?.message || t("auth.login_failed", "Login failed."));
    }
  };

  const handleForgotPassword = async (identifier) => {
    const value = identifier?.trim();
    if (!value) {
      Alert.alert(t("common.error", "Error"), t("auth.email_required", "Enter your email to reset password."));
      return;
    }
    const resultAction = await dispatch(resetPassword(value));
    if (resetPassword.fulfilled.match(resultAction)) {
      Alert.alert(
        t("auth.reset_sent_title", "Reset email sent"),
        t("auth.reset_sent_desc", "Check your inbox for a reset link.")
      );
    } else {
      const err = resultAction.payload;
      Alert.alert(t("common.error", "Error"), err?.message || t("auth.reset_failed", "Couldn't send reset email."));
    }
  };

  return (
    <AuthLayout
      title={t("auth.loginTitle", "Sign in to your account")}
      subtitle={t("auth.loginSubtitle", "Welcome back! Please login to continue.")}
    >
      <Formik
        initialValues={{ identifier: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting, values }) => (
          <View style={{ gap: 12 }}>
            <InputField
              name="identifier"
              label={t("auth.email_username", "Email or Username")}
              placeholder={t("auth.email_placeholder", "email@example.com")}
            />
            <PasswordField name="password" label={t("auth.password", "Password")} />
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity onPress={() => handleForgotPassword(values.identifier)}>
                <Text style={{ color: "#2F7E80", fontWeight: "700" }}>
                  {t("auth.forgot_password", "Forgot password?")}
                </Text>
              </TouchableOpacity>
            </View>
            <AuthActions
              mainLabel={t("auth.login", "Login")}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              secondaryText={t("auth.no_account", "Don't have an account?")}
              secondaryLabel={t("auth.register", "Create account")}
              onSecondaryPress={() => navigation.navigate("Register")}
            />
          </View>
        )}
      </Formik>
    </AuthLayout>
  );
}
