import {
    getPressedScaleStyle,
    triggerSelectionHaptic,
    useThemeColors,
} from "@/design-system";
import { registerToastHandler } from "@/lib/toast/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type Href, Stack, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { ToastProvider, useToast } from "react-native-toastify-expo/lib";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            retry: 1,
        },
    },
});
const bookingFlowScreenOptions = {
    animation: "default" as const,
    fullScreenGestureEnabled: true,
    gestureEnabled: true,
};

function getToastStyles(
    colors: ReturnType<typeof useThemeColors>,
    type: "success" | "error" | "warning" | "info",
) {
    const backgroundColor =
        type === "error"
            ? colors.danger
            : type === "success"
                ? colors.success
                : type === "warning"
                    ? colors.warning
                    : colors.primary;
    const textColor =
        type === "info"
            ? colors.primaryForeground
            : type === "warning"
                ? colors.foreground
                : "#ffffff";

    return {
        containerStyle: {
            backgroundColor,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
        },
        textStyle: {
            color: textColor,
            fontSize: 15,
            fontWeight: "600" as const,
        },
    };
}

export default function AppLayout() {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <ToastBridge />
                <Stack
                    screenOptions={({ navigation }) => ({
                        animation: "default",
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
                        headerLeftContainerStyle: {
                            paddingLeft: 8,
                        },
                        headerLargeTitleStyle: {
                            color: colors.foreground,
                        },
                        headerShadowVisible: false,
                        headerLeft: ({ canGoBack }) =>
                            canGoBack ? (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t("common.goBack")}
                                    className="mr-1 h-11 w-11 items-center justify-center rounded-full"
                                    hitSlop={8}
                                    style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.94)}
                                    onPress={() => {
                                        triggerSelectionHaptic();
                                        navigation.goBack();
                                    }}
                                >
                                    <ChevronLeft
                                        size={20}
                                        color={colors.foreground}
                                        strokeWidth={2.4}
                                    />
                                </Pressable>
                            ) : undefined,
                    })}
                >
                    <Stack.Screen
                        name="(tabs)"
                        options={{
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="reservation"
                        options={{
                            title: t("navigation.screens.myReservations"),
                            headerLeft: () => (
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={t("common.goBack")}
                                    className="mr-1 h-11 w-11 items-center justify-center rounded-full"
                                    hitSlop={8}
                                    style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.94)}
                                    onPress={() => {
                                        triggerSelectionHaptic();
                                        if (router.canGoBack()) {
                                            router.back();
                                            return;
                                        }

                                        router.replace("/(app)/(tabs)" as Href);
                                    }}
                                >
                                    <ChevronLeft
                                        size={20}
                                        color={colors.foreground}
                                        strokeWidth={2.4}
                                    />
                                </Pressable>
                            ),
                        }}
                    />

                    <Stack.Screen
                        name="tickets"
                        options={{
                            title: t("tickets.sectionTitle"),
                        }}
                    />

                    <Stack.Screen
                        name="select-date"
                        options={{
                            title: t("navigation.screens.selectDate"),
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="select-bay"
                        options={{
                            title: t("navigation.screens.selectBay"),
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="select-time"
                        options={{
                            title: t("navigation.screens.selectTime"),
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="select-lesson-slot"
                        options={{
                            title: t("navigation.screens.selectSlot"),
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="booking-confirm"
                        options={{
                            title: t("navigation.screens.bookingConfirmation"),
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-booking-confirm"
                        options={{
                            title: t("navigation.screens.bookingConfirmation"),
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="reservation/[id]"
                        options={{
                            title: t("reservations.reservationDetailTitle"),
                            animation: "default",
                            animationTypeForReplace: "push",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
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
                            animation: "default",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-log/[id]"
                        options={{
                            title: t("navigation.screens.lessonPost"),
                            animation: "default",
                            animationTypeForReplace: "pop",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-log/[id]/comment"
                        options={{
                            title: t("navigation.screens.lessonPost"),
                            animation: "default",
                            fullScreenGestureEnabled: true,
                            gestureEnabled: true,
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
                            headerLargeTitle: true,
                        }}
                    />
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}

function ToastBridge() {
    const { showToast } = useToast();
    const colors = useThemeColors();

    useEffect(() => {
        registerToastHandler((options) => {
            const toastType = options.type ?? "info";
            const { containerStyle, textStyle } = getToastStyles(colors, toastType);

            showToast({
                message: options.message,
                type: toastType,
                duration: options.duration ?? 3000,
                position: options.position ?? "bottom",
                containerStyle,
                textStyle,
            });
        });

        return () => {
            registerToastHandler(null);
        };
    }, [colors, showToast]);

    return null;
}
