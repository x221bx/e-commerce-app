// App.js
import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "./src/i18n";
import { store } from "./src/redux/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { hydrateAuth } from "./src/features/auth/authSlice";
import { loadCart } from "./src/features/cart/cartSlice";
import { loadFavorites } from "./src/features/favorites/favoritesSlice";
import { selectCurrentUser } from "./src/features/auth/authSlice";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import ChatBot from "./src/components/Ai/ChatBot.jsx";
import Navbar from "./src/components/layout/Navbar";
import InAppNotifier from "./src/components/InAppNotifier";

const Stack = createNativeStackNavigator();

function Bootstrapper() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigationRef = useNavigationContainerRef();
  const [showBot, setShowBot] = useState(!(globalThis.__hideBot));
  const [currentRoute, setCurrentRoute] = useState();

  useEffect(() => {
    dispatch(hydrateAuth());
    dispatch(loadCart());
    dispatch(loadFavorites());
  }, [dispatch]);

  useEffect(() => {
    const listeners = (globalThis.__botToggleListeners = globalThis.__botToggleListeners || []);
    const handler = (val) => setShowBot(!val);
    listeners.push(handler);
    setShowBot(!(globalThis.__hideBot));
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
      onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}
    >
      {!["Login", "Register", "Reset"].includes(currentRoute) ? (
        <Navbar currentRoute={currentRoute} />
      ) : null}
      <InAppNotifier />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AppNavigator" component={AppNavigator} />
      </Stack.Navigator>
      {showBot && currentRoute !== "Delivery" && !(user?.role === "delivery" || user?.isDelivery) ? (
        <ChatBot />
      ) : null}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Bootstrapper />
      </ThemeProvider>
    </Provider>
  );
}
