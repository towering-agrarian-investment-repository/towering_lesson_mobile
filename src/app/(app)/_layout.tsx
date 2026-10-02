import {
    AppToastProvider,
    useThemeColors,
} from "@/design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export const unstable_settings = { anchor: "(tabs)" };

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            retry: 1,
        },
    },
});

export default function AppLayout() {
    const colors = useThemeColors();
    const { t } = useTranslation();

    return (
        <QueryClientProvider client={queryClient}>
            <AppToastProvider>
                <Stack
                    screenOptions={{
                        animation: "none",
                        fullScreenGestureEnabled: true,
                        gestureEnabled: true,
                        headerBackButtonDisplayMode: "minimal",
                        contentStyle: { backgroundColor: colors.background },
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.foreground,
                        headerTitleStyle: {
                            color: colors.foreground,
                            fontWeight: "700",
                        },
                        headerTitleAlign: "left",
                        headerLargeTitleStyle: {
                            color: colors.foreground,
                        },
                        headerShadowVisible: false,
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
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="lessons/index"
                        options={{ title: t("navigation.tabs.lessons") }}
                    />

                    <Stack.Screen
                        name="tickets"
                        options={{
                            title: t("tickets.sectionTitle"),
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="select-date"
                        options={{
                            title: t("navigation.screens.selectDate"),
                            animation: "none",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="select-bay"
                        options={{
                            title: t("navigation.screens.selectBay"),
                            animation: "none",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="select-time"
                        options={{
                            title: t("navigation.screens.selectTime"),
                            animation: "none",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="select-lesson-slot"
                        options={{
                            title: t("navigation.screens.selectSlot"),
                            animation: "none",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="bay-booking-confirm"
                        options={{
                            title: t("navigation.screens.bookingConfirmation"),
                            animation: "none",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-booking-confirm"
                        options={{
                            title: t("navigation.screens.bookingConfirmation"),
                            animation: "none",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
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
                            animation: "none",
                            animationDuration: 150,
                            animationTypeForReplace: "push",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="groups/[groupId]/index"
                        options={{
                            title: t("navigation.screens.groupDetail"),
                            animation: "none",
                            animationDuration: 150,
                            headerLargeTitle: true,
                        }}
                    />

                    <Stack.Screen
                        name="groups/[groupId]/lessons/[lessonId]/index"
                        options={{
                            title: t("navigation.screens.groupLesson"),
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="groups/[groupId]/lessons/[lessonId]/sessions/index"
                        options={{
                            title: t("lessons.sessionsTitle"),
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="lessons/[lessonId]/index"
                        options={{
                            title: t("navigation.screens.lessonDetail"),
                            animation: "none",
                            animationDuration: 150,
                            headerLargeTitle: true,
                        }}
                    />

                    <Stack.Screen
                        name="lessons/[lessonId]/sessions/index"
                        options={{
                            title: t("lessons.sessionsTitle"),
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="homework/[homeworkId]"
                        options={{
                            title: t("navigation.screens.homeworkDetail"),
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-log"
                        options={{
                            title: t("navigation.screens.lessonPostList"),
                            headerLargeTitle: true,
                            animation: "none",
                            animationDuration: 150,
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-log/[id]"
                        options={{
                            title: t("navigation.screens.lessonPost"),
                            animation: "none",
                            animationDuration: 150,
                            animationTypeForReplace: "pop",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-log/[id]/comment"
                        options={{
                            title: t("navigation.screens.lessonPost"),
                            animation: "none",
                            animationDuration: 150,
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="profile/change-password"
                        options={{
                            title: t("navigation.screens.resetPassword"),
                            animation: "none",
                            animationDuration: 150,
                        }}
                    />

                    <Stack.Screen
                        name="profile/edit"
                        options={{
                            title: t("profile.editPersonalInformation"),
                            animation: "none",
                            animationDuration: 150,
                            headerLargeTitle: true,
                        }}
                    />
                </Stack>
            </AppToastProvider>
        </QueryClientProvider>
    );
}
