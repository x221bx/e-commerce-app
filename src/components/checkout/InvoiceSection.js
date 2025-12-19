import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { getLangKey, getLocalizedName } from "../../utils/productLocalization";

export default function InvoiceSection({ cartItems, summary, colors, radius, shadow }) {
    const { i18n } = useTranslation();
    const langKey = getLangKey(i18n.language);
    return (
        <View
            style={[
                {
                    marginTop: 4,
                    padding: 12,
                    borderWidth: 1,
                    gap: 6,
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    shadowColor: shadow.color,
                    shadowOpacity: shadow.opacity,
                    shadowRadius: shadow.radius,
                    shadowOffset: shadow.offset,
                },
            ]}
        >
            <Text style={{ fontWeight: "800", fontSize: 14, marginBottom: 4, color: colors.success }}>Invoice</Text>
            {cartItems.map((item) => (
                <View key={item.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Text style={{ flex: 1, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                        {getLocalizedName(item, langKey)}
                    </Text>
                    <Text style={{ width: 32, textAlign: "right", color: colors.textMuted }}>x{item.quantity || 1}</Text>
                    <Text style={{ fontWeight: "700", width: 90, textAlign: "right", color: colors.text }}>
                        EGP {(item.price || 0).toFixed(2)}
                    </Text>
                </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, borderTopWidth: 1, paddingTop: 6 }}>
                <Text style={{ fontWeight: "800", fontSize: 15, color: colors.success }}>Total</Text>
                <Text style={{ fontWeight: "800", fontSize: 15, color: colors.success }}>EGP {summary.total.toFixed(2)}</Text>
            </View>
        </View>
    );
}
