import { useAuth } from "@/context/auth-context";
import { SocketProvider } from "@/context/socket-context";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import Toast from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat/[roomId]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <AuthProvider>
      <SocketProvider>
        <RootNavigator />
        <StatusBar style="auto" />
        <Toast />
      </SocketProvider>
    </AuthProvider>
  );
}
