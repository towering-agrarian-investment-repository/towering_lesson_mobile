import { ThemeProvider, useTheme } from "@/design-system";
import "@/i18n";
import { authClient } from "@/lib/auth-client";
import {
  ALLOWED_APP_ROLE,
  type AuthSession,
} from "@/service/auth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { VariableContextProvider } from "@/lib/react-native-css-variable-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { usePushNotification } from "@/lib/hook/shared/usePushNotification";

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

    void authClient.signOut().catch(() => { });
  }, [hasUnauthorizedSession]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedRoot hasAuthorizedSession={hasAuthorizedSession} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedRoot({
  hasAuthorizedSession,
}: {
  hasAuthorizedSession: boolean;
}) {
  const { colors, resolvedScheme } = useTheme();

  usePushNotification(hasAuthorizedSession);

  const themeVariables = useMemo(
    () => ({
      "--background": colors.background,
      "--foreground": colors.foreground,
      "--surface": colors.surface,
      "--card": colors.card,
      "--border": colors.border,
      "--muted": colors.muted,
      "--muted-foreground": colors.mutedForeground,
      "--primary": colors.primary,
      "--primary-foreground": colors.primaryForeground,
      "--secondary": colors.secondary,
      "--secondary-foreground": colors.secondaryForeground,
      "--danger": colors.danger,
      "--success": colors.success,
      "--warning": colors.warning,
      "--ticket-bay": colors.ticketBay,
      "--ticket-private": colors.ticketPrivate,
      "--ticket-group": colors.ticketGroup,
      "--ticket-program": colors.ticketProgram,
      "--ticket-default": colors.ticketDefault,
      "--notification": colors.notification,
      "--bg-btn-main-start": colors.btnMainStart,
      "--bg-btn-main-end": colors.btnMainEnd,
      "--bg-btn-main-pressed-start": colors.btnMainPressedStart,
      "--bg-btn-main-pressed-end": colors.btnMainPressedEnd,
    }),
    [colors],
  );

  return (
    <>
      <VariableContextProvider value={themeVariables}>
        <View className="flex-1 bg-background">
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              animationDuration: 180,
            }}
          >
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
      </VariableContextProvider>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
    </>
  );
}
