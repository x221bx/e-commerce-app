// src/navigation/MainTabs.js
import React, { useMemo, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/useTheme";

import Home from "../screens/Home";
import ProductsScreen from "../screens/Product";
import ArticlesScreen from "../screens/Articles";
import ProfileScreen from "../screens/Profile";
import DeliveryDashboard from "../screens/DeliveryDashboard";

const Tab = createBottomTabNavigator();

const LoginRedirect = () => {
  const navigation = useNavigation();
  useEffect(() => {
    const parentNav = navigation.getParent?.();
    parentNav?.navigate("Login");
  }, [navigation]);
  return null;
};


export default function MainTabs() {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const { colors } = useTheme();
  const isDelivery = user?.role === "delivery" || user?.isDelivery;

  const accountScreen = useMemo(() => {
    if (user) {
      return (
        <Tab.Screen
          key="Account"
          name="Account"
          component={ProfileScreen}
          options={{ tabBarLabel: t("navbar.account", "Account") }}
        />
      );
    }
    return (
      <Tab.Screen
        key="Login"
        name="Login"
        component={LoginRedirect}
        options={{ tabBarLabel: t("auth.login", "Login") }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            const parentNav = navigation.getParent?.();
            parentNav?.navigate("Login");
          },
        })}
      />
    );
  }, [user, t]);

  const screenOptions = ({ route }) => ({
    headerShown: false,
    tabBarShowLabel: true,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: {
      height: 65,
      paddingBottom: 8,
      paddingTop: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      borderTopColor: colors.border,
      elevation: 5,
    },
    tabBarIcon: ({ focused, color }) => {
      let iconName;
      switch (route.name) {
        case "Home":
          iconName = focused ? "home" : "home-outline";
          break;
        case "Shop":
          iconName = focused ? "cart" : "cart-outline";
          break;
        case "Articles":
          iconName = focused ? "book" : "book-outline";
          break;
        case "Account":
          iconName = focused ? "person" : "person-outline";
          break;
        case "Login":
          iconName = focused ? "log-in" : "log-in-outline";
          break;
        case "Delivery":
          iconName = focused ? "bicycle" : "bicycle-outline";
          break;
      }
      return <Icon name={iconName} size={24} color={color} />;
    },
  });

  if (isDelivery) {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Delivery"
          component={DeliveryDashboard}
          options={{ tabBarLabel: t("delivery.tab", "Deliveries") }}
        />
        <Tab.Screen
          name="Account"
          component={ProfileScreen}
          options={{ tabBarLabel: t("navbar.account", "Account") }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{ tabBarLabel: t("navbar.home", "Home") }}
      />
      <Tab.Screen
        name="Shop"
        component={ProductsScreen}
        options={{ tabBarLabel: t("navbar.products", "Products") }}
      />
      <Tab.Screen
        name="Articles"
        component={ArticlesScreen}
        options={{ tabBarLabel: t("navbar.articles", "Articles") }}
      />
      {accountScreen}
    </Tab.Navigator>
  );
}
