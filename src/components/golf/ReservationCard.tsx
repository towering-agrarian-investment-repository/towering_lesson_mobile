import type {
    MemberReservationResponse,
    MemberReservationSummaryResponse,
} from "@/types/member-reservation";
import { TicketType } from "@/types/member.type";
import { fmtTime } from "@/utils/time-helper";
import { format, isToday } from "date-fns";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

type Props = {
    reservation: MemberReservationResponse | MemberReservationSummaryResponse;
    tab?: "all" | "bay" | "private" | "group" | "program";
};

function getReservationTone(ticketType?: TicketType | string | null) {
    switch (ticketType) {
        case "BAY_USAGE":
            return {
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                dot: "bg-emerald-500",
                arrow: "text-emerald-600",
                border: "border-emerald-200",
                todayBorder: "border-emerald-500",
            };

        case "PRIVATE_LESSON":
            return {
                bg: "bg-sky-50",
                text: "text-sky-700",
                dot: "bg-sky-500",
                arrow: "text-sky-600",
                border: "border-sky-200",
                todayBorder: "border-sky-500",
            };

        case "GROUP_LESSON":
            return {
                bg: "bg-amber-50",
                text: "text-amber-700",
                dot: "bg-amber-500",
                arrow: "text-amber-600",
                border: "border-amber-200",
                todayBorder: "border-amber-500",
            };

        case "LESSON_PROGRAM":
            return {
                bg: "bg-cyan-50",
                text: "text-cyan-700",
                dot: "bg-cyan-600",
                arrow: "text-cyan-600",
                border: "border-cyan-200",
                todayBorder: "border-cyan-600",
            };

        case "LOCKER_SERVICE":
        case "LOCATION":
        case "OTHER":
        default:
            return {
                bg: "bg-slate-50",
                text: "text-slate-700",
                dot: "bg-slate-700",
                arrow: "text-slate-600",
                border: "border-slate-200",
                todayBorder: "border-slate-500",
            };
    }
}

function formatReservationType(type?: string | null) {
    if (!type) return "Reservation";

    return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export default function ReservationCard({ reservation }: Props) {
    const reservationKind = reservation.reservationType;

    const startDate = new Date(reservation.startTime);
    const endDate = new Date(reservation.endTime);

    const tone = getReservationTone(reservation.ticketType);
    const isTodayReservation = isToday(startDate);

    const detailHref = {
        pathname: "/(app)/member/reservation/[id]",
        params: {
            id: String(reservation.id),
            type: reservationKind,
        },
    } as any;

    const title =
        reservation.bayName ??
        reservation.lessonAvailabilityName ??
        reservation.lessonProgramGroupName ??
        reservation.lessonProgramName ??
        `Reservation #${reservation.id}`;

    return (
        <Link href={detailHref} asChild>
            <Pressable
                className={`overflow-hidden rounded-2xl border bg-white p-4 shadow-md active:bg-gray-50 ${isTodayReservation ? tone.todayBorder : tone.border
                    }`}
            >
                <View className="gap-4">
                    <View className="flex-row items-center gap-2">
                        <View className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />

                        <Text
                            className="flex-1 text-base font-bold text-gray-950 leading-6"
                            numberOfLines={1}
                        >
                            <Text className={tone.text}>
                                {formatReservationType(reservation.ticketType)}
                            </Text>

                            <Text className="text-gray-400"> | </Text>

                            <Text className="text-gray-950">{title}</Text>
                        </Text>
                    </View>

                    <View className="h-px bg-gray-100" />

                    <View className="flex-row items-center gap-3">
                        <View
                            className={`h-[82px] w-[72px] items-center justify-center rounded-2xl ${tone.bg}`}
                        >
                            <Text
                                className={`text-sm font-semibold uppercase tracking-wide ${tone.text}`}
                            >
                                {format(startDate, "MMM")}
                            </Text>

                            <Text
                                className={`mt-1 text-3xl font-semibold leading-none ${tone.text}`}
                            >
                                {format(startDate, "dd")}
                            </Text>
                        </View>

                        <View className="flex-1">
                            <Text className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                Start Time ~ End Time
                            </Text>

                            <Text className="mt-2 text-lg font-semibold text-gray-950 leading-7">
                                {fmtTime(startDate)} ~ {fmtTime(endDate)}
                            </Text>
                        </View>

                        <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                            <Text className={`text-3xl leading-8 ${tone.arrow}`}>
                                ›
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Link>
    );
}