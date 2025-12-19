import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export default function AuthActions({
  onPress,
  isLoading,
  mainLabel,
  secondaryText,
  secondaryLabel,
  onSecondaryPress,
}) {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        style={{
          backgroundColor: "#2F7E80",
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginVertical: 12,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {mainLabel}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ color: "#666" }}>{secondaryText} </Text>
        <TouchableOpacity onPress={onSecondaryPress}>
          <Text style={{ color: "#2F7E80", fontWeight: "bold" }}>
            {secondaryLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
