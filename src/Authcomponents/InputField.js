// src/Authcomponents/InputField.native.jsx
import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useField } from "formik";

export default function InputField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  as,
  children,
  size = "xl", // 'md' | 'lg' | 'xl'
  keyboardType,
  ...rest
}) {
  const [field, meta, helpers] = useField(name);

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
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        value={field.value}
        onChangeText={(v) => helpers.setValue(v)}
        onBlur={() => helpers.setTouched(true)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        style={[styles.input, sizeStyles[size]]}
        secureTextEntry={type === "password"}
        {...rest}
      >
        {children}
      </TextInput>

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
    color: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  error: { color: "#DC2626", fontSize: 12, marginTop: 4 },
});
