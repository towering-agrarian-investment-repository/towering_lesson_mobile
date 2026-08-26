import {
    ReservationFieldLabel,
    ReservationFieldValue,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import {
    AppText,
    Badge,
    Button,
    ConfirmSheet,
    Divider,
    EmptyState,
    ErrorState,
    getPressedScaleStyle,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import {
    MemberReservationDetailResponse,
    useCancelMemberBayReservation,
    useCancelMemberLessonReservation,
    useMemberReservationById,
} from "@/lib/hook/useReservation";
import { MemberBayReservationResponse } from "@/types/member-bay";
import { MemberLessonReservationResponse } from "@/types/member-lesson";
import { MemberReservationDomain } from "@/types/member-reservation";
import { formatType } from "@/utils/format-enum";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";
import { showAppToast } from "@/lib/toast/toast";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Href, Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Pressable,
    RefreshControl,
    View,
} from "react-native";

type ReservationParams = {
    id: string;
    type?: string;
    success?: string;
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
    t: (key: string, options?: Record<string, unknown>) => string,
) {
    if (isBayReservationDetail(reservation)) {
        return reservation.bayName || t("reservations.bayReservationWithId", {
            id: reservation.id,
        });
    }

    return (
        reservation.lessonAvailability?.name ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        t("reservations.reservationFallbackWithId", { id: reservation.id })
    );
}

function getReservationStatusTone(
    colors: ReturnType<typeof useThemeColors>,
    value?: string | null,
) {
    switch (value) {
        case "RESERVED":
            return {
                backgroundClassName: "bg-primary/10",
                textClassName: "text-primary",
                mutedClassName: "text-primary",
                color: colors.primary,
            };
        case "CHECKED_IN":
            return {
                backgroundClassName: "bg-success/10",
                textClassName: "text-success",
                mutedClassName: "text-success",
                color: colors.success,
            };
        case "COMPLETED":
            return {
                backgroundClassName: "bg-success/10",
                textClassName: "text-success",
                mutedClassName: "text-success",
                color: colors.success,
            };
        case "CANCELLED":
        case "CANCELED":
            return {
                backgroundClassName: "bg-danger/10",
                textClassName: "text-danger",
                mutedClassName: "text-danger",
                color: colors.danger,
            };
        case "NO_SHOW":
            return {
                backgroundClassName: "bg-warning/10",
                textClassName: "text-warning",
                mutedClassName: "text-warning",
                color: colors.warning,
            };
        default:
            return {
                backgroundClassName: "bg-muted",
                textClassName: "text-foreground",
                mutedClassName: "text-muted-foreground",
                color: colors.foreground,
            };
    }
}

function getReservationPolicies(t: (key: string) => string) {
    return {
        lesson: [
            {
                title: t("bookingConfirmation.lessonCancellationPolicyTitle"),
                description: t("bookingConfirmation.lessonCancellationPolicyDescription"),
            },
            {
                title: t("bookingConfirmation.lessonNoShowPolicyTitle"),
                description: t("bookingConfirmation.lessonNoShowPolicyDescription"),
            },
        ],
        bay: [
            {
                title: t("bookingConfirmation.bayCancellationPolicyTitle"),
                description: t("bookingConfirmation.bayCancellationPolicyDescription"),
            },
            {
                title: t("bookingConfirmation.bayNoShowPolicyTitle"),
                description: t("bookingConfirmation.bayNoShowPolicyDescription"),
            },
        ],
    } as const;
}

export default function ReservationDetailScreen() {
    const { t } = useTranslation();
    const { id, type, success } = useLocalSearchParams<ReservationParams>();

    const colors = useThemeColors();
    const router = useRouter();
    const canGoBack = router.canGoBack();
    const [isCancelSheetVisible, setIsCancelSheetVisible] = useState(false);

    const reservationType = isReservationDomain(type) ? type : undefined;

    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberReservationById(Number(id), reservationType);

    const reservation = data?.data;

    const { mutate: cancelLessonReservation, isPending: isCancellingLesson } =
        useCancelMemberLessonReservation();

    const { mutate: cancelBayReservation, isPending: isCancellingBay } =
        useCancelMemberBayReservation();


    const screenOptions = {
        title: t("reservations.reservationDetailTitle"),
        headerLeft: () => (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                    canGoBack ? t("reservations.goBack") : t("reservations.backToList")
                }
                className="pr-3"
                onPress={() => {
                    if (canGoBack) {
                        router.back();
                        return;
                    }

                    router.replace("/reservation");
                }}
            >
                <ChevronLeft
                    size={20}
                    color={colors.foreground}
                    strokeWidth={2.25}
                />
            </Pressable>
        ),
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

    if (isError) {
        return (
            <>
                <Stack.Screen options={screenOptions} />

                <Screen
                    contentClassName="grow"
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => {
                                void refetch();
                            }}
                        />
                    }
                >
                    <ErrorState
                        title={t("reservations.failedDetailTitle")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                        onAction={() => {
                            void refetch();
                        }}
                    />
                </Screen>
            </>
        );
    }

    if (!reservation) {
        return (
            <>
                <Stack.Screen options={screenOptions} />

                <Screen
                    contentClassName="grow"
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => {
                                void refetch();
                            }}
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
                            router.replace("/reservation");
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

    const canCancelReservation = reservation.reservationStatus === "RESERVED" && reservation.isCancellable;
    const canRescheduleReservation =
        isBayReservation &&
        reservation.isCancellable;
    const isCancelling = isBayReservation ? isCancellingBay : isCancellingLesson;

    const title = getReservationTitle(reservation, t);
    const dateValue = formatDateForDisplay(reservation.startTime) || "-";
    const timeValue = formatTimeRange(reservation.startTime, reservation.endTime);
    const reservationLocationValue = isBayReservation
        ? reservation.bayName || t("reservations.bayWithId", { id: reservation.baySlot.bayId })
        : lessonReservation?.lessonAvailability?.name ??
        lessonReservation?.lessonProgramGroupName ??
        lessonReservation?.lessonProgramName ??
        "-";

    const lessonNameValue = isBayReservation
        ? null
        : lessonReservation?.lessonProgramEnrollmentId != null
            ? lessonReservation.lessonName?.trim() || "-"
            : null;

    const programValue = isBayReservation
        ? "-"
        : [lessonReservation?.lessonProgramName, lessonReservation?.lessonProgramGroupName]
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
        !isBayReservation &&
            lessonReservation?.lessonLog?.id != null
            ? {
                pathname: "/lesson-log/[id]",
                params: {
                    id: String(lessonReservation.lessonLog.id),
                },
            }
            : null;
    const lessonLogValue = isBayReservation
        ? ""
        : lessonReservation?.lessonLog?.name?.trim() || t("reservations.viewLessonPost");

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
        if (!canRescheduleReservation || !reservation.ticket?.id) {
            return;
        }

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
    };

    const confirmCancelReservation = () => {
        if (!canCancelReservation || isCancelling) {
            return;
        }

        if (isBayReservation) {
            cancelBayReservation(reservation.id, {
                onSuccess: handleCancellationSuccess,
            });
            return;
        }

        cancelLessonReservation(reservation.id, {
            onSuccess: handleCancellationSuccess,
        });
    };

    const handleCancellationSuccess = () => {
        if (process.env.EXPO_OS === "android") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (process.env.EXPO_OS === "ios") {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        setIsCancelSheetVisible(false);
        showAppToast({
            message: t("reservations.reservationCancelled"),
            type: "success",
        });
        router.replace("/reservation");
    };

    return (
        <>
            <Stack.Screen options={screenOptions} />

            <ConfirmSheet
                visible={isCancelSheetVisible}
                title={t("reservations.cancelTitle")}
                message={t("reservations.cancelMessage")}
                confirmLabel={t("reservations.cancelTitle")}
                cancelLabel={t("reservations.keepReservation")}
                variant="danger"
                loading={isCancelling}
                onClose={() => {
                    if (!isCancelling) {
                        setIsCancelSheetVisible(false);
                    }
                }}
                onConfirm={confirmCancelReservation}
            />

            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                }
                footer={
                    canCancelReservation || canRescheduleReservation ? (
                        <View className="gap-3 border-t border-border bg-background px-6 pb-8 pt-4">
                            {canRescheduleReservation ? (
                                <Button
                                    title={t("reservations.reschedule")}
                                    variant="secondary"
                                    className="rounded-xl"
                                    onPress={handleRescheduleReservation}
                                />
                            ) : null}

                            {canCancelReservation ? (
                                <Button
                                    title={t("reservations.cancelTitle")}
                                    variant="danger"
                                    loading={isCancelling}
                                    className="rounded-xl"
                                    onPress={handleCancelReservation}
                                    disabled={isCancelling}
                                />
                            ) : null}
                        </View>
                    ) : null
                }
            >
                <View className="flex-1 flex-col gap-6 bg-background">
                    <HeaderSection
                        title={title}
                        reservationStatus={reservation.reservationStatus}
                        ticketType={reservation.ticket?.type ?? null}
                        showStatus={success !== "true"}
                    />

                    {success === "true" ? (
                        <ReservationSuccessBanner
                            title={t("reservations.confirmedTitle")}
                            message={t("reservations.confirmedMessage")}
                        />
                    ) : null}

                    <View className="flex-col gap-2">
                        <View className="flex-col">

                            <DetailRow label={t("bookingConfirmation.dateLabel")} value={dateValue} />

                            <Divider className="bg-border" />

                            <DetailRow label={t("bookingConfirmation.timeLabel")} value={timeValue} />

                            {isBayReservation ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow
                                        label={t("reservations.bayLabel")}
                                        value={reservationLocationValue}
                                    />
                                </>
                            ) : null}

                            {programValue !== "-" ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow label={t("reservations.programLabel")} value={programValue} />
                                </>
                            ) : null}

                            {isBayReservation ? null : (
                                <>
                                    <Divider className="bg-border" />
                                    <CoachDetailRow
                                        label={t("reservations.coachLabel")}
                                        value={coachName}
                                        imageUrl={
                                            lessonReservation?.coach?.profileImage
                                        }
                                    />
                                </>
                            )}

                            {lessonNameValue ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow
                                        label={t("reservations.lessonLabel")}
                                        value={lessonNameValue}
                                        href={lessonDetailsHref}
                                    />
                                </>
                            ) : null}

                            {lessonLogHref ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow
                                        label={t("reservations.lessonPostLabel")}
                                        value={lessonLogValue}
                                        href={lessonLogHref}
                                    />
                                </>
                            ) : null}

                            <>
                                <Divider className="bg-border" />
                                <DetailRow
                                    label={t("reservations.notesLabel")}
                                    value={noteValue}
                                />
                            </>
                        </View>
                    </View>

                    <View className="flex-col gap-2">
                        <ReservationPoliciesSection policies={policies} />
                    </View>
                </View>
            </Screen>
        </>
    );
}

