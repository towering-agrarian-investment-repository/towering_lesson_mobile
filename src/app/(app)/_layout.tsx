import { authClient } from "@/lib/auth-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const queryClient = new QueryClient();

export default function AppLayout() {
    const { data: session, isPending } = authClient.useSession();
    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/login");
        }
    }, [isPending, session]);

    if (isPending) {
        return (
            <QueryClientProvider client={queryClient}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator />
                </View>
            </QueryClientProvider>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
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
                    name="booking-confirm"
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
            </Stack>
        </QueryClientProvider>
    );
}