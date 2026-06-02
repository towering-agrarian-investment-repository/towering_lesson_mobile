import { registerToastHandler } from "@/lib/toast/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ToastProvider, useToast } from "react-native-toastify-expo/lib";

const queryClient = new QueryClient();

export default function AppLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <ToastBridge />
                <Stack>
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
                        }}
                    />

                    <Stack.Screen
                        name="select-bay"
                        options={{
                            title: "Select Bay",
                        }}
                    />

                    <Stack.Screen
                        name="select-time"
                        options={{
                            title: "Select Time",
                        }}
                    />

                    <Stack.Screen
                        name="select-lesson-slot"
                        options={{
                            title: "Select Slot",
                        }}
                    />

                    <Stack.Screen
                        name="booking-confirm"
                        options={{
                            title: "Booking Confirmation",
                        }}
                    />

                    <Stack.Screen
                        name="lesson-booking-confirm"
                        options={{
                            title: "Booking Confirmation",
                        }}
                    />

                    <Stack.Screen
                        name="reservation/[id]"
                        options={{
                            title: "Reservation Detail",
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
                </Stack>
            </ToastProvider>
        </QueryClientProvider>
    );
}

function ToastBridge() {
    const { showToast } = useToast();

    useEffect(() => {
        registerToastHandler((options) => {
            showToast({
                message: options.message,
                type: options.type ?? "info",
                duration: options.duration ?? 3000,
                position: options.position ?? "bottom",
            });
        });

        return () => {
            registerToastHandler(null);
        };
    }, [showToast]);

    return null;
}
