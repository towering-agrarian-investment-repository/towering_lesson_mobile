import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import {
    ReservationContent,
    ReservationDetailField,
} from "@/components/golf/reservation/ReservationSections";
import {
    Badge,
    Divider,
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import {
    MemberReservationDetailResponse,
    MemberReservationDetailPreview,
    useCancelMemberBayReservation,
    useCancelMemberLessonReservation,
    useMemberReservationById,
} from "@/lib/hook/useReservation";
import { MemberBayReservationResponse } from "@/types/member-bay";
import { MemberLessonReservationResponse } from "@/types/member-lesson";
import { MemberReservationDomain } from "@/types/member-reservation";
import { formatType } from "@/utils/format-enum";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { BottomSheet, Button, Column, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame, interactiveDismissDisabled, presentationCornerRadius } from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    View,
} from "react-native";

type ReservationParams = {
    id: string;
    type?: string;
};

function isReservationDomain(
    value?: string | string[],
): value is MemberReservationDomain {
    return value === "lesson" || value === "bay";
}

function isBayReservationDetail(
    reservation: MemberReservationDetailResponse,
): reservation is MemberBayReservationResponse {
    return reservation.reservationType === "bay";
}

function isLessonReservationDetail(
    reservation: MemberReservationDetailResponse,
): reservation is MemberLessonReservationResponse {
    return reservation.reservationType === "lesson";
}

function getReservationTitle(
    reservation: MemberReservationDetailResponse,
    t: (key: string) => string,
) {
    const name = isBayReservationDetail(reservation)
        ? reservation.bayName
        : reservation.lessonAvailability?.name;

    return name?.trim() || t("common.notAvailable");
}

function getReservationStatusColor(
    colors: ReturnType<typeof useThemeColors>,
    value?: string | null,
) {
    switch (value) {
        case "RESERVED":
            return colors.primary;
        case "CHECKED_IN":
        case "COMPLETED":
            return colors.success;
        case "CANCELLED":
        case "CANCELED":
            return colors.danger;
        case "NO_SHOW":
            return colors.warning;
        default:
            return colors.foreground;
    }
}

function getReservationPolicies(t: (key: string) => string) {
    return {
        lesson: [
            {
                title: t("bookingConfirmation.lessonCancellationPolicyTitle"),
                description: t(
                    "bookingConfirmation.lessonCancellationPolicyDescription",
                ),
            },
            {
                title: t("bookingConfirmation.lessonNoShowPolicyTitle"),
                description: t(
                    "bookingConfirmation.lessonNoShowPolicyDescription",
                ),
            },
        ],
        bay: [
            {
                title: t("bookingConfirmation.bayCancellationPolicyTitle"),
                description: t(
                    "bookingConfirmation.bayCancellationPolicyDescription",
                ),
            },
            {
                title: t("bookingConfirmation.bayNoShowPolicyTitle"),
                description: t(
                    "bookingConfirmation.bayNoShowPolicyDescription",
                ),
            },
        ],
    } as const;
}

