import {
    ReservationPoliciesSection,
    type ReservationPolicy,
} from "@/components/golf/reservation/ReservationSections";
import {
    AppText,
    Button,
    Divider,
    Skeleton,
} from "@/design-system";
import * as Haptics from "expo-haptics";
import type { ImperativeRouter } from "expo-router";
import { View } from "react-native";

type BookingConfirmationFooterProps = {
    title: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
};

type BookingConfirmationContentProps = {
    children: React.ReactNode;
    disabledReason?: string | null;
    policies: readonly ReservationPolicy[];
};

type BookingSuccessDetails = {
    type: "bay" | "lesson";
    mode?: "booking" | "reschedule";
    ticketId?: number | string | null;
    ticketName?: string | null;
    ticketRemainingCount?: number | null;
    ticketIsUnlimited?: boolean | null;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    bayName?: string | null;
    bayId?: string | number | null;
    reservationName?: string | null;
    coachName?: string | null;
};

export function handleBookingConfirmationSuccess(
    router: ImperativeRouter,
    details: BookingSuccessDetails,
) {
    if (process.env.EXPO_OS === "android") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (process.env.EXPO_OS === "ios") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const params: Record<string, string> = {
        type: details.type,
        mode: details.mode ?? "booking",
    };

    const addParam = (
        key: string,
        value?: string | number | boolean | null,
    ) => {
        if (value !== undefined && value !== null && String(value).trim()) {
            params[key] = String(value);
        }
    };

    addParam("ticketName", details.ticketName);
    addParam("ticketId", details.ticketId);
    addParam("ticketRemainingCount", details.ticketRemainingCount);
    addParam("ticketIsUnlimited", details.ticketIsUnlimited);
    addParam("date", details.date);
    addParam("startTime", details.startTime);
    addParam("endTime", details.endTime);
    addParam("bayName", details.bayName);
    addParam("bayId", details.bayId);
    addParam("reservationName", details.reservationName);
    addParam("coachName", details.coachName);

    router.replace({
        pathname: "/booking-success",
        params,
    });
}

export function BookingConfirmationFooter({
    title,
    loading,
    disabled,
    onPress,
}: BookingConfirmationFooterProps) {
    return (
        <View className="pb-8 pt-4">
            <Button
                title={title}
                loading={loading}
                disabled={disabled}
                onPress={onPress}
            />
        </View>
    );
}

export function BookingConfirmationLoadingState({
    fieldCount,
}: {
    fieldCount: number;
}) {
    return (
        <View className="gap-6">
            <View className="gap-4">
                {Array.from({ length: fieldCount }, (_, index) => (
                    <View key={index} className="gap-4">
                        <View className="gap-2">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-6 w-full rounded-full" />
                        </View>
                        {index < fieldCount - 1 ? (
                            <Divider className="bg-border" />
                        ) : null}
                    </View>
                ))}
            </View>

        </View>
    );
}

export function BookingConfirmationContent({
    children,
    disabledReason,
    policies,
}: BookingConfirmationContentProps) {
    return (
        <View className="grow">
            <View className="gap-4">{children}</View>

            <View className="mt-6 gap-4">
                <Divider className="bg-border" />

                {disabledReason ? (
                    <View className="rounded-xl bg-warning/10 px-4 py-3">
                        <AppText variant="meta" className="text-warning">
                            {disabledReason}
                        </AppText>
                    </View>
                ) : null}

                <ReservationPoliciesSection policies={policies} />
            </View>
        </View>
    );
}
