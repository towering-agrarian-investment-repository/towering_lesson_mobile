import { ActionButton, Divider, Skeleton, triggerSuccessHaptic } from "@/design-system";
import type { ImperativeRouter } from "expo-router";
import { View } from "react-native";

type BookingConfirmationFooterProps = {
    title: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
};

type BookingSuccessDetails = {
    type: "bay" | "lesson";
    mode?: "booking" | "reschedule";
    ticketName?: string | null;
    ticketTotalCount?: number | null;
    ticketUsedCount?: number | null;
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
    triggerSuccessHaptic();

    const params: Record<string, string> = {
        type: details.type,
        mode: details.mode ?? "booking",
    };

    const addParam = (
        key: string,
        value?: string | number | boolean | null,
    ) => {
        if (value == null) return;
        const normalized = String(value).trim();
        if (!normalized) return;
        params[key] = normalized;
    };

    addParam("ticketName", details.ticketName);
    addParam("ticketTotalCount", details.ticketTotalCount);
    addParam("ticketUsedCount", details.ticketUsedCount);
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
        <ActionButton
            label={title}
            loading={loading}
            disabled={disabled}
            haptic="selection"
            onPress={onPress}
        />
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
