import { authClient } from "@/lib/auth-client";
import { ThemeProvider } from "@/design-system/utils/theme";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      void SplashScreen.hideAsync();
    }
  }, [isPending]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View className="flex-1 bg-background">
          <Stack>
            <Stack.Protected guard={!session}>
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Protected>

            <Stack.Protected guard={!!session}>
              <Stack.Screen
                name="(app)"
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Protected>
          </Stack>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