export default function ReservationDetailScreen() {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const { id, type } = useLocalSearchParams<ReservationParams>();

    const [isCancelSheetVisible, setIsCancelSheetVisible] = useState(false);
    const cancelLocked = useRef(false);
    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const reservationType = isReservationDomain(type) ? type : undefined;

    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberReservationById(Number(id), reservationType);
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const reservation = data?.data;

    const { mutate: cancelLessonReservation, isPending: isCancellingLesson } =
        useCancelMemberLessonReservation();

    const { mutate: cancelBayReservation, isPending: isCancellingBay } =
        useCancelMemberBayReservation();
    const screenOptions = {
        title: t("reservations.reservationDetailTitle"),
    } as const;

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={screenOptions} />

                <Screen contentClassName="flex-col gap-8">
                    <View className="flex-col gap-4">
                        <Skeleton className="h-8 w-2/3 rounded-xl" />
                        <Skeleton className="h-6 w-1/3 rounded-full" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                    </View>

                    <View className="flex-col gap-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton
                                key={index}
                                className="h-16 w-full rounded-xl"
                            />
                        ))}
                    </View>
                </Screen>
            </>
        );
    }

    if (isError && (!data || "isListPreview" in data.data)) {
        return (
            <>
                <Stack.Screen options={screenOptions} />

                <Screen
                    contentClassName="grow"
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                >
                    <ErrorState
                        title={t("reservations.failedDetailTitle")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={
                            isRefetching
                                ? t("common.refreshing")
                                : t("common.refreshTryAgain")
                        }
                        onAction={handlePullRefresh}
                    />
                </Screen>
            </>
        );
    }

    if (reservation && "isListPreview" in reservation) {
        return <ReservationPreviewScreen preview={reservation} />;
    }

    if (!reservation) {
        return (
            <>
                <Stack.Screen options={screenOptions} />

                <Screen
                    contentClassName="grow"
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                >
                    <EmptyState
                        title={t("reservations.notAvailableTitle")}
                        message={
                            reservationType
                                ? t("reservations.notFoundMessage")
                                : t("reservations.typeMissingMessage")
                        }
                        actionLabel={t("navigation.screens.myReservations")}
                        onAction={() => {
                            runWithNavigationLock(() => {
                                router.dismissTo("/reservation");
                            });
                        }}
                    />
                </Screen>
            </>
        );
    }

    const isBayReservation = isBayReservationDetail(reservation);
    const lessonReservation = isLessonReservationDetail(reservation)
        ? reservation
        : null;

    const canCancelReservation =
        reservation.reservationStatus === "RESERVED" &&
        reservation.isCancellable;
    const canRescheduleReservation =
        isBayReservation && reservation.isCancellable;
    const isCancelling = isBayReservation
        ? isCancellingBay
        : isCancellingLesson;

    const title = getReservationTitle(reservation, t);
    const dateValue = formatDateForDisplay(reservation.startTime) || "-";
    const timeValue = formatTimeRange(
        reservation.startTime,
        reservation.endTime,
    );
    const lessonNameValue = isBayReservation
        ? null
        : lessonReservation?.lessonProgramEnrollmentId != null
            ? lessonReservation.lessonName?.trim() || "-"
            : null;

    const programValue = isBayReservation
        ? "-"
        : [
            lessonReservation?.lessonProgramName,
            lessonReservation?.lessonProgramGroupName,
        ]
            .filter(Boolean)
            .join(" / ") || "-";

    const coachName = isBayReservation
        ? "-"
        : lessonReservation?.coach?.name?.trim() || "-";

    const noteValue = reservation.memberNotes?.trim() || "-";

    const reservationPolicies = getReservationPolicies(t);
    const policies = isBayReservation
        ? reservationPolicies.bay
        : reservationPolicies.lesson;

    const lessonDetailsHref =
        !isBayReservation &&
            lessonReservation?.lessonId != null &&
            lessonReservation?.lessonProgramGroupId != null
            ? {
                pathname: "/groups/[groupId]/lessons/[lessonId]",
                params: {
                    groupId: String(lessonReservation.lessonProgramGroupId),
                    lessonId: String(lessonReservation.lessonId),
                },
            }
            : null;
    const lessonLogHref =
        !isBayReservation && lessonReservation?.lessonLog?.id != null
            ? {
                pathname: "/lesson-log/[id]",
                params: {
                    id: String(lessonReservation.lessonLog.id),
                },
            }
            : null;
    const lessonLogValue = isBayReservation
        ? ""
        : lessonReservation?.lessonLog?.name?.trim() ||
        t("reservations.viewLessonPost");

    const handleCancelReservation = () => {
        if (!canCancelReservation || isCancelling) {
            return;
        }

        if (process.env.EXPO_OS === "ios") {
            void Haptics.selectionAsync();
        }

        setIsCancelSheetVisible(true);
    };

    const handleRescheduleReservation = () => {
        if (!canRescheduleReservation || !reservation.ticket?.id || isLocked) {
            return;
        }

        runWithNavigationLock(() => {
            router.push({
                pathname: "/select-date",
                params: {
                    ticketId: String(reservation.ticket.id),
                    ticketName: reservation.ticket.name,
                    ticketType: reservation.ticket.type,
                    mode: "reschedule",
                    reservationId: String(reservation.id),
                    notes: reservation.memberNotes ?? "",
                },
            });
        });
    };

    const confirmCancelReservation = () => {
        if (!canCancelReservation || isCancelling || cancelLocked.current) {
            return;
        }

        cancelLocked.current = true;
        if (isBayReservation) {
            cancelBayReservation(reservation.id, {
                onSuccess: handleCancellationSuccess,
                onSettled: () => { cancelLocked.current = false; },
            });
            return;
        }

        cancelLessonReservation(reservation.id, {
            onSuccess: handleCancellationSuccess,
            onSettled: () => { cancelLocked.current = false; },
        });
    };

    const closeCancelSheet = () => { if (!cancelLocked.current) setIsCancelSheetVisible(false); };

    const handleCancellationSuccess = () => {
        setIsCancelSheetVisible(false);
        if (process.env.EXPO_OS === "android") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (process.env.EXPO_OS === "ios") {
            void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
            );
        }

        router.dismissTo("/reservation");
    };

    return (
        <>
            <Stack.Screen options={screenOptions} />
            <BottomSheet
                isPresented={isCancelSheetVisible}
                onDismiss={closeCancelSheet}
                shouldDismissOnBackPress={!isCancelling}
                shouldDismissOnClickOutside={!isCancelling}
                modifiers={process.env.EXPO_OS === "ios" ? [interactiveDismissDisabled(isCancelling), presentationCornerRadius(24)] : undefined}
                containerColor={uiColors.card}
                contentColor={uiColors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <Column spacing={20} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                    <Column spacing={8} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                        <Text textStyle={{ ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale, color: uiColors.danger, fontSize: typography.h3.fontSize * uiFontScale }}>{t("reservations.cancelTitle")}</Text>
                        <Text textStyle={{ ...typography.muted, lineHeight: typography.muted.lineHeight * uiFontScale, color: uiColors.mutedForeground, fontSize: typography.muted.fontSize * uiFontScale }}>{t("reservations.cancelMessage")}</Text>
                    </Column>
                    <Column spacing={12} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity })] : [fillMaxWidth()]}>
                        <Button variant="text" disabled={isCancelling} onPress={confirmCancelReservation} style={getNativeButtonStyle(uiColors, "filled", isCancelling, uiColors.danger)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Row spacing={8} alignment="center" modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}>
                                <Spacer flexible />
                                {isCancelling ? <RNHostView matchContents><ActivityIndicator color={uiColors.primaryForeground} /></RNHostView> : null}
                                <Text textStyle={{ textAlign: "center", ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: uiColors.primaryForeground, fontSize: typography.label.fontSize * uiFontScale }}>{t("reservations.cancelTitle")}</Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                        <Button variant="text" disabled={isCancelling} onPress={closeCancelSheet} style={getNativeButtonStyle(uiColors, "text", isCancelling)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Text modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]} textStyle={{ ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: uiColors.foreground, fontSize: typography.label.fontSize * uiFontScale, textAlign: "center" }}>{t("reservations.keepReservation")}</Text>
                        </Button>
                    </Column>
                </Column>
            </BottomSheet>
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl
                        refreshing={isPullRefreshing}
                        onRefresh={handlePullRefresh}
                    />
                }
                footer={
                    canCancelReservation || canRescheduleReservation ? (
                        <View className="gap-3 pb-8 pt-4">
                            {canRescheduleReservation ? (
                                <Host
                                    matchContents={{ vertical: true }}
                                    ignoreSafeArea="all"
                                    colorScheme={uiScheme}
                                    seedColor={uiColors.primary}
                                    style={{ width: "100%", borderRadius: 12 }}
                                    accessibilityLabel={t(
                                        "reservations.reschedule",
                                    )}
                                    accessibilityState={{
                                        disabled: isLocked,
                                        busy: false,
                                    }}
                                >
                                    <Button
                                        modifiers={
                                            process.env.EXPO_OS === "ios"
                                                ? [
                                                    frame({
                                                        maxWidth: Infinity,
                                                        minHeight: 48,
                                                    }),
                                                ]
                                                : [
                                                    fillMaxWidth(),
                                                    defaultMinSize({
                                                        minHeight: 48,
                                                    }),
                                                ]
                                        }
                                        variant="text"
                                        disabled={isLocked}
                                        onPress={handleRescheduleReservation}
                                        style={{
                                            ...getNativeButtonStyle(
                                                uiColors,
                                                "outlined",
                                                isLocked,
                                                uiColors.primary,
                                            ), ...{ borderRadius: 12 }
                                        }}
                                    >
                                        <Text
                                            modifiers={
                                                process.env.EXPO_OS === "ios"
                                                    ? [
                                                        frame({
                                                            maxWidth: Infinity, minHeight: 48,
                                                        }),
                                                    ]
                                                    : [fillMaxWidth()]
                                            }
                                            textStyle={{
                                                ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                                textAlign: "center",
                                                color: uiColors.foreground,
                                                fontSize:
                                                    typography.label.fontSize *
                                                    uiFontScale,
                                            }}
                                        >
                                            {t("reservations.reschedule")}
                                        </Text>
                                    </Button>
                                </Host>
                            ) : null}

                            {canCancelReservation ? (
                                <Host
                                    matchContents={{ vertical: true }}
                                    ignoreSafeArea="all"
                                    colorScheme={uiScheme}
                                    seedColor={uiColors.danger}
                                    style={{ width: "100%", borderRadius: 12 }}
                                    accessibilityLabel={t(
                                        "reservations.cancelTitle",
                                    )}
                                    accessibilityState={{
                                        disabled: isCancelling || isCancelling,
                                        busy: isCancelling,
                                    }}
                                >
                                    <Button
                                        modifiers={
                                            process.env.EXPO_OS === "ios"
                                                ? [
                                                    frame({
                                                        maxWidth: Infinity,
                                                        minHeight: 48,
                                                    }),
                                                ]
                                                : [
                                                    fillMaxWidth(),
                                                    defaultMinSize({
                                                        minHeight: 48,
                                                    }),
                                                ]
                                        }
                                        variant="text"
                                        disabled={isCancelling || isCancelling}
                                        onPress={handleCancelReservation}
                                        style={{
                                            ...getNativeButtonStyle(
                                                uiColors,
                                                "filled",
                                                isCancelling || isCancelling,
                                                uiColors.danger,
                                            ), ...{ borderRadius: 12 }
                                        }}
                                    >
                                        <Row
                                            modifiers={
                                                process.env.EXPO_OS === "ios"
                                                    ? [
                                                        frame({
                                                            maxWidth: Infinity, minHeight: 48,
                                                        }),
                                                    ]
                                                    : [fillMaxWidth()]
                                            }
                                            spacing={8}
                                            alignment="center"
                                        >
                                            <Spacer flexible />
                                            {isCancelling ? (
                                                <RNHostView matchContents>
                                                    <ActivityIndicator
                                                        color={
                                                            uiColors.primaryForeground
                                                        }
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
                                                        typography.label
                                                            .fontSize *
                                                        uiFontScale,
                                                }}
                                            >
                                                {t("reservations.cancelTitle")}
                                            </Text>
                                            <Spacer flexible />
                                        </Row>
                                    </Button>
                                </Host>
                            ) : null}
                        </View>
                    ) : null
                }
            >
                <View className="grow flex-col gap-6 bg-background">
                    <HeaderSection
                        title={title}
                        reservationStatus={reservation.reservationStatus}
                        ticketType={reservation.ticket?.type ?? null}
                    />

                    <ReservationContent policies={policies}>
                        <DetailRow
                            label={t("bookingConfirmation.dateLabel")}
                            value={dateValue}
                        />

                        <Divider className="bg-border" />

                        <DetailRow
                            label={t("bookingConfirmation.timeLabel")}
                            value={timeValue}
                        />

                        {isBayReservation ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t("reservations.bayLabel")}
                                    value={title}
                                />
                            </>
                        ) : null}

                        {programValue !== "-" ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t("reservations.programLabel")}
                                    value={programValue}
                                />
                            </>
                        ) : null}

                        {isBayReservation ? null : (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t("reservations.coachLabel")}
                                    value={coachName}
                                    leftElement={<Avatar name={coachName} imageUrl={lessonReservation?.coach?.profileImage} />}
                                />
                            </>
                        )}

                        {lessonNameValue ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t("reservations.lessonLabel")}
                                    value={lessonNameValue}
                                    disabled={isLocked}
                                    onPress={
                                        lessonDetailsHref
                                            ? () => {
                                                runWithNavigationLock(
                                                    () => {
                                                        router.push(
                                                            lessonDetailsHref as Href,
                                                        );
                                                    },
                                                );
                                            }
                                            : undefined
                                    }
                                />
                            </>
                        ) : null}

                        {lessonLogHref ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t(
                                        "reservations.lessonPostLabel",
                                    )}
                                    value={lessonLogValue}
                                    disabled={isLocked}
                                    onPress={() => {
                                        runWithNavigationLock(() => {
                                            router.push(
                                                lessonLogHref as Href,
                                            );
                                        });
                                    }}
                                />
                            </>
                        ) : null}

                        <Divider className="bg-border" />
                        <DetailRow
                            label={t("reservations.notesLabel")}
                            value={noteValue}
                        />
                    </ReservationContent>
                </View>
            </Screen>
        </>
    );
}

