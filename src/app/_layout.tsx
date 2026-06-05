import { authClient } from "@/lib/auth-client";
import { ALLOWED_APP_ROLE, type AuthSession } from "@/service/auth";
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
  const authSession = session as AuthSession | null;
  const signedInRole = authSession?.user?.role?.toUpperCase?.() ?? null;
  const hasAuthorizedSession = !!session && signedInRole === ALLOWED_APP_ROLE;
  const hasUnauthorizedSession = !!session && signedInRole !== ALLOWED_APP_ROLE;

  useEffect(() => {
    if (!isPending) {
      void SplashScreen.hideAsync();
    }
  }, [isPending]);

  useEffect(() => {
    if (!hasUnauthorizedSession) {
      return;
    }

    void authClient.signOut().catch(() => {});
  }, [hasUnauthorizedSession]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View className="flex-1 bg-background">
          <Stack>
            <Stack.Protected guard={!hasAuthorizedSession}>
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                }}
              />
            </Stack.Protected>

            <Stack.Protected guard={hasAuthorizedSession}>
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
