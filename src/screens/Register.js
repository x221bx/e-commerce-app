// screens/Auth/Register.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Alert } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import AuthLayout from "../Authcomponents/AuthLayout";
import InputField from "../Authcomponents/InputField";
import PasswordField from "../Authcomponents/PasswordField";
import AuthActions from "../Authcomponents/AuthActions";

import { signUp, clearAuthError } from "../features/auth/authSlice";

export default function Register() {
  const [serverMsg, setServerMsg] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const SignupSchema = useMemo(
    () =>
      Yup.object({
        name: Yup.string()
          .min(2, t("auth.too_short", "Too short"))
          .matches(/^[A-Za-z\u0600-\u06FF\s]+$/, t("auth.name_only", "Letters only"))
          .required(t("auth.required", "Required")),
        email: Yup.string().email(t("auth.invalid_email", "Invalid email format")).required(t("auth.required", "Required")),
        username: Yup.string()
          .min(3, t("auth.too_short", "Too short"))
          .required(t("auth.required", "Required")),
        password: Yup.string()
          .min(6, t("auth.too_short", "Too short"))
          .required(t("auth.required", "Required")),
        confirm: Yup.string()
          .oneOf([Yup.ref("password")], t("auth.password_mismatch", "Passwords must match"))
          .required(t("auth.required", "Required")),
      }),
    [t]
  );

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    setServerMsg(null);
    const { confirm, ...payload } = values;

    const resultAction = await dispatch(signUp(payload));
    setSubmitting(false);

    if (signUp.rejected.match(resultAction)) {
      const err = resultAction.payload;
      if (err?.fieldErrors) {
        Object.entries(err.fieldErrors).forEach(([k, msg]) =>
          setFieldError(k, msg)
        );
      }
      const msg = err?.message || t("auth.signup_failed", "Signup failed.");
      setServerMsg(msg);
      Alert.alert(t("common.error", "Error"), msg);
      return;
    }

    setServerMsg(t("auth.signup_success", "Account created!"));
    setTimeout(() => navigation.replace("Login"), 1500);
  };

  return (
    <AuthLayout
      title={t("auth.registerTitle", "Create your account")}
      subtitle={t("auth.registerSubtitle", "Join us today!")}
    >
      {serverMsg && (
        <Text style={{ textAlign: "center", color: "#0BA34D", marginBottom: 8 }}>
          {serverMsg}
        </Text>
      )}
      <Formik
        initialValues={{ name: "", email: "", username: "", password: "", confirm: "" }}
        validationSchema={SignupSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <View style={{ gap: 12 }}>
            <InputField
              name="name"
              label={t("auth.fullName", "Full name")}
              placeholder={t("auth.name_placeholder", "John Doe")}
            />
            <InputField
              name="email"
              label={t("auth.email", "Email")}
              placeholder={t("auth.email_placeholder", "email@example.com")}
            />
            <InputField
              name="username"
              label={t("auth.username", "Username")}
              placeholder={t("auth.username_placeholder", "username")}
            />
            <PasswordField name="password" label={t("auth.password", "Password")} />
            <PasswordField name="confirm" label={t("auth.confirm", "Confirm password")} />
            <AuthActions
              mainLabel={t("auth.register", "Create account")}
              onPress={handleSubmit}
              isLoading={isSubmitting}
              secondaryText={t("auth.have_account", "Already have an account?")}
              secondaryLabel={t("auth.login", "Login")}
              onSecondaryPress={() => navigation.navigate("Login")}
            />
          </View>
        )}
      </Formik>
    </AuthLayout>
  );
}
