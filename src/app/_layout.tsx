import { ThemeProvider, useTheme } from "@/design-system";
import "@/i18n";
import { authClient } from "@/lib/auth-client";
import {
  ALLOWED_APP_ROLE,
  type AuthSession,
} from "@/service/auth";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { View } from "react-native";
import { VariableContextProvider } from "@/lib/react-native-css-variable-context";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "../global.css";
import { usePushNotification } from "@/lib/hook/shared/usePushNotification";
import {
  AppUpdateGate,
} from "@/components/update/AppUpdateGate";
import { useAppUpdate } from "@/lib/update/use-app-update";
import { AppUpdateProvider } from "@/lib/update/update-context";
import { useWelcome, WelcomeProvider } from "@/lib/welcome/welcome-context";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const update = useAppUpdate();
  const { data: session, isPending } = authClient.useSession();
  const authSession = session as AuthSession | null;
  const signedInRole = authSession?.user?.role?.toUpperCase?.() ?? null;
  const hasAuthorizedSession = !!session && signedInRole === ALLOWED_APP_ROLE;
  const hasUnauthorizedSession = !!session && signedInRole !== ALLOWED_APP_ROLE;

  useEffect(() => {
    if (!isPending && !update.isChecking) {
      void SplashScreen.hideAsync();
    }
  }, [isPending, update.isChecking]);

  useEffect(() => {
    if (!hasUnauthorizedSession) {
      return;
    }

    void authClient.signOut().catch(() => { });
  }, [hasUnauthorizedSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <WelcomeProvider>
              <AppUpdateProvider value={update}>
                <ThemedRoot
                  hasAuthorizedSession={hasAuthorizedSession}
                  update={update}
                />
              </AppUpdateProvider>
            </WelcomeProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot({
  hasAuthorizedSession,
  update,
}: {
  hasAuthorizedSession: boolean;
  update: ReturnType<typeof useAppUpdate>;
}) {
  const { colors, resolvedScheme } = useTheme();
  const { isReady: isWelcomeReady, hasCompletedWelcome } = useWelcome();

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
        {!isWelcomeReady || update.isChecking ? <View className="flex-1 bg-background" /> : null}
        {isWelcomeReady && !update.isChecking && update.isForceUpdateRequired && update.state ? (
          <AppUpdateGate state={update.state} force />
        ) : null}
        {isWelcomeReady && !update.isChecking && !update.isForceUpdateRequired ? (
          <View className="flex-1 bg-background">
            <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "default",
                }}
            >
                <Stack.Protected guard={!hasCompletedWelcome}>
                  <Stack.Screen name="welcome" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={hasCompletedWelcome && !hasAuthorizedSession}>
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={hasCompletedWelcome && hasAuthorizedSession}>
                  <Stack.Screen name="(app)" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>
          </View>
        ) : null}
      </VariableContextProvider>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
    </>
  );
}
