import { AppUpdateGate } from "@/components/update/AppUpdateGate";
import { ThemeProvider, useTheme } from "@/design-system";
import "@/i18n";
import { authClient } from "@/lib/auth-client";
import { usePushNotification } from "@/lib/hook/shared/usePushNotification";
import { VariableContextProvider } from "@/lib/react-native-css-variable-context";
import { AppUpdateProvider } from "@/lib/update/update-context";
import { useAppUpdate } from "@/lib/update/use-app-update";
import { useWelcome, WelcomeProvider } from "@/lib/welcome/welcome-context";
import { ALLOWED_APP_ROLE, type AuthSession } from "@/service/auth";

import * as Sentry from "@sentry/react-native";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

const blueOverrides = {};
const greenOverrides = {
  "--primary": "#00BC7D",
  "--primary-foreground": "#ffffff",
};

Sentry.init({
  dsn: "https://86129b0dd7ff91177ff5302538b716b6@o4512207163686912.ingest.us.sentry.io/4512207382511616",

  environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? "local",

  // You chose to reduce PII earlier.
  sendDefaultPii: false,

});

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const update = useAppUpdate();
  const { data: session, isPending } = authClient.useSession();
  // Later auth refreshes must keep the navigator mounted during logout.
  const [hasBootstrappedAuth, setHasBootstrappedAuth] = useState(!isPending);
  const isAuthPending = isPending && !hasBootstrappedAuth;

  if (!isPending && !hasBootstrappedAuth) {
    setHasBootstrappedAuth(true);
  }

  const authSession = session as AuthSession | null;
  const signedInRole = authSession?.user?.role?.toUpperCase?.() ?? null;

  const hasAuthorizedSession = !!session && signedInRole === ALLOWED_APP_ROLE;

  const hasUnauthorizedSession = !!session && signedInRole !== ALLOWED_APP_ROLE;

  useEffect(() => {
    if (!hasUnauthorizedSession) {
      return;
    }

    void authClient.signOut().catch(() => {});
  }, [hasUnauthorizedSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <WelcomeProvider>
              <AppUpdateProvider value={update}>
                <ThemedRoot
                  isAuthPending={isAuthPending}
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
  isAuthPending,
  hasAuthorizedSession,
  update,
}: {
  isAuthPending: boolean;
  hasAuthorizedSession: boolean;
  update: ReturnType<typeof useAppUpdate>;
}) {
  const {
    colors,
    resolvedScheme,
    isReady: isThemeReady,
    primaryColorPreference,
  } = useTheme();
  const { isReady: isWelcomeReady, hasCompletedWelcome } = useWelcome();

  useEffect(() => {
    if (isThemeReady && !isAuthPending) {
      void SplashScreen.hideAsync();
    }
  }, [isThemeReady, isAuthPending]);

  usePushNotification(
    hasAuthorizedSession && isWelcomeReady && hasCompletedWelcome &&
    !isAuthPending && !update.isForceUpdateRequired,
  );

  const navigationTheme = useMemo(
    () => ({
      ...(resolvedScheme === "dark" ? DarkTheme : DefaultTheme),
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.danger,
      },
    }),
    [colors, resolvedScheme],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <VariableContextProvider
        value={primaryColorPreference === "green" ? greenOverrides : blueOverrides}
      >
        {!isThemeReady || !isWelcomeReady || isAuthPending ? (
          <View className="flex-1 bg-background" />
        ) : null}

        {isThemeReady &&
        isWelcomeReady &&
        update.isForceUpdateRequired &&
        update.state ? (
          <AppUpdateGate
            state={update.state}
            force
            isCheckingAgain={update.isCheckingAgain}
            onCheckAgain={update.checkAgain}
          />
        ) : null}

        {isThemeReady &&
        isWelcomeReady &&
        !isAuthPending &&
        !update.isForceUpdateRequired ? (
          <View className="flex-1 bg-background">
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "none",
              }}
            >
              <Stack.Protected guard={!hasCompletedWelcome}>
                <Stack.Screen
                  name="welcome"
                  options={{ headerShown: false, animation: "none" }}
                />
              </Stack.Protected>

              <Stack.Protected
                guard={hasCompletedWelcome && !hasAuthorizedSession}
              >
                <Stack.Screen
                  name="login"
                  options={{ headerShown: false, animation: "fade" }}
                />
              </Stack.Protected>

              <Stack.Protected
                guard={hasCompletedWelcome && hasAuthorizedSession}
              >
                <Stack.Screen
                  name="(app)"
                  options={{ headerShown: false, animation: "none" }}
                />
              </Stack.Protected>
            </Stack>
          </View>
        ) : null}
      </VariableContextProvider>

      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
