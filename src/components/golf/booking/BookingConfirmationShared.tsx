import { ReservationDetailField } from "@/components/golf/reservation/ReservationSections";
import { ActionButton, Divider, Skeleton, triggerSuccessHaptic } from "@/design-system";
import type { MemberTicketDetailResponse } from "@/types/member-ticket";
import type { ImperativeRouter } from "expo-router";
import {
    CommonActions,
    type NavigationProp,
    type NavigationState,
    type ParamListBase,
} from "expo-router/react-navigation";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const BOOKING_FLOW_ROUTE_NAMES = new Set([
    "select-date",
    "select-time",
    "select-lesson-slot",
    "bay-booking-confirm",
    "lesson-booking-confirm",
]);

type BookingNavigation = {
    getState: () => NavigationState | undefined;
    dispatch: NavigationProp<ParamListBase>["dispatch"];
};

type BookingConfirmationFooterProps = {
    title: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
};

type BookingSuccessDetails = {
    type: "bay" | "lesson";
    mode?: "booking" | "reschedule";
    reservationId?: number | null;
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
    navigation: BookingNavigation,
) {
    triggerSuccessHaptic();

    const params: Record<string, string> = {
        type: details.type,
        mode: details.mode ?? "booking",
    };

    const addParam = (key: string, value?: string | number | boolean | null) => {
        if (value == null) return;
        const normalized = String(value).trim();
        if (!normalized) return;
        params[key] = normalized;
    };

    addParam("ticketName", details.ticketName);
    addParam("reservationId", details.reservationId);
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

    const state = navigation.getState();
    if (state) {
        const originIndex = state.routes.findLastIndex((route) => !BOOKING_FLOW_ROUTE_NAMES.has(route.name));
        const keptRoutes = state.routes.slice(0, originIndex + 1);
        if (details.mode === "reschedule" && details.reservationId != null && keptRoutes.length > 1) {
            const lastRoute = keptRoutes[keptRoutes.length - 1];
            const lastRouteId = (lastRoute.params as { id?: string | number } | undefined)?.id;
            if (lastRoute.name === "reservation/[id]" && String(lastRouteId) === String(details.reservationId)) {
                keptRoutes.pop();
            }
        }
        if (keptRoutes.length > 0) {
            navigation.dispatch(
                CommonActions.reset({
                    ...state,
                    routes: [...keptRoutes, { name: "booking-success", params }],
                    index: keptRoutes.length,
                }),
            );
            return;
        }
    }

    router.replace({
        pathname: "/booking-success",
        params,
    });
}

export function BookingConfirmationFooter({ title, loading, disabled, onPress }: BookingConfirmationFooterProps) {
    return <ActionButton label={title} loading={loading} disabled={disabled} haptic="selection" onPress={onPress} />;
}

export function BookingConfirmationTicketField({
    ticketName,
    ticket,
}: {
    ticketName: string;
    ticket?: Pick<MemberTicketDetailResponse, "isUnlimited" | "remainingCount">;
}) {
    const { t } = useTranslation();
    const remainingCount = ticket?.remainingCount;
    const balance =
        !ticket?.isUnlimited && remainingCount != null
            ? t("bookingConfirmation.ticketBalanceDelta", {
                  before: remainingCount,
                  after: Math.max(0, remainingCount - 1),
              })
            : undefined;

    return (
        <ReservationDetailField label={t("bookingConfirmation.ticketLabel")} value={ticketName} description={balance} />
    );
}

export function BookingConfirmationLoadingState({ fieldCount }: { fieldCount: number }) {
    return (
        <View className="gap-6">
            <View className="gap-4">
                {Array.from({ length: fieldCount }, (_, index) => (
                    <View key={index} className="gap-4">
                        <View className="gap-2">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-6 w-full rounded-full" />
                        </View>
                        {index < fieldCount - 1 ? <Divider className="bg-border" /> : null}
                    </View>
                ))}
            </View>
        </View>
    );
}
