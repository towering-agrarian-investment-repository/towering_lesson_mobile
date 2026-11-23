import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { TicketTypeIcon } from "@/components/golf/TicketTypeIcon";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { AppText } from "@/design-system/components/AppText";
import { NativeText } from "@/design-system/components/NativeText";
import { colorWithOpacity } from "@/design-system/utils/color";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import {
    ReservationContent,
    ReservationDetailField,
} from "@/components/golf/reservation/ReservationSections";
import {
    ActionButton,
    cn,
    Divider,
    EmptyState,
    ErrorState,
    AnimatedPressable,
    Screen,
    Skeleton,
    triggerSelectionHaptic,
    triggerSuccessHaptic,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
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
import { getReservationStatusColor, getReservationStatusLabel } from "@/utils/status-tone";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { Button, Column, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, shapes, frame, presentationCornerRadius } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    RefreshControl,
    View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

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
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const { id, type } = useLocalSearchParams<ReservationParams>();

    const [isCancelSheetVisible, setIsCancelSheetVisible] = useState(false);
    const cancelLocked = useRef(false);
    const router = useRouter();
    const queryClient = useQueryClient();
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

    if (isLoading) {
        return (
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
        );
    }

    if (isError && (!data || "isListPreview" in data.data)) {
        return (
            <Screen
                contentClassName="grow"
                bottomPadding={16}
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
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (reservation && "isListPreview" in reservation) {
        return <ReservationPreviewScreen preview={reservation} />;
    }

    if (!reservation) {
        return (
            <Screen
                contentClassName="grow"
                bottomPadding={16}
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
        isBayReservation &&
        reservation.isCancellable &&
        Boolean(reservation.ticket?.id);
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

        triggerSelectionHaptic();
        setIsCancelSheetVisible(true);
    };

    const handleRescheduleReservation = () => {
        if (!canRescheduleReservation || !reservation.ticket?.id || isLocked) {
            return;
        }

        triggerSelectionHaptic();
        prefetchTicketAvailability(queryClient, reservation.ticket);
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
        triggerSuccessHaptic();
        router.dismissTo("/reservation");
    };

    return (
        <>
            <PendingBottomSheet
                isPresented={isCancelSheetVisible}
                onDismiss={closeCancelSheet}
                dismissDisabled={isCancelling}
                modifiers={process.env.EXPO_OS === "ios" ? [presentationCornerRadius(24)] : undefined}
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
                            <Row spacing={8} alignment="center" modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 }), contentShape(shapes.rectangle())] : [fillMaxWidth()]}>
                                <Spacer flexible />
                                {isCancelling ? <RNHostView matchContents><ActivityIndicator color={uiColors.primaryForeground} /></RNHostView> : null}
                                <Text textStyle={{ textAlign: "center", ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: uiColors.primaryForeground, fontSize: typography.label.fontSize * uiFontScale }}>{t("reservations.cancelTitle")}</Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                        <Button variant="text" disabled={isCancelling} onPress={closeCancelSheet} style={getNativeButtonStyle(uiColors, "text", isCancelling)} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}>
                            <Text modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 }), contentShape(shapes.rectangle())] : [fillMaxWidth()]} textStyle={{ ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontWeight: "600", color: uiColors.foreground, fontSize: typography.label.fontSize * uiFontScale, textAlign: "center" }}>{t("reservations.keepReservation")}</Text>
                        </Button>
                    </Column>
                </Column>
            </PendingBottomSheet>
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
                        <View className="gap-3">
                            {canRescheduleReservation ? (
                                <ActionButton
                                    label={t("reservations.reschedule")}
                                    disabled={isLocked}
                                    onPress={handleRescheduleReservation}
                                />
                            ) : null}

                            {canCancelReservation ? (
                                <ActionButton
                                    label={t("reservations.cancelTitle")}
                                    tone="danger"
                                    disabled={isCancelling}
                                    loading={isCancelling}
                                    onPress={handleCancelReservation}
                                />
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

                        {reservation.ticket?.id && reservation.ticket?.name ? (
                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t("bookingConfirmation.ticketLabel")}
                                    value={reservation.ticket.name}
                                    disabled={isLocked}
                                    onPress={() => {
                                        runWithNavigationLock(() => {
                                            router.push({
                                                pathname: "/tickets/[id]",
                                                params: {
                                                    id: String(reservation.ticket!.id),
                                                },
                                            });
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
                        <View className="gap-3 py-2" accessibilityLiveRegion="polite" accessibilityLabel={t("reservations.loadingDetail")}>
                            <View className="flex-row items-center justify-between gap-4">
                                <Skeleton className="h-4 w-24 rounded-md" />
                                <Skeleton className="h-4 w-36 rounded-md" />
                            </View>
                            <View className="flex-row items-center justify-between gap-4">
                                <Skeleton className="h-4 w-20 rounded-md" />
                                <Skeleton className="h-4 w-28 rounded-md" />
                            </View>
                        </View>
                    </ReservationContent>
                </View>
            </Screen>
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
    const { colors } = useTheme();
    const { t } = useTranslation();
    const ticketTone = ticketType ? getTicketTypeTone(ticketType) : null;
    const typeLabel = ticketType ? formatTicketTypeLabel(ticketType, t) : null;
    const statusLabel = getReservationStatusLabel(reservationStatus, t);
    const statusColor = getReservationStatusColor(colors, reservationStatus);

    return (
        <View className="flex-col gap-2.5">
            {ticketTone || statusLabel !== "-" ? (
                <View className="flex-row items-center justify-between gap-2">
                    <View className="min-w-0 flex-1 flex-row items-center gap-2">
                        {ticketType && ticketTone ? (
                            <>
                                <View
                                    className={cn(
                                        "h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                        ticketTone.badgeClassName,
                                    )}
                                >
                                    <TicketTypeIcon
                                        type={ticketType}
                                        size={15}
                                        color={colors[ticketTone.color]}
                                        strokeWidth={2.2}
                                    />
                                </View>
                                {typeLabel ? (
                                    <AppText
                                        variant="meta"
                                        color="mutedForeground"
                                        numberOfLines={1}
                                        style={{ flex: 1, minWidth: 0 }}
                                        textStyle={{ fontWeight: "600" }}
                                    >
                                        {typeLabel}
                                    </AppText>
                                ) : null}
                            </>
                        ) : null}
                    </View>

                    {statusLabel !== "-" ? (
                        <View
                            className="shrink-0 rounded-md px-2.5 py-1"
                            style={{
                                backgroundColor: colorWithOpacity(
                                    statusColor,
                                    0.12,
                                ),
                            }}
                        >
                            <AppText
                                variant="badge"
                                wrap={false}
                                textStyle={{
                                    color: statusColor,
                                    fontWeight: "600",
                                }}
                            >
                                {statusLabel}
                            </AppText>
                        </View>
                    ) : null}
                </View>
            ) : null}

            <NativeText variant="h2" textStyle={{ fontWeight: "700" }}>
                {title}
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
        <AnimatedPressable
            accessibilityRole="button"
            disabled={disabled}
            haptic="selection"
            onPress={onPress}
        >
            {content}
        </AnimatedPressable>
    );
}

function Avatar({
    name,
    imageUrl,
}: {
    name: string;
    imageUrl?: string | null;
}) {
    const reducedMotion = useReducedMotion();

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
                transition={reducedMotion ? 0 : 150}
            />
        );
    }

    return (
        <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
            <NativeText
                variant="body"
                color="foreground"
                wrap={false}
                textStyle={{ lineHeight: typography.caption.lineHeight, fontSize: typography.caption.fontSize, fontWeight: "700" as const }}
            >
                {name?.charAt(0).toUpperCase() || "?"}
            </NativeText>
        </View>
    );
}
