import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../shared/hooks/useAuth";
import { SignInScreen } from "../features/auth/screens/SignInScreen";
import { ReintroductionHomeScreen } from "../features/reintroduction/screens/ReintroductionHomeScreen";
import { colors } from "../shared/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary500,
        tabBarInactiveTintColor: colors.neutral500,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Reintroduction"
        component={ReintroductionHomeScreen}
        options={{
          tabBarLabel: "Tests",
          tabBarAccessibilityLabel: "Reintroduction tests tab",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ReintroductionHomeScreen} // Placeholder
        options={{
          tabBarLabel: "Profile",
          tabBarAccessibilityLabel: "Profile tab",
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Ou um loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
