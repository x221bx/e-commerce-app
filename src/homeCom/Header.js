import React from "react";
import { View } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import colors from "../constants/colors";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";

const Header = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const profile = user?.profile || user;
  const isRTL = i18n.language === "ar";

  const avatarUrl =
    profile?.photoURL ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <View
      style={{
        flexDirection: isRTL ? "row-reverse" : "row",
        alignItems: "center",
        marginBottom: 20,
        marginTop: 50,
      }}
    >
      <Avatar.Image size={45} source={{ uri: avatarUrl }} />

      <View style={{ marginHorizontal: 10 }}>
        <Text
          variant="titleMedium"
          style={{
            color: colors.text,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("discover_the_best")}
        </Text>

        <Text
          variant="titleMedium"
          style={{
            color: colors.primary,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {t("furniture")}
        </Text>
      </View>
    </View>
  );
};

export default Header;