function ReservationSuccessBanner({
    title,
    message,
}: {
    title: string;
    message: string;
}) {
    const colors = useThemeColors();

    return (
        <View className="flex-row items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
            <CheckCircle2 size={24} color={colors.success} strokeWidth={2.5} />
            <View className="flex-1 gap-0.5">
                <AppText variant="label" className="text-success">
                    {title}
                </AppText>
                {message ? (
                    <AppText variant="caption" className="text-success">
                        {message}
                    </AppText>
                ) : null}
            </View>
        </View>
    );
}

function HeaderSection({
    title,
    reservationStatus,
    ticketType,
    showStatus = true,
}: {
    title: string;
    reservationStatus?: string | null;
    ticketType?: string | null;
    showStatus?: boolean;
}) {
    const ticketTone = ticketType ? getTicketTypeTone(ticketType) : null;

    return (
        <View className="flex-col gap-3">
            {ticketType && ticketTone ? (
                <View className="flex-row flex-wrap">
                    <Badge
                        label={formatTicketTypeLabel(ticketType)}
                        className={`${ticketTone.badgeClassName} px-2 py-0.5`}
                        textClassName={`${ticketTone.badgeTextClassName} text-xs font-semibold leading-4`}
                    />
                </View>
            ) : null}

            <AppText
                variant="h3"
                selectable
                className="text-foreground"
            >
                {title}
            </AppText>

            {showStatus ? (
                <ReservationStatusBanner reservationStatus={reservationStatus} />
            ) : null}
        </View>
    );
}

