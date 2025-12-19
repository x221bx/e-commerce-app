// src/Authcomponents/PasswordField.native.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useField } from "formik";
import { Feather } from "@expo/vector-icons";

export default function PasswordField({
  name,
  label = "Password",
  placeholder,
  autoComplete = "password",
  size = "xl",
  ...rest
}) {
  const [field, meta, helpers] = useField(name);
  const [show, setShow] = useState(false);

  const sizeStyles = {
    md: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 15,
      borderRadius: 10,
    },
    lg: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 16,
      borderRadius: 14,
    },
    xl: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 17,
      borderRadius: 18,
    },
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>

      <View>
        <TextInput
          value={field.value}
          onChangeText={(v) => helpers.setValue(v)}
          onBlur={() => helpers.setTouched(true)}
          placeholder={placeholder}
          secureTextEntry={!show}
          autoComplete={autoComplete}
          style={[styles.input, sizeStyles[size]]}
          {...rest}
        />

        <TouchableOpacity
          onPress={() => setShow((s) => !s)}
          style={styles.iconBtn}
          accessibilityLabel={show ? "Hide password" : "Show password"}
        >
          <Feather name={show ? "eye-off" : "eye"} size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }}>
        {meta.touched && meta.error ? (
          <Text style={styles.error}>{meta.error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 15, color: "#1F2937", marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    paddingRight: 44,
    color: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  iconBtn: {
    position: "absolute",
    right: 10,
    top: 12,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  error: { color: "#DC2626", fontSize: 12, marginTop: 4 },
});
