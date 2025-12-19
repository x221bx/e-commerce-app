import React, { forwardRef, useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UseTheme } from "../../theme/ThemeProvider";

const Input = (
  {
    label,
    icon,
    error,
    value = "",
    onChangeText,
    placeholder = "Type something...",
    secureTextEntry = false,
    keyboardType = "default",
    editable = true,
    ...props
  },
  ref
) => {
  const [focused, setFocused] = useState(false);
  const { theme } = UseTheme();
  const isDark = theme === "dark";

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, isDark ? styles.labelDark : styles.labelLight]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          isDark ? styles.inputRowDark : styles.inputRowLight,
          error && styles.errorBorder,
          focused && !error && styles.focused,
          !editable && styles.disabled,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={16}
            color={isDark ? "#B8E4E6" : "#10B981"}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#A5F3FC88" : "#94A3B8"}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => editable && setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            isDark ? styles.inputDark : styles.inputLight,
            !editable && styles.inputDisabled,
          ]}
          {...props}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default forwardRef(Input);

const styles = StyleSheet.create({
  wrapper: { width: "100%", marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  labelLight: { color: "#1F2937" },
  labelDark: { color: "#CFFAFE" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 46,
  },
  inputRowLight: { backgroundColor: "#fff", borderColor: "#E2E8F0" },
  inputRowDark: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "#334155" },
  focused: { borderColor: "#10B981" },
  errorBorder: { borderColor: "#EF4444" },
  disabled: { opacity: 0.6 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14 },
  inputLight: { color: "#0F172A" },
  inputDark: { color: "#F8FAFC" },
  inputDisabled: { color: "#94A3B8" },
  errorText: { marginTop: 4, fontSize: 12, color: "#DC2626", fontWeight: "600" },
});