function ReservationPreviewScreen({ preview }: { preview: MemberReservationDetailPreview }) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const reservation = preview.reservation;
    const isBayReservation = reservation.reservationType === "bay";
    const title = (isBayReservation
        ? reservation.bayName
        : reservation.lessonAvailabilityName ?? reservation.lessonProgramGroupName ?? reservation.lessonProgramName
    )?.trim() || t("common.notAvailable");
    const programValue = isBayReservation
        ? ""
        : [reservation.lessonProgramName, reservation.lessonProgramGroupName]
            .filter(Boolean)
            .join(" / ");
    const policies = getReservationPolicies(t);

    return (
        <>
            <Stack.Screen options={{ title: t("reservations.reservationDetailTitle") }} />
            <Screen contentClassName="grow">
                <View className="grow flex-col gap-6 bg-background">
                    <HeaderSection
                        title={title}
                        reservationStatus={reservation.reservationStatus}
                        ticketType={reservation.ticketType}
                    />
                    <ReservationContent policies={isBayReservation ? policies.bay : policies.lesson}>
                        <DetailRow
                            label={t("bookingConfirmation.dateLabel")}
                            value={formatDateForDisplay(reservation.startTime) || "-"}
                        />
                        <Divider className="bg-border" />
                        <DetailRow
                            label={t("bookingConfirmation.timeLabel")}
                            value={formatTimeRange(reservation.startTime, reservation.endTime)}
                        />
                        {isBayReservation ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow label={t("reservations.bayLabel")} value={title} />
                            </>
                        ) : null}
                        {programValue ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow label={t("reservations.programLabel")} value={programValue} />
                            </>
                        ) : null}
                        <Divider className="bg-border" />
                        <DetailRow
                            label={t("reservations.notesLabel")}
                            value={reservation.memberNotes?.trim() || "-"}
                        />
                        <View className="items-center py-4">
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    </ReservationContent>
                </View>
            </Screen>
        </>
    );
}

