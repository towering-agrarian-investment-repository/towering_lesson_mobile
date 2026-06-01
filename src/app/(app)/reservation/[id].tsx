import { Link, Stack, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    MemberReservationDetailResponse,
    useMemberReservationById,
} from "@/lib/hook/useReservation";
import { MemberBayReservationResponse } from "@/types/member-bay";
import { MemberReservationDomain } from "@/types/member-reservation";
import { fmtTime } from "@/utils/time-helper";

type ReservationParams = {
    id: string;
    type?: string;
};

const RESERVATION_POLICIES = {
    lesson: [
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

function getReservationTitle(reservation: MemberReservationDetailResponse) {
    if (isBayReservationDetail(reservation)) {
        return reservation.bayName ?? `Bay Reservation #${reservation.id}`;
    }

    return (
        reservation.lessonAvailability?.name ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        `Reservation #${reservation.id}`
    );
}

function formatDateValue(value?: string | Date | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}. ${month}. ${day}`;
}

function formatLessonType(value?: string | null) {
    if (!value) return "-";

    return value
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");
}

export default function ReservationDetailScreen() {
    const { id, type } = useLocalSearchParams<ReservationParams>();

    const reservationId = Number(id);
    const reservationType = isReservationDomain(type) ? type : undefined;

    const { data, isLoading, isError } = useMemberReservationById(
        reservationId,
        reservationType,
    );

    const reservation = data?.data;

    if (isLoading) {
        return (
            <>
                <Stack.Screen
                    options={{
                        title: "Reservation Detail",
                    }}
                />

                <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text className="mt-3 text-base leading-6 text-gray-500">
                        Loading reservation...
                    </Text>
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

                <View className="flex-1 items-center justify-center bg-white px-6">
                    <Text className="text-lg font-semibold leading-7 text-red-600 text-center">
                        Failed to load reservation details.
                    </Text>
                </View>
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

                <View className="flex-1 bg-white px-6 py-8">
                    <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12">
                        <Text className="text-lg font-semibold leading-7 text-gray-950 text-center">
                            Reservation not available
                        </Text>

                        <Text className="mt-3 text-base leading-6 text-gray-500 text-center">
                            The requested reservation could not be found.
                        </Text>
                    </View>
                </View>
            </>
        );
    }

    const isBayReservation = isBayReservationDetail(reservation);
    const title = getReservationTitle(reservation);

    const dateValue = formatDateValue(reservation.startTime);

    const timeValue =
        reservation.startTime && reservation.endTime
            ? `${fmtTime(new Date(reservation.startTime))} ~ ${fmtTime(
                new Date(reservation.endTime),
            )}`
            : "-";

    const lessonValue = isBayReservation
        ? reservation.bayName ?? `Bay #${reservation.baySlotId}`
        : reservation.lessonAvailability?.name ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        "-";

    const lessonNameValue = isBayReservation
        ? null
        : reservation.lessonName?.trim() || "-";

    const programValue = isBayReservation
        ? "-"
        : [reservation.lessonProgramName, reservation.lessonProgramGroupName]
            .filter(Boolean)
            .join(" / ") || "-";

    const coachName = isBayReservation
        ? "-"
        : reservation.coach?.name?.trim() || "-";

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
            reservation.lessonId != null &&
            reservation.lessonProgramGroupId != null
            ? {
                pathname: "/groups/[groupId]/lessons/[lessonId]",
                params: {
                    groupId: String(reservation.lessonProgramGroupId),
                    lessonId: String(reservation.lessonId),
                },
            }
            : null;

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Reservation Detail",
                }}
            />

            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-6 pt-6">
                    <HeaderSection
                        title={title}
                        reservationNumber={reservation.reservationNumber}
                        ticketType={
                            !isBayReservation
                                ? reservation.ticket?.type
                                : undefined
                        }
                    />

                    <View className="mt-8 gap-4">
                        <DetailField label="Date" value={dateValue} />
                        <Separator />

                        <DetailField label="Time" value={timeValue} />

                        {isBayReservation ? (
                            <>
                                <Separator />
                                <DetailField label="Bay" value={lessonValue} />
                            </>
                        ) : null}

                        {programValue !== "-" ? (
                            <>
                                <Separator />
                                <DetailField
                                    label="Program"
                                    value={programValue}
                                />
                            </>
                        ) : null}

                        {isBayReservation ? (
                            <>
                                <Separator />
                                <DetailField
                                    label="Players"
                                    value={playerCountValue}
                                />
                            </>
                        ) : (
                            <>
                                <Separator />
                                <DetailField
                                    label="Coach"
                                    value={coachName}
                                    leftElement={
                                        <Avatar
                                            name={coachName}
                                            imageUrl={
                                                reservation.coach?.profileImage
                                            }
                                        />
                                    }
                                />
                            </>
                        )}

                        {noteValue ? (
                            <>
                                <Separator />
                                <DetailField label="Notes" value={noteValue} />
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
                                <DetailField
                                    label="Lesson Name"
                                    value={lessonNameValue}
                                />
                            </>
                        ) : null}
                    </View>

                    <View className="mt-6 gap-4">
                        <Separator />

                        <View>
                            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 leading-4">
                                Policies
                            </Text>

                            <View className="mt-4 gap-4">
                                {policies.map((policy) => (
                                    <View key={policy.title}>
                                        <Text className="text-base font-semibold text-gray-950 leading-6">
                                            {policy.title}
                                        </Text>

                                        <Text className="mt-1 text-base text-gray-500 leading-6">
                                            {policy.description}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </>
    );
}

function HeaderSection({
    title,
    reservationNumber,
    ticketType,
}: {
    title: string;
    reservationNumber?: string | number | null;
    ticketType?: string | null;
}) {
    return (
        <View>
            <Text className="text-2xl font-bold text-gray-950 leading-8">
                {title}
            </Text>

            <View className="mt-4 flex-row flex-wrap items-center gap-2">
                {ticketType ? (
                    <View className="rounded-full bg-green-50 px-3 py-1.5">
                        <Text className="text-sm font-semibold text-green-700 leading-5">
                            {formatLessonType(ticketType)}
                        </Text>
                    </View>
                ) : null}

                {reservationNumber ? (
                    <View className="rounded-full bg-gray-100 px-3 py-1.5">
                        <Text className="text-sm font-semibold text-gray-600 leading-5">
                            #{reservationNumber}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function DetailField({
    label,
    value,
    description,
    leftElement,
}: {
    label: string;
    value: string;
    description?: string;
    leftElement?: React.ReactNode;
}) {
    return (
        <View>
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 leading-4">
                {label}
            </Text>

            <View className="mt-2 flex-row items-center gap-3">
                {leftElement ? leftElement : null}

                <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-950 leading-7">
                        {value}
                    </Text>

                    {description ? (
                        <Text className="mt-2 text-base text-gray-500 leading-6">
                            {description}
                        </Text>
                    ) : null}
                </View>
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
            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 leading-4">
                {label}
            </Text>

            <Text className="mt-2 text-lg font-semibold text-gray-950 leading-7">
                {value}
            </Text>

            <Link href={href} asChild>
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