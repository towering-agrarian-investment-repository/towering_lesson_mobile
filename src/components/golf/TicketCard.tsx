import { AppText as Text } from "@/design-system";
import { cn } from "@/design-system/utils/cn";
import {
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { getMemberBaySlotGroups } from "@/service/member-bay-reservation.service";
import { getTicketLessonSlots } from "@/service/member-lesson-reservation.service";
import { TicketListItemResponse } from "@/types/member-ticket";
import { formatType } from "@/utils/format-enum";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, View } from "react-native";

type Props = {
    item: TicketListItemResponse;
};

const LESSON_TICKET_TYPES = ["PRIVATE_LESSON", "GROUP_LESSON", "LESSON_PROGRAM"];

function formatTicketDate(date?: string | null) {
    if (!date) return "-";

    const value = new Date(date);

    const yy = String(value.getFullYear()).slice(2);
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");

    return `${yy}.${mm}.${dd}`;
}

function getUsageNote(item: TicketListItemResponse) {
    if (item.isUnlimited) {
        return "Unlimited Usage";
    }

    if (item.totalCount != null) {
        return `${item.remaining ?? 0} out of ${item.totalCount}`;
    }

    return "Flexible Usage";
}

function getMonthRange(value: Date) {
    const start = new Date(value.getFullYear(), value.getMonth(), 1);
    const end = new Date(value.getFullYear(), value.getMonth() + 1, 0);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    return {
        startDate: formatDate(start),
        endDate: formatDate(end),
    };
}

function TicketCard({ item }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isInactive = item.status === "EXPIRED" || item.status === "FULLY_USED";
    const ticketTone = getTicketTypeTone(item.type);
    const isLessonProgramTicket = item.type === "LESSON_PROGRAM";
    const isBookingDisabled = isInactive || isLessonProgramTicket;
    const isLessonTicket = LESSON_TICKET_TYPES.includes(item.type);

    const badgeLabel = formatType(item.type);
    const usageNote = getUsageNote(item);

    useEffect(() => {
        if (isBookingDisabled) {
            return;
        }

        router.prefetch("/select-date");
    }, [isBookingDisabled, router]);

    const prefetchBookingData = () => {
        if (isBookingDisabled) {
            return;
        }

        const today = new Date();

        if (isLessonTicket) {
            void queryClient.prefetchQuery({
                queryKey: [
                    "member",
                    "ticket-lesson-slots",
                    item.id,
                    today.getFullYear(),
                    today.getMonth() + 1,
                ],
                queryFn: () => getTicketLessonSlots(item.id, today.getFullYear(), today.getMonth() + 1),
                staleTime: 30_000,
            });

            return;
        }

        const { startDate, endDate } = getMonthRange(today);

        void queryClient.prefetchQuery({
            queryKey: ["member", "bay-slot-groups", startDate, endDate],
            queryFn: () => getMemberBaySlotGroups(startDate, endDate),
            staleTime: 30_000,
        });
    };

    const handlePress = () => {
        if (isBookingDisabled) {
            return;
        }

        router.push({
            pathname: "/select-date",
            params: {
                ticketId: String(item.id),
                ticketType: item.type,
            },
        });
    };

    return (
        <Pressable
            disabled={isBookingDisabled}
            onPressIn={prefetchBookingData}
            onPress={handlePress}
        >
            <View
                className={cn(
                    "w-[220px] min-h-[114px]  flex-col gap-4 rounded-xl border p-5",
                    !isInactive && ticketTone.borderClassName,
                    !isInactive && ticketTone.surfaceClassName,
                    isInactive && "border-border bg-muted",
                )}
            >
                <View className="flex-1 flex-col gap-3">
                    <Text
                        variant="badge"
                        className={cn(
                            "self-start rounded-md px-2 py-1",
                            !isInactive && ticketTone.badgeSolidClassName,
                            !isInactive && ticketTone.badgeSolidTextClassName,
                            isInactive && "bg-border text-muted-foreground",
                        )}
                    >
                        {badgeLabel}
                    </Text>

                    <Text
                        variant="body"
                        className="text-foreground"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.name}
                    </Text>

                    <Text variant="count" className="text-lg font-extrabold text-foreground">
                        {formatTicketDate(item.startDate)} ~ {formatTicketDate(item.endDate)}
                    </Text>
                </View>

                <View className="flex-row justify-between gap-3 items-center">
                    <Text variant="caption" className="text-foreground">
                        {usageNote}
                    </Text>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <Text variant="caption" className="text-foreground">
                            Use once per day
                        </Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

export default TicketCard;
