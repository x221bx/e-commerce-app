// screens/Auth/ResetPassword.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import AuthLayout from "../Authcomponents/AuthLayout";
import InputField from "../Authcomponents/InputField";
import AuthActions from "../Authcomponents/AuthActions";

import { resetPassword, clearAuthError } from "../features/auth/authSlice";

const ResetSchema = Yup.object({
  emailOrUsername: Yup.string().required("Required"),
});

export default function ResetPassword() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [serverMsg, setServerMsg] = useState("");

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="We will send you a reset link."
    >
      {serverMsg ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{serverMsg}</Text>
        </View>
      ) : null}

      <Formik
        initialValues={{ emailOrUsername: "" }}
        validationSchema={ResetSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const result = await dispatch(resetPassword(values.emailOrUsername));
          setSubmitting(false);

          if (resetPassword.fulfilled.match(result)) {
            setServerMsg("If the account exists, a reset email has been sent.");
          } else {
            const err = result.payload;
            Alert.alert("Error", err?.message || "Something went wrong");
          }
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <View style={styles.form}>
            <InputField
              name="emailOrUsername"
              label="Email or Username"
              placeholder="email@example.com or username"
            />

            <AuthActions
              onPress={handleSubmit}
              isLoading={isSubmitting}
              mainLabel="Send email"
              secondaryText="Back to"
              secondaryLabel="Login"
              onSecondaryPress={() => navigation.navigate("Login")}
            />
          </View>
        )}
      </Formik>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 24 },
  successBox: {
    backgroundColor: "rgba(212, 237, 218, 0.7)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: "#155724",
    textAlign: "center",
    fontSize: 14,
  },
});
