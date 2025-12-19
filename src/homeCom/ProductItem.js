// src/components/ProductItem.js
import React from "react";
import { View, Image } from "react-native";
import { Card, Text, Chip } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { getLangKey, getLocalizedDescription, getLocalizedName } from "../utils/productLocalization";

export default function ProductItem({ item }) {
  const { i18n } = useTranslation();
  const langKey = getLangKey(i18n.language);
  const createdAt = item?.createdAt?.toDate?.() ? item.createdAt.toDate() : null;

  return (
    <Card
      style={{
        width: 400,
        height: 300,
        borderRadius: 16,
        overflow: "hidden",
      }}
      mode="elevated"
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: "100%",
            height: 150,
          }}
          resizeMode="cover"
        />
      ) : null}

      <Card.Content
        style={{
          flex: 1,
          paddingTop: 10,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 6 }}>
          <Text variant="titleMedium" style={{ fontWeight: "700" }}>
            {getLocalizedName(item, langKey)}
          </Text>
          <Text variant="bodyMedium" style={{ color: "#555" }} numberOfLines={2}>
            {getLocalizedDescription(item, langKey) || item.description}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip icon="cash">{Number(item.price).toFixed(2)}</Chip>
          <Chip icon="warehouse">Stock: {Number(item.stock)}</Chip>
          {createdAt ? <Chip icon="calendar">{createdAt.toLocaleDateString()}</Chip> : null}
        </View>
      </Card.Content>
    </Card>
  );
}
