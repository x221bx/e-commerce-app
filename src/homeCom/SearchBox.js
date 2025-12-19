// src/components/SearchBox.js
import React from "react";
import { View } from "react-native";
import { Searchbar } from "react-native-paper";
import colors from "../constants/colors";
import { useTranslation } from "react-i18next";

const SearchBox = ({ search, setSearch }) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        marginVertical: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Searchbar
        placeholder={t("search_placeholder")}
        value={search}
        onChangeText={(text) => setSearch(text)}
        style={{
          backgroundColor: colors.white,
          borderRadius: 14,
          borderWidth: 1.2,
          borderColor: colors.secondary,
          height: 48,
        }}
        iconColor={colors.primary}
        inputStyle={{
          color: colors.text,
          fontSize: 15,
        }}
        placeholderTextColor={colors.grayText}
      />
    </View>
  );
};

export default SearchBox;
