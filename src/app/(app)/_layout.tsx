import { showAppToast } from "@/design-system/components/AppToast";
import { getStackHeaderOptions, useThemeColors } from "@/design-system/utils/theme";
import i18n from "@/i18n";
import { takeInterruptedHref, verifyMemberSession } from "@/lib/auth-session";
import { focusManager, onlineManager, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

export const unstable_settings = { anchor: "(tabs)" };

const ERROR_TOAST_THROTTLE_MS = 5000;
let lastErrorToastAt = 0;

export default function AppLayout() {
    // The protected layout unmounts on logout. Its cache must end with that session.
    const [queryClient] = useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError: (_error, query) => {
                        // Only background refetch failures (cached data on screen) toast.
                        if (query.state.data === undefined) return;

                        // Several queries often fail together (offline, server down); show one toast.
                        const now = Date.now();
                        if (now - lastErrorToastAt < ERROR_TOAST_THROTTLE_MS) return;
                        lastErrorToastAt = now;

                        showAppToast({
                            message: i18n.t("common.pullToRefreshAndTryAgain"),
                            type: "error",
                        });
                    },
                }),
                defaultOptions: {
                    // Authenticated writes fail immediately in apiClient without being queued for reconnect.
                    mutations: { networkMode: "always" },
                    queries: {
                        staleTime: 30_000,
                        gcTime: 10 * 60_000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );
    const colors = useThemeColors();
    const reducedMotion = useReducedMotion();
    const { t } = useTranslation();
    const router = useRouter();

    useEffect(() => {
        const interruptedHref = takeInterruptedHref();
        if (interruptedHref) {
            router.replace(interruptedHref as Href);
        }
    }, [router]);

    useEffect(() => {
        if (process.env.EXPO_OS !== "web") {
            focusManager.setEventListener((setFocused) => {
                const subscription = AppState.addEventListener("change", (state) => {
                    setFocused(state === "active");
                });

                return () => subscription.remove();
            });
        }

        let previousState = AppState.currentState;
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active" && previousState !== "active" && onlineManager.isOnline()) {
                void verifyMemberSession();
            }
            previousState = state;
        });
        const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
            void queryClient.invalidateQueries({
                queryKey: ["notifications"],
            });
            const referenceType = notification.request.content.data?.referenceType;
            if (typeof referenceType === "string" && referenceType.toUpperCase() === "LESSON_LOG") {
                void queryClient.invalidateQueries({
                    queryKey: ["member", "lesson-logs"],
                    predicate: (query) => query.queryKey[2] === "list" || query.queryKey[2] === "count",
                });
            }
        });

        return () => {
            if (process.env.EXPO_OS !== "web") {
                focusManager.setEventListener(() => () => {});
            }
            subscription.remove();
            notificationSubscription.remove();
            queryClient.clear();
        };
    }, [queryClient]);

    return (
        <QueryClientProvider client={queryClient}>
            <Stack
                screenOptions={{
                    animation: reducedMotion ? "fade" : "default",
                    headerBackButtonDisplayMode: "minimal",
                    headerShadowVisible: false,
                    ...getStackHeaderOptions(colors),
                }}
            >
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        animation: "none",
                    }}
                />

                <Stack.Screen
                    name="reservation"
                    options={{
                        title: t("navigation.screens.myReservations"),
                    }}
                />

                <Stack.Screen name="lessons/index" options={{ title: t("navigation.tabs.lessons") }} />

                <Stack.Screen
                    name="tickets"
                    options={{
                        title: t("tickets.sectionTitle"),
                    }}
                />

                <Stack.Screen
                    name="ticket-history"
                    options={{
                        title: t("tickets.historyTitle"),
                    }}
                />

                <Stack.Screen
                    name="tickets/[id]"
                    options={{
                        title: t("tickets.detailTitle"),
                    }}
                />

                <Stack.Screen
                    name="select-date"
                    options={{
                        title: t("navigation.screens.selectDate"),
                    }}
                />

                <Stack.Screen
                    name="select-time"
                    options={{
                        title: t("navigation.screens.selectTime"),
                    }}
                />

                {/* select-lesson-slot sets its own title (group vs. slot) in the screen. */}

                <Stack.Screen
                    name="bay-booking-confirm"
                    options={{
                        title: t("navigation.screens.bookingConfirmation"),
                    }}
                />

                <Stack.Screen
                    name="lesson-booking-confirm"
                    options={{
                        title: t("navigation.screens.bookingConfirmation"),
                    }}
                />

                <Stack.Screen
                    name="booking-success"
                    options={{
                        headerShown: false,
                        animation: "none",
                        fullScreenGestureEnabled: false,
                        gestureEnabled: false,
                    }}
                />

                <Stack.Screen
                    name="reservation/[id]"
                    options={{
                        title: t("reservations.reservationDetailTitle"),
                        animationTypeForReplace: "push",
                    }}
                />

                <Stack.Screen
                    name="groups/[groupId]/index"
                    options={{
                        title: t("navigation.screens.groupDetail"),
                        headerLargeTitle: true,
                    }}
                />

                <Stack.Screen
                    name="groups/[groupId]/lessons/[lessonId]/index"
                    options={{
                        title: t("navigation.screens.groupLesson"),
                    }}
                />

                <Stack.Screen
                    name="groups/[groupId]/lessons/[lessonId]/sessions/index"
                    options={{
                        title: t("lessons.sessionsTitle"),
                    }}
                />

                <Stack.Screen
                    name="lessons/[lessonId]/index"
                    options={{
                        title: t("navigation.screens.lessonDetail"),
                        headerLargeTitle: true,
                    }}
                />

                <Stack.Screen
                    name="lessons/[lessonId]/sessions/index"
                    options={{
                        title: t("lessons.sessionsTitle"),
                    }}
                />

                <Stack.Screen
                    name="homework/[homeworkId]"
                    options={{
                        title: t("navigation.screens.homeworkDetail"),
                    }}
                />

                <Stack.Screen
                    name="lesson-log"
                    options={{
                        title: t("navigation.screens.lessonPostList"),
                        headerLargeTitle: true,
                    }}
                />

                <Stack.Screen
                    name="lesson-log/[id]"
                    options={{
                        title: t("navigation.screens.lessonPost"),
                        animationTypeForReplace: "pop",
                    }}
                />

                <Stack.Screen
                    name="lesson-log/[id]/comment"
                    options={{
                        title: t("navigation.screens.lessonPost"),
                    }}
                />

                <Stack.Screen
                    name="profile/change-password"
                    options={{
                        title: t("navigation.screens.resetPassword"),
                    }}
                />

                <Stack.Screen
                    name="profile/edit"
                    options={{
                        title: t("profile.editPersonalInformation"),
                    }}
                />
            </Stack>
        </QueryClientProvider>
    );
}
