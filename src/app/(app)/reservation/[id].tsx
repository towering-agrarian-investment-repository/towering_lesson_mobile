import { Href, Link, Stack, useLocalSearchParams } from "expo-router";
import {
    Alert,
    Image,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";

import {
    ReservationDetailField,
    ReservationFieldLabel,
    ReservationFieldValue,
    ReservationPoliciesSection,
} from "@/components/golf/reservation/ReservationSections";
import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import {
    MemberReservationDetailResponse,
    useCancelMemberBayReservation,
    useCancelMemberLessonReservation,
    useMemberReservationById,
} from "@/lib/hook/useReservation";
import { MemberBayReservationResponse } from "@/types/member-bay";
import { MemberLessonReservationResponse } from "@/types/member-lesson";
import {
    MemberReservationDomain,
} from "@/types/member-reservation";
import { formatType } from "@/utils/format-enum";
import { formatDateForDisplay, formatTimeRange } from "@/utils/time-helper";

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

function getReservationStatusTone(value?: string | null) {
    switch (value) {
        case "RESERVED":
            return {
                backgroundColor: "#eef1ff",
                textColor: "#3B4EC5",
            };
        case "CHECKED_IN":
            return {
                backgroundColor: "#edfdf7",
                textColor: "#52d8ac",
            };
        case "COMPLETED":
            return {
                backgroundColor: "#e8faf4",
                textColor: "#00bc7d",
            };
        case "CANCELLED":
        case "CANCELED":
            return {
                backgroundColor: "#fdecec",
                textColor: "#dc2626",
            };
        case "NO_SHOW":
            return {
                backgroundColor: "#ffd8d1",
                textColor: "#d94841",
            };
        default:
            return {
                backgroundColor: "#f3f4f6",
                textColor: "#4b5563",
            };
    }
}

export default function ReservationDetailScreen() {
    const { id, type } = useLocalSearchParams<ReservationParams>();

    const reservationId = Number(id);
    const reservationType = isReservationDomain(type) ? type : undefined;

    const { data, isLoading, isError, refetch, isRefetching } = useMemberReservationById(
        reservationId,
        reservationType,
    );

    const reservation = data?.data;

    const { mutate: cancelLessonReservation, isPending: isCancellingLesson } =
        useCancelMemberLessonReservation();
    const { mutate: cancelBayReservation, isPending: isCancellingBay } =
        useCancelMemberBayReservation();

    if (isLoading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: "Reservation Detail",
                    }}
                />

                <View className="flex-1 bg-white px-6 pt-6">
                    <View className="gap-4">
                        <Skeleton className="h-8 w-2/3 rounded-xl" />
                        <Skeleton className="h-6 w-1/3 rounded-full" />
                    </View>

                    <View className="mt-8 gap-4">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                        ))}
                    </View>
                </View>
            </>
        );
    }

    if (isError) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: "Reservation Detail",
                    }}
                />

                <ErrorState
                    title="Failed to load reservation details"
                    message="Please pull to refresh or try again later."
                />
            </>
        );
    }

    if (!reservation) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: "Reservation Detail",
                    }}
                />

                <EmptyState
                    title="Reservation not available"
                    message="The requested reservation could not be found."
                />
            </>
        );
    }

    const isBayReservation = isBayReservationDetail(reservation);
    const lessonReservation = isLessonReservationDetail(reservation)
        ? reservation
        : null;
    const canCancelReservation = reservation.reservationStatus === "RESERVED";
    const isCancelling = isBayReservation ? isCancellingBay : isCancellingLesson;

    const handleCancelReservation = () => {
        if (!canCancelReservation || isCancelling) {
            return;
        }

        Alert.alert(
            "Cancel Reservation",
            "Are you sure you want to cancel this reservation?",
            [
                {
                    text: "Keep Reservation",
                    style: "cancel",
                },
                {
                    text: "Cancel Reservation",
                    style: "destructive",
                    onPress: () => {
                        if (isBayReservation) {
                            cancelBayReservation(reservation.id);
                            return;
                        }

                        cancelLessonReservation(reservation.id);
                    },
                },
            ],
        );
    };

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

    const playerCountValue =
        isBayReservation && reservation.numberOfPlayers != null
            ? String(reservation.numberOfPlayers)
            : "-";

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

    return (
        <>

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
                        <View className="border-t border-gray-100 bg-white px-6 pb-8 pt-4">
                            <Pressable
                                className={`items-center justify-center rounded-2xl px-4 py-4 active:opacity-85 ${isCancelling ? "bg-red-300" : "bg-red-500"
                                    }`}
                                onPress={handleCancelReservation}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <CircleLoader />
                                ) : (
                                    <Text
                                        className="w-full text-center text-base font-bold text-white"
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.75}
                                    >
                                        Cancel Reservation
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    ) : null
                }
            >
                <View className="grow">
                    <HeaderSection
                        title={title}
                        reservationStatus={reservation.reservationStatus}
                        ticketType={reservation.ticket?.type ?? null}
                    />

                        <View className="mt-8 gap-4">
                            <ReservationDetailField label="Date" value={dateValue} />
                            <Separator />

                            <ReservationDetailField label="Time" value={timeValue} />

                            {isBayReservation ? (
                                <>
                                    <Separator />
                                    <ReservationDetailField label="Bay" value={reservationLocationValue} />
                                </>
                            ) : null}

                            {programValue !== "-" ? (
                                <>
                                    <Separator />
                                    <ReservationDetailField
                                        label="Program"
                                        value={programValue}
                                    />
                                </>
                            ) : null}

                            {isBayReservation ? (
                                <>
                                    <Separator />
                                    <ReservationDetailField
                                        label="Players"
                                        value={playerCountValue}
                                    />
                                </>
                            ) : (
                                <>
                                    <Separator />
                                    <ReservationDetailField
                                        label="Coach"
                                        value={coachName}
                                        leftElement={
                                            <Avatar
                                                name={coachName}
                                                imageUrl={lessonReservation?.coach?.profileImage}
                                            />
                                        }
                                    />
                                </>
                            )}

                            {noteValue ? (
                                <>
                                    <Separator />
                                    <ReservationDetailField label="Notes" value={noteValue} />
                                </>
                            ) : null}

                            {lessonNameValue && lessonDetailsHref ? (
                                <>
                                    <Separator />
                                    <LinkedDetailField
                                        label="Lesson Name"
                                        value={lessonNameValue}
                                        href={lessonDetailsHref}
                                        linkLabel="View Lesson Details"
                                    />
                                </>
                            ) : lessonNameValue ? (
                                <>
                                    <Separator />
                                    <ReservationDetailField
                                        label="Lesson Name"
                                        value={lessonNameValue}
                                    />
                                </>
                            ) : null}
                        </View>

                        <View className="mt-6 gap-4">
                            <Separator />

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
    const statusLabel = formatType(reservationStatus);
    const statusTone = getReservationStatusTone(reservationStatus);

    return (
        <View>
            <Text className="text-2xl font-bold text-gray-950 leading-8">
                {title}
            </Text>

            <View className="mt-4 flex-row flex-wrap items-center gap-2">
                {ticketType ? (
                    <View className="rounded-full bg-green-50 px-3 py-1.5">
                        <Text className="text-sm font-semibold text-green-700 leading-5">
                            {formatType(ticketType)}
                        </Text>
                    </View>
                ) : null}

                {statusLabel !== "-" ? (
                    <View
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: statusTone.backgroundColor }}
                    >
                        <Text
                            className="text-sm font-semibold leading-5"
                            style={{ color: statusTone.textColor }}
                        >
                            {statusLabel}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function LinkedDetailField({
    label,
    value,
    href,
    linkLabel,
}: {
    label: string;
    value: string;
    href: {
        pathname: string;
        params: Record<string, string>;
    };
    linkLabel: string;
}) {
    return (
        <View>
            <ReservationFieldLabel>{label}</ReservationFieldLabel>

            <View className="mt-2">
                <ReservationFieldValue>{value}</ReservationFieldValue>
            </View>

            <Link href={href as Href} asChild>
                <Pressable className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50">
                    <View className="flex-row items-center justify-between gap-4">
                        <Text
                            className="text-base font-semibold text-gray-900 leading-6"
                            numberOfLines={1}
                        >
                            {linkLabel}
                        </Text>

                        <Text className="text-2xl text-gray-400 leading-6">
                            ›
                        </Text>
                    </View>
                </Pressable>
            </Link>
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
                className="h-11 w-11 rounded-full"
            />
        );
    }

    return (
        <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-900">
            <Text className="text-base font-bold text-white">
                {name?.charAt(0).toUpperCase() || "?"}
            </Text>
        </View>
    );
}

function Separator() {
    return <View className="h-px bg-gray-100" />;
}
