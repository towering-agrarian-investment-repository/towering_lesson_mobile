import {
    ReservationPoliciesSection,
    type ReservationPolicy,
} from "@/components/golf/reservation/ReservationSections";
import {
    AppText,
    Button,
    Divider,
    Skeleton,
    Textarea,
} from "@/design-system";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { View } from "react-native";

export type BookingConfirmationSuccessResponse = {
    data?: {
        id: number;
        reservationType: string;
    } | null;
};

type BookingConfirmationRouter = {
    dismissAll: () => void;
    push: (...args: any[]) => void;
    replace: (...args: any[]) => void;
};

type BookingConfirmationFooterProps = {
    title: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
};

type BookingConfirmationContentProps = {
    children: React.ReactNode;
    notes: string;
    onNotesChange: (value: string) => void;
    disabledReason?: string | null;
    policies: readonly ReservationPolicy[];
};

export function handleBookingConfirmationSuccess(
    router: BookingConfirmationRouter,
    response: BookingConfirmationSuccessResponse,
) {
    const reservation = response.data;

    if (process.env.EXPO_OS === "android") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (process.env.EXPO_OS === "ios") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.dismissAll();

    if (reservation) {
        router.replace("/reservation");
        router.push({
            pathname: "/reservation/[id]",
            params: {
                id: String(reservation.id),
                type: reservation.reservationType,
                success: "true",
            },
        });
        return;
    }

    router.replace("/reservation");
}

export function BookingConfirmationFooter({
    title,
    loading,
    disabled,
    onPress,
}: BookingConfirmationFooterProps) {
    return (
        <View className="border-t border-border bg-background px-6 pb-8 pt-4">
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

            <View className="gap-4">
                <Divider className="bg-border" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </View>
        </View>
    );
}

export function BookingConfirmationContent({
    children,
    notes,
    onNotesChange,
    disabledReason,
    policies,
}: BookingConfirmationContentProps) {
    const { t } = useTranslation();
    return (
        <View className="grow">
            <View className="gap-4">{children}</View>

            <View className="mt-6 gap-4">
                <Divider className="bg-border" />

                <Textarea
                    label={t("common.notes")}
                    placeholder={t("bookingConfirmation.notesPlaceholder")}
                    value={notes}
                    onChangeText={onNotesChange}
                />

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
