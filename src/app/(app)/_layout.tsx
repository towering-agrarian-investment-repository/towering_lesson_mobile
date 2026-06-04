import { useThemeColors } from "@/design-system/utils/theme";
import { registerToastHandler } from "@/lib/toast/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ToastProvider, useToast } from "react-native-toastify-expo/lib";

const queryClient = new QueryClient();
const bookingFlowScreenOptions = {
    animation: "slide_from_right" as const,
    animationDuration: 200,
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
    const textColor = type === "warning" ? colors.foreground : colors.primaryForeground;

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

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <ToastBridge />
                <Stack
                    screenOptions={{
                        headerBackButtonDisplayMode: "minimal",
                        contentStyle: { backgroundColor: colors.background },
                        headerStyle: {
                            backgroundColor: colors.card,
                        },
                        headerTintColor: colors.foreground,
                        headerTitleStyle: {
                            color: colors.foreground,
                        },
                        headerShadowVisible: false,
                    }}
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
                            title: "My Reservations",
                        }}
                    />

                    <Stack.Screen
                        name="select-date"
                        options={{
                            title: "Select Date",
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="select-bay"
                        options={{
                            title: "Select Bay",
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="select-time"
                        options={{
                            title: "Select Time",
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="select-lesson-slot"
                        options={{
                            title: "Select Slot",
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="booking-confirm"
                        options={{
                            title: "Booking Confirmation",
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="lesson-booking-confirm"
                        options={{
                            title: "Booking Confirmation",
                            ...bookingFlowScreenOptions,
                        }}
                    />

                    <Stack.Screen
                        name="reservation/[id]"
                        options={{
                            title: "Reservation Detail",
                            animation: "slide_from_right",
                            animationTypeForReplace: "push",
                        }}
                    />

                    <Stack.Screen
                        name="lesson-log"
                        options={{
                            title: "Lesson Log",
                        }}
                    />

                    <Stack.Screen
                        name="profile/change-password"
                        options={{
                            title: "Reset Password",
                        }}
                    />

                    <Stack.Screen
                        name="profile/edit"
                        options={{
                            title: "Edit Personal Information",
                        }}
                    />

                    <Stack.Screen
                        name="profile/gender-modal"
                        options={{
                            title: "Gender",
                            presentation: "modal",
                        }}
                    />

                    <Stack.Screen
                        name="design-system-demo"
                        options={{
                            title: "Design System",
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