function HeaderSection({
    title,
    reservationStatus,
    ticketType,
}: {
    title: string;
    reservationStatus?: string | null;
    ticketType?: string | null;
}) {

    const { t } = useTranslation();
    const ticketTone = ticketType ? getTicketTypeTone(ticketType) : null;

    return (
        <View className="flex-col gap-3">
            {ticketType && ticketTone ? (
                <View className="flex-row flex-wrap">
                    <Badge
                        label={formatTicketTypeLabel(ticketType, t)}
                        className={`${ticketTone.badgeClassName} px-2 py-0.5`}
                        color={ticketTone.color}
                    />
                </View>
            ) : null}

            <NativeText variant="h3">
                {title}
            </NativeText>

            <ReservationStatusBanner reservationStatus={reservationStatus} />
        </View>
    );
}

function ReservationStatusBanner({
    reservationStatus,
}: {
    reservationStatus?: string | null;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const statusLabel = formatType(reservationStatus);
    const statusColor = getReservationStatusColor(colors, reservationStatus);

    if (statusLabel === "-") {
        return null;
    }

    return (
        <View className="flex-row items-center gap-2">
            <NativeText variant="label" color="mutedForeground" wrap={false}>
                {t("reservations.statusLabel") + ":"}
            </NativeText>
            <NativeText
                variant="h3"
                wrap={false}
                textStyle={{ color: statusColor, fontSize: typography.subtitle.fontSize, fontWeight: "700" as const }}
            >
                {statusLabel}
            </NativeText>
        </View>
    );
}

function DetailRow({
    label,
    value,
    disabled = false,
    leftElement,
    onPress,
}: {
    label: string;
    value: string;
    disabled?: boolean;
    leftElement?: ReactNode;
    onPress?: () => void;
}) {
    const colors = useThemeColors();

    const content = (
        <ReservationDetailField
            label={label}
            value={value}
            selectable
            leftElement={leftElement}
            trailingElement={onPress ? <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={2.25} /> : undefined}
        />
    );

    if (!onPress) {
        return content;
    }

    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled}
            style={({ pressed }) =>
                getPressedScaleStyle(pressed, disabled, 0.994)
            }
            onPressIn={() => {
                if (!disabled && process.env.EXPO_OS === "ios") {
                    void Haptics.selectionAsync();
                }
            }}
            onPress={onPress}
        >
            {content}
        </Pressable>
    );
}

function Avatar({
    name,
    imageUrl,
}: {
    name: string;
    imageUrl?: string | null;
}) {

    if (imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                cachePolicy="memory-disk"
                recyclingKey={imageUrl}
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                }}
                contentFit="cover"
                transition={150}
            />
        );
    }

    return (
        <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <NativeText
                variant="body"
                color="secondaryForeground"
                wrap={false}
                textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "700" as const }}
            >
                {name?.charAt(0).toUpperCase() || "?"}
            </NativeText>
        </View>
    );
}
