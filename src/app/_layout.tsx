import { AppUpdateGate } from "@/components/update/AppUpdateGate";
import { AppToastProvider, ThemeProvider, useTheme } from "@/design-system";
import { i18nReady, isI18nReady } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { setInterruptedHref } from "@/lib/auth-session";
import { env } from "@/lib/config/env";
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
    useGlobalSearchParams,
    usePathname,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

const blueOverrides = {};

Sentry.init({
    dsn: env.sentryDsn,

    environment: env.sentryEnvironment,

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

    const authorizedHrefRef = useRef<string | null>(null);
    const wasAuthorizedRef = useRef(hasAuthorizedSession);

    useEffect(() => {
        if (wasAuthorizedRef.current && !hasAuthorizedSession) {
            setInterruptedHref(authorizedHrefRef.current);
        }
        wasAuthorizedRef.current = hasAuthorizedSession;
    }, [hasAuthorizedSession]);

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
                                <AuthorizedHrefObserver
                                    authorizedHrefRef={authorizedHrefRef}
                                    hasAuthorizedSession={hasAuthorizedSession}
                                />
                                <ThemedRoot
                                    isAuthPending={isAuthPending}
                                    hasAuthorizedSession={hasAuthorizedSession}
                                    userId={authSession?.user.id ?? null}
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

function AuthorizedHrefObserver({
    authorizedHrefRef,
    hasAuthorizedSession,
}: {
    authorizedHrefRef: RefObject<string | null>;
    hasAuthorizedSession: boolean;
}) {
    const pathname = usePathname();
    const globalParams = useGlobalSearchParams();
    useEffect(() => {
        if (!hasAuthorizedSession || !pathname) return;
        if (pathname.startsWith("/login") || pathname.startsWith("/welcome")) return;

        const query = Object.entries(globalParams)
            .filter(([key, value]) => key !== "screen" && typeof value === "string")
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
            .join("&");

        authorizedHrefRef.current = query ? `${pathname}?${query}` : pathname;
    }, [authorizedHrefRef, globalParams, hasAuthorizedSession, pathname]);

    return null;
}

function ThemedRoot({
    isAuthPending,
    hasAuthorizedSession,
    userId,
    update,
}: {
    isAuthPending: boolean;
    hasAuthorizedSession: boolean;
    userId: string | null;
    update: ReturnType<typeof useAppUpdate>;
}) {
    const { colors, resolvedScheme, isReady: isThemeReady, primaryColorPreference } = useTheme();
    const { isReady: isWelcomeReady, hasCompletedWelcome } = useWelcome();
    const [isLanguageReady, setIsLanguageReady] = useState(isI18nReady);

    useEffect(() => {
        if (isLanguageReady) {
            return;
        }

        let isMounted = true;
        void i18nReady.then(() => {
            if (isMounted) {
                setIsLanguageReady(true);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [isLanguageReady]);

    const isAppReady = isThemeReady && isWelcomeReady && isLanguageReady && !isAuthPending;

    useEffect(() => {
        if (isAppReady) {
            void SplashScreen.hideAsync();
        }
    }, [isAppReady]);

    usePushNotification(
        hasAuthorizedSession && isAppReady && hasCompletedWelcome && !update.isForceUpdateRequired ? userId : null,
    );

    const primaryVariableOverrides = useMemo(
        () =>
            primaryColorPreference === "green"
                ? {
                      "--primary": "#00BC7D",
                      "--primary-foreground": "#ffffff",
                  }
                : blueOverrides,
        [primaryColorPreference],
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
            <VariableContextProvider value={primaryVariableOverrides}>
                <AppToastProvider>
                    {!isAppReady ? (
                        <View className="flex-1 bg-background" />
                    ) : update.isForceUpdateRequired && update.state ? (
                        <AppUpdateGate
                            state={update.state}
                            force
                            isCheckingAgain={update.isCheckingAgain}
                            onCheckAgain={update.checkAgain}
                        />
                    ) : (
                        <View className="flex-1 bg-background">
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    animation: "none",
                                }}
                            >
                                <Stack.Protected guard={!hasCompletedWelcome}>
                                    <Stack.Screen name="welcome" options={{ headerShown: false, animation: "none" }} />
                                </Stack.Protected>

                                <Stack.Protected guard={hasCompletedWelcome && !hasAuthorizedSession}>
                                    <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
                                </Stack.Protected>

                                <Stack.Protected guard={hasCompletedWelcome && hasAuthorizedSession}>
                                    <Stack.Screen name="(app)" options={{ headerShown: false, animation: "none" }} />
                                </Stack.Protected>
                            </Stack>
                        </View>
                    )}
                </AppToastProvider>
            </VariableContextProvider>

            <StatusBar style="auto" />
        </NavigationThemeProvider>
    );
}

export default Sentry.wrap(RootLayout);
