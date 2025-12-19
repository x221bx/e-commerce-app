// src/navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../screens/Login";
import Register from "../screens/Register";
import Reset from "../screens/Reset";
import MainTabs from "./MainTabs";
import Cart from "../screens/Cart";
import Favorites from "../screens/Favorites";
import Notifications from "../screens/Notifications";
import Checkout from "../screens/Checkout";
import ProductDetails from "../screens/ProductDetails";
import ArticleDetails from "../screens/ArticleDetails";
import Orders from "../screens/Orders";
import Invoice from "../screens/Invoice";
import ProfilePreferences from "../screens/ProfilePreferences";

import OrdersList from "../screens/OrdersList";
import Support from "../screens/Support";
import MyInquiries from "../screens/MyInquiries";
import FavoriteArticles from "../screens/FavoriteArticles";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Reset" component={Reset} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Favorites" component={Favorites} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Checkout" component={Checkout} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} />
      <Stack.Screen name="ArticleDetails" component={ArticleDetails} />
      <Stack.Screen name="OrdersList" component={OrdersList} />
      <Stack.Screen name="Orders" component={Orders} />
      <Stack.Screen name="Invoice" component={Invoice} />
      <Stack.Screen name="ProfilePreferences" component={ProfilePreferences} />

      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="MyInquiries" component={MyInquiries} />
      <Stack.Screen name="FavoriteArticles" component={FavoriteArticles} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
