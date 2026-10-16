import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import { Divider, Skeleton } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { Button, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import type { ImperativeRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

type BookingConfirmationFooterProps = {
    title: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
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
        void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
        );
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
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    return (
        <View className="pb-8 pt-4">
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                colorScheme={uiScheme}
                seedColor={uiColors.primary}
                accessibilityLabel={title}
                accessibilityState={{
                    disabled: disabled || loading,
                    busy: loading,
                }}
                style={{ width: "100%" }}>
                <Button
                    modifiers={
                        process.env.EXPO_OS === "ios"
                            ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                            : [
                                fillMaxWidth(),
                                defaultMinSize({ minHeight: 48 }),
                            ]
                    }
                    variant="text"
                    disabled={disabled || loading}
                    onPress={onPress}
                    style={{
                        ...getNativeButtonStyle(
                            uiColors,
                            "filled",
                            disabled || loading,
                            uiColors.primary,
                        ), ...{ borderRadius: 12 }
                    }}
                >
                    <Row
                        modifiers={
                            process.env.EXPO_OS === "ios"
                                ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                : [fillMaxWidth()]
                        }
                        spacing={8}
                        alignment="center"
                    >
                        <Spacer flexible />
                        {loading ? (
                            <RNHostView matchContents>
                                <ActivityIndicator
                                    color={uiColors.primaryForeground}
                                />
                            </RNHostView>
                        ) : null}
                        <Text
                            textStyle={{
                                textAlign: "center",
                                ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                fontWeight: "600",
                                color: uiColors.primaryForeground,
                                fontSize:
                                    typography.label.fontSize * uiFontScale,
                            }}
                        >
                            {title}
                        </Text>
                        <Spacer flexible />
                    </Row>
                </Button>
            </Host>
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

