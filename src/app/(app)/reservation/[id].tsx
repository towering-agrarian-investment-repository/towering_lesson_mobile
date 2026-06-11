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
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Href, Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import {
    Pressable,
    RefreshControl,
    View,
} from "react-native";

type ReservationParams = {
    id: string;
    type?: string;
};

const RESERVATION_POLICIES = {
    lesson: [
        {
            title: "Cancellation Policy",
            description:
                "Lesson reservations can only be cancelled up to 3 hours before the reservation time.",
        },
        {
            title: "No-show Policy",
            description: "A no-show will result in one lesson ticket deduction.",
        },
    ],
    bay: [
        {
            title: "Cancellation Policy",
            description:
                "Bay reservations can only be cancelled up to 3 hours before the reservation time.",
        },
        {
            title: "No-show Policy",
            description: "A no-show will result in one bays ticket deduction.",
        },
    ],
} as const;

const BANNER_STYLE = {
    borderCurve: "continuous" as const,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
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

function getReservationTitle(reservation: MemberReservationDetailResponse) {
    if (isBayReservationDetail(reservation)) {
        return reservation.bayName || `Bay Reservation #${reservation.id}`;
    }

    return (
        reservation.lessonAvailability?.name ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        `Reservation #${reservation.id}`
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

function getReservationStatusDescription(value?: string | null) {
    switch (value) {
        case "RESERVED":
            return "Awaiting check-in";
        case "CHECKED_IN":
            return "Checked in and active";
        case "COMPLETED":
            return "Session completed";
        case "CANCELLED":
        case "CANCELED":
            return "Reservation cancelled";
        case "NO_SHOW":
            return "Marked absent";
        default:
            return "Status unavailable";
    }
}

export default function ReservationDetailScreen() {
    const { id, type } = useLocalSearchParams<ReservationParams>();

    const colors = useThemeColors();
    const router = useRouter();
    const canGoBack = router.canGoBack();
    const [isCancelSheetVisible, setIsCancelSheetVisible] = useState(false);

    const reservationId = Number(id);
    const reservationType = isReservationDomain(type) ? type : undefined;

    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberReservationById(reservationId, reservationType);

    const reservation = data?.data;

    const { mutate: cancelLessonReservation, isPending: isCancellingLesson } =
        useCancelMemberLessonReservation();

    const { mutate: cancelBayReservation, isPending: isCancellingBay } =
        useCancelMemberBayReservation();

    const screenOptions = {
        title: "Reservation Detail",
        headerLeft: () => (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                    canGoBack ? "Go back" : "Back to reservation list"
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
                        title="Failed to load reservation details"
                        message="Pull to refresh and try again."
                        actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
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
                        title="Reservation not available"
                        message="The requested reservation could not be found."
                    />
                </Screen>
            </>
        );
    }

    const isBayReservation = isBayReservationDetail(reservation);
    const lessonReservation = isLessonReservationDetail(reservation)
        ? reservation
        : null;

    const canCancelReservation = reservation.reservationStatus === "RESERVED";
    const isCancelling = isBayReservation ? isCancellingBay : isCancellingLesson;

    const title = getReservationTitle(reservation);
    const dateValue = formatDateForDisplay(reservation.startTime) || "-";
    const timeValue = formatTimeRange(reservation.startTime, reservation.endTime);
    const reservationLocationValue = isBayReservation
        ? reservation.bayName || `Bay #${reservation.baySlot.bayId}`
        : lessonReservation?.lessonAvailability?.name ??
        lessonReservation?.lessonProgramGroupName ??
        lessonReservation?.lessonProgramName ??
        "-";

    const lessonNameValue = isBayReservation
        ? null
        : lessonReservation?.lessonName?.trim() || "-";

    const programValue = isBayReservation
        ? "-"
        : [lessonReservation?.lessonProgramName, lessonReservation?.lessonProgramGroupName]
            .filter(Boolean)
            .join(" / ") || "-";

    const coachName = isBayReservation
        ? "-"
        : lessonReservation?.coach?.name?.trim() || "-";

    const noteValue = reservation.notes?.trim();

    const policies = isBayReservation
        ? RESERVATION_POLICIES.bay
        : RESERVATION_POLICIES.lesson;

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
        : lessonReservation?.lessonLog?.name?.trim() || "View lesson post";

    const handleCancelReservation = () => {
        if (!canCancelReservation || isCancelling) {
            return;
        }

        if (process.env.EXPO_OS === "ios") {
            void Haptics.selectionAsync();
        }

        setIsCancelSheetVisible(true);
    };

    const confirmCancelReservation = () => {
        if (!canCancelReservation || isCancelling) {
            return;
        }

        if (isBayReservation) {
            cancelBayReservation(reservation.id, {
                onSuccess: () => {
                    router.replace("/reservation");
                },
            });
            return;
        }

        cancelLessonReservation(reservation.id, {
            onSuccess: () => {
                router.replace("/reservation");
            },
        });
    };

    return (
        <>
            <Stack.Screen options={screenOptions} />

            <ConfirmSheet
                visible={isCancelSheetVisible}
                title="Cancel Reservation"
                message="Are you sure you want to cancel this reservation? This action cannot be undone."
                confirmLabel="Cancel Reservation"
                cancelLabel="Keep Reservation"
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
                    canCancelReservation ? (
                        <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                            <Button
                                title="Cancel Reservation"
                                variant="danger"
                                loading={isCancelling}
                                className="rounded-xl"
                                onPress={handleCancelReservation}
                                disabled={isCancelling}
                            />
                        </View>
                    ) : null
                }
            >
                <View className="flex-1 flex-col gap-6 bg-background">
                    <HeaderSection
                        title={title}
                        reservationStatus={reservation.reservationStatus}
                        ticketType={reservation.ticket?.type ?? null}
                    />

                    <View className="flex-col gap-2">
                        <View className="flex-col">

                            <DetailRow label="Date" value={dateValue} />

                            <Divider className="bg-border" />

                            <DetailRow label="Time" value={timeValue} />

                            {isBayReservation ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow
                                        label="Bay"
                                        value={reservationLocationValue}
                                    />
                                </>
                            ) : null}

                            {programValue !== "-" ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow label="Program" value={programValue} />
                                </>
                            ) : null}

                            {isBayReservation ? null : (
                                <>
                                    <Divider className="bg-border" />
                                    <CoachDetailRow
                                        label="Coach"
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
                                        label="Lesson"
                                        value={lessonNameValue}
                                        href={lessonDetailsHref}
                                    />
                                </>
                            ) : null}

                            {lessonLogHref ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow
                                        label="Lesson Post"
                                        value={lessonLogValue}
                                        href={lessonLogHref}
                                    />
                                </>
                            ) : null}

                            {noteValue ? (
                                <>
                                    <Divider className="bg-border" />
                                    <DetailRow
                                        label="Notes"
                                        value={noteValue}
                                    />
                                </>
                            ) : null}
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

function HeaderSection({
    title,
    reservationStatus,
    ticketType,
}: {
    title: string;
    reservationStatus?: string | null;
    ticketType?: string | null;
}) {
    const ticketTone = ticketType ? getTicketTypeTone(ticketType) : null;

    return (
        <View className="flex-col gap-3">
            <AppText
                variant="h3"
                selectable
                className="text-foreground"
            >
                {title}
            </AppText>

            {ticketType && ticketTone ? (
                <View className="flex-row flex-wrap">
                    <Badge
                        label={formatTicketTypeLabel(ticketType)}
                        className={`${ticketTone.badgeClassName} px-3 py-1.5`}
                        textClassName={`${ticketTone.badgeTextClassName} text-sm font-semibold leading-5`}
                    />
                </View>
            ) : null}

            <ReservationStatusBanner reservationStatus={reservationStatus} />
        </View>
    );
}

function ReservationStatusBanner({
    reservationStatus,
}: {
    reservationStatus?: string | null;
}) {
    const colors = useThemeColors();
    const statusLabel = formatType(reservationStatus);
    const statusTone = getReservationStatusTone(colors, reservationStatus);

    if (statusLabel === "-") {
        return null;
    }

    return (
        <View
            className={`flex-row items-center gap-3 rounded-xl px-4 py-3.5 ${statusTone.backgroundClassName}`}
            style={BANNER_STYLE}
        >
            <View
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: `${statusTone.color}18` }}
            >
                <AppText
                    className={`text-lg font-bold ${statusTone.textClassName}`}
                >
                    !
                </AppText>
            </View>

            <View className="min-w-0 flex-1 flex-col gap-0.5">
                <AppText
                    variant="badge"
                    className={`font-bold ${statusTone.textClassName}`}
                >
                    {statusLabel}
                </AppText>

                <AppText
                    variant="meta"
                    className={`font-medium ${statusTone.mutedClassName}`}
                >
                    {getReservationStatusDescription(reservationStatus)}
                </AppText>
            </View>
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
                className="active:opacity-80"
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