function ReservationStatusBanner({
    reservationStatus,
}: {
    reservationStatus?: string | null;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const statusLabel = formatType(reservationStatus);
    const statusTone = getReservationStatusTone(colors, reservationStatus);

    if (statusLabel === "-") {
        return null;
    }

    return (
        <View className="flex-row items-center gap-2">
            <AppText variant="label" className="text-muted-foreground">
                {t("reservations.statusLabel")}
                {":"}
            </AppText>
            <AppText
                variant="h3"
                className={`text-lg font-bold leading-7 ${statusTone.textClassName}`}
            >
                {statusLabel}
            </AppText>
        </View>
    );
}

function DetailRow({
    label,
    value,
    href,
}: {
    label: string;
    value: string;
    href?: {
        pathname: string;
        params: Record<string, string>;
    } | null;
}) {
    const colors = useThemeColors();

    const content = (
        <View className="flex-col gap-2 py-3">
            <ReservationFieldLabel>
                {label}
            </ReservationFieldLabel>

            <View className="min-w-0 flex-row items-center justify-between gap-3">
                <ReservationFieldValue
                    selectable
                    className="min-w-0 flex-1"
                >
                    {value}
                </ReservationFieldValue>

                {href ? (
                    <ChevronRight
                        size={18}
                        color={colors.mutedForeground}
                        strokeWidth={2.25}
                    />
                ) : null}
            </View>
        </View>
    );

    if (!href) {
        return content;
    }

    return (
        <Link href={href as Href} asChild>
            <Pressable
                style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.994)}
                onPressIn={() => {
                    if (process.env.EXPO_OS === "ios") {
                        void Haptics.selectionAsync();
                    }
                }}
            >
                {content}
            </Pressable>
        </Link>
    );
}

function CoachDetailRow({
    label,
    value,
    imageUrl,
}: {
    label: string;
    value: string;
    imageUrl?: string | null;
}) {
    return (
        <View className="flex-col gap-2 py-3">
            <ReservationFieldLabel>
                {label}
            </ReservationFieldLabel>

            <View className="min-w-0 flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-3">
                    <View className="shrink-0">
                        <Avatar name={value} imageUrl={imageUrl} />
                    </View>

                    <ReservationFieldValue
                        selectable
                        className="min-w-0 flex-1"
                    >
                        {value}
                    </ReservationFieldValue>
                </View>
            </View>
        </View>
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
            <AppText className="text-xs font-bold text-secondary-foreground">
                {name?.charAt(0).toUpperCase() || "?"}
            </AppText>
        </View>
    );
}
