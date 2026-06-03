import { Skeleton } from "@/components/ui/Skeleton";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState } from "@/components/ui/StateCard";
import { AppText } from "@/design-system";
import { useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import { LessonAvailabilityResponse } from "@/types/member-lesson";
import { formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    RefreshControl,
    View,
} from "react-native";

function isSlotFull(slot: LessonAvailabilityResponse) {
    return slot.bookedCount >= slot.capacity;
}

function formatSlotTime(slot: LessonAvailabilityResponse) {
    return formatTimeRange(slot.startTime, slot.endTime);
}

export default function SelectLessonSlotScreen() {
    const { date, ticketId, ticketType } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketType?: string;
    }>();
    const router = useRouter();
    const selectedDate = new Date(`${date}T12:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const ticketIdNumber = ticketId ? Number(ticketId) : null;

    const { data, isLoading, isError, refetch, isRefetching } = useMemberTicketLessonSlots(
        ticketIdNumber,
        year,
        month,
        Boolean(ticketIdNumber),
    );

    const slots = (data?.data ?? []).filter(
        (slot) => slot.startTime.split("T")[0] === date,
    );

    const handleSelect = (slot: LessonAvailabilityResponse) => {
        router.push({
            pathname: "/lesson-booking-confirm",
            params: {
                ticketId,
                ticketType,
                lessonAvailabilityId: String(slot.id),
                lessonName:
                    slot.name ??
                    slot.title ??
                    slot.lessonProgramName ??
                    slot.lessonProgram?.name ??
                    "Private Lesson",
                coachName: slot.coachName ?? "",
                startTime: slot.startTime,
                endTime: slot.endTime,
                date,
            },
        });
    };

    return (
        <Screen
            contentClassName="gap-6"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
        >
            <View className="gap-1">
                <AppText variant="value">Choose a time</AppText>
                <AppText variant="meta" className="text-foreground/75">
                    {date}
                </AppText>
            </View>

            {isLoading ? (
                <View className="items-center justify-center gap-3 py-2">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-24 w-full rounded-xl" />
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title="Failed to load lesson slots"
                    message="Pull to refresh and try again."
                />
            ) : null}

            {!isLoading && !isError && slots.length === 0 ? (
                <EmptyState
                    title="No lesson slots"
                    message="There are no lesson slots for this date."
                />
            ) : null}

            <View className="gap-3">
                {slots.map((slot) => {
                    const disabled = isSlotFull(slot);
                    const lessonTitle =
                        slot.name ??
                        slot.title ??
                        slot.lessonProgramName ??
                        slot.lessonProgram?.name ??
                        "Private Lesson";

                    return (
                        <Pressable
                            key={slot.id}
                            className={`flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-4 ${
                                disabled
                                    ? "border-muted bg-muted opacity-55"
                                    : "border-border bg-card active:bg-surface"
                            }`}
                            onPress={() => !disabled && handleSelect(slot)}
                            disabled={disabled}
                        >
                            <View className="min-w-0 flex-1 gap-1.5">
                                <AppText
                                    variant="value"
                                    className={`font-medium ${
                                        disabled ? "text-muted-foreground" : "text-foreground"
                                    }`}
                                >
                                    {formatSlotTime(slot)}
                                </AppText>
                                <AppText
                                    variant="meta"
                                    className={disabled ? "text-muted-foreground" : "text-foreground/75"}
                                >
                                    {lessonTitle}
                                </AppText>
                                {slot.coachName ? (
                                    <AppText
                                        variant="meta"
                                        className={disabled ? "text-muted-foreground" : "text-foreground/75"}
                                    >
                                        Coach: {slot.coachName}
                                    </AppText>
                                ) : null}
                            </View>

                            <AppText
                                variant="label"
                                className={disabled ? "text-muted-foreground" : "text-primary"}
                            >
                                {disabled ? "Full" : "Available"}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
        </Screen>
    );
}
