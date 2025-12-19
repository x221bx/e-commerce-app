import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import PaymentMethodsList from "../components/payment/PaymentMethodsList";
import CardForm from "../components/payment/CardForm";
import CardPreview from "../components/payment/CardPreview";
import { useCardValidation } from "../hooks/useCardValidation";
 
export default function PaymentMethods() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [methods, setMethods] = useState(seedMethods);
  const [loading, setLoading] = useState(false);

  const cardValidation = useCardValidation();
  const defaultMethod = useMemo(() => methods.find((m) => m.isDefault), [methods]);

  const handleDelete = (id) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSetDefault = (id) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
  };

  const handleAddCard = () => {
    if (!cardValidation.validateCard(t)) return;
    setLoading(true);
    setTimeout(() => {
      const brand = cardValidation.detectBrand(cardValidation.cardForm.number) || "card";
      const newCard = {
        id: Date.now().toString(),
        type: "card",
        brand,
        last4: cardValidation.cardForm.number.slice(-4),
        nickname: cardValidation.cardForm.nickname || "New card",
        isDefault: methods.length === 0,
      };
      setMethods((prev) => [...prev, newCard]);
      cardValidation.resetCard();
      setLoading(false);
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Billing & wallets</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>
            Manage cards and wallets used for faster checkout.
          </Text>
          <Text style={styles.defaultText}>
            Default: {defaultMethod ? renderLabel(defaultMethod) : "None"}
          </Text>
        </View>

        <PaymentMethodsList
          methods={methods}
          loading={loading}
          onDelete={(m) => handleDelete(m.id)}
          onSetDefault={(m) => handleSetDefault(m.id)}
          isDark={false}
          t={t}
        />

        <CardPreview
          brand={cardValidation.detectBrand(cardValidation.cardForm.number)}
          number={cardValidation.cardForm.number}
          holder={cardValidation.cardForm.holder}
          exp={cardValidation.cardForm.exp}
          isDefault={methods.length === 0}
          t={t}
          isDark={false}
        />

        <CardForm
          cardValidation={cardValidation}
          onSubmit={handleAddCard}
          isLoading={loading}
          isDark={false}
        />

        <View style={[styles.card, styles.securityCard]}>
          <Text style={styles.title}>Security</Text>
          <Text style={styles.subtitle}>We only store the last 4 digits; full number and CVV are never saved.</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert("Info", "Your payment data is tokenized and encrypted.")}>
            <Text style={styles.secondaryText}>More about security</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const renderLabel = (method) => {
  if (method.type === "card") return `Visa **** ${method.last4}`;
  if (method.type === "wallet") return `${method.provider || "Wallet"} (${method.email})`;
  return "Method";
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FB" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  securityCard: { borderWidth: 1, borderColor: "rgba(16,185,129,0.18)" },
  title: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 6, marginBottom: 10, lineHeight: 18 },
  defaultText: { fontSize: 13, color: "#0F172A", fontWeight: "700" },
  secondaryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0BA34D",
    alignItems: "center",
  },
  secondaryText: { color: "#0BA34D", fontWeight: "800" },
});
