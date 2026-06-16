import {
    AppText,
    Card,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import { MemberLessonSlotResponse } from "@/types/member-lesson";
import { formatType } from "@/utils/format-enum";
import {
    getLessonSlotDisplayName,
    getLessonSpotsLeft,
    isLessonSlotBookable,
    isGroupLessonSlot,
    isLessonSlotFull,
} from "@/utils/lesson-slot";
import { formatTimeRange } from "@/utils/time-helper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, UserRound } from "lucide-react-native";
import { Pressable, RefreshControl, View } from "react-native";

function formatSlotTime(slot: MemberLessonSlotResponse) {
    return formatTimeRange(slot.startTime, slot.endTime);
}

export default function SelectLessonSlotScreen() {
    const colors = useThemeColors();
    const { date, ticketId, ticketName, ticketType, mode, reservationId, notes } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
        mode?: string;
        reservationId?: string;
        notes?: string;
    }>();

    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const isGroupTicket = String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";

    const selectedDate = new Date(`${date}T12:00:00`);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const ticketIdNumber = ticketId ? Number(ticketId) : null;

    const { data, isLoading, isError, refetch, isRefetching } =
        useMemberTicketLessonSlots(
            ticketIdNumber,
            year,
            month,
            Boolean(ticketIdNumber),
        );

    const slots = (data?.data ?? []).filter(
        (slot) => slot.startTime.split("T")[0] === date,
    );

    const handleSelect = (slot: MemberLessonSlotResponse) => {
        runWithNavigationLock(() => {
            router.push({
                pathname: "/lesson-booking-confirm",
                params: {
                    ticketId,
                    ticketName,
                    ticketType,
                    lessonAvailabilityId: String(slot.id),
                    lessonName: getLessonSlotDisplayName(slot),
                    coachName: slot.coachName ?? "",
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    date,
                    mode,
                    reservationId,
                    notes,
                },
            });
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
            <Stack.Screen
                options={{ title: isGroupTicket ? "Select Group" : "Select Slot" }}
            />

            <View className="gap-1">
                <AppText variant="h3">
                    {isGroupTicket ? "Choose a group" : "Choose a slot"}
                </AppText>

                <AppText variant="meta" className="text-foreground/75">
                    {formatType(ticketType) !== "-"
                        ? `${date} · ${formatType(ticketType)}`
                        : date}
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
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slots.length === 0 ? (
                <EmptyState
                    title={isGroupTicket ? "No available groups" : "No lesson slots"}
                    message={
                        isGroupTicket
                            ? "There are no group lessons with remaining capacity for this date."
                            : "There are no lesson slots for this date."
                    }
                    actionLabel="Choose Another Date"
                    onAction={() => {
                        router.back();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slots.length > 0 ? (
                <View className="gap-3">
                    {slots.map((slot) => {
                        const disabled = isLessonSlotFull(slot);
                        const isBookable = isLessonSlotBookable(slot);
                        const lessonTitle = getLessonSlotDisplayName(slot);
                        const isGroupSlot = isGroupTicket || isGroupLessonSlot(slot);
                        const spotsLeft = getLessonSpotsLeft(slot);
                        const statusLabel = disabled
                            ? isBookable
                                ? "Full"
                                : "Unavailable"
                            : isGroupSlot
                                ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`
                                : "Available";

                        return (
                            <View key={slot.id}>
                                {isGroupSlot ? (
                                    <Pressable
                                        className="active:opacity-95"
                                        onPress={() => !disabled && handleSelect(slot)}
                                        disabled={disabled || isLocked}
                                    >
                                        <Card
                                            className={`gap-2.5 rounded-2xl border p-3.5 ${
                                                disabled
                                                    ? "border-border bg-muted/70 opacity-70"
                                                    : "border-border bg-card"
                                            }`}
                                        >
                                            <View className="flex-row items-center justify-between gap-3">
                                                <View className="min-w-0 flex-1">
                                                    <AppText
                                                        variant="h3"
                                                        className={
                                                            disabled
                                                                ? "text-muted-foreground"
                                                                : "text-foreground"
                                                        }
                                                        numberOfLines={1}
                                                    >
                                                        {formatSlotTime(slot)}
                                                    </AppText>
                                                </View>

                                                <View
                                                    className={`shrink-0 rounded-full px-2.5 py-1 ${
                                                        disabled
                                                            ? "bg-danger/10"
                                                            : "bg-ticket-group/10"
                                                    }`}
                                                >
                                                    <AppText
                                                        variant="badge"
                                                        className={
                                                            disabled
                                                                ? "text-danger"
                                                                : "text-ticket-group"
                                                        }
                                                    >
                                                        {statusLabel}
                                                    </AppText>
                                                </View>
                                            </View>

                                            <View className="gap-2">
                                                <AppText
                                                    variant="meta"
                                                    className={
                                                        disabled
                                                            ? "text-muted-foreground"
                                                            : "text-foreground/75"
                                                    }
                                                    numberOfLines={1}
                                                >
                                                    {lessonTitle}
                                                </AppText>
                                            </View>

                                            <View className="flex-row items-center gap-3">
                                                <View className="min-w-0 flex-1 gap-1.5">
                                                    <View className="flex-row items-center gap-1.5">
                                                        <UserRound
                                                            size={13}
                                                            color={colors.mutedForeground}
                                                        />
                                                        <AppText
                                                            variant="meta"
                                                            className="flex-1 text-foreground/75"
                                                            numberOfLines={1}
                                                        >
                                                            {slot.coachName || "TBA"}
                                                        </AppText>
                                                    </View>
                                                </View>

                                                <View className="shrink-0 flex-row items-center gap-2">
                                                    <View className="items-end">
                                                        <AppText
                                                            variant="caption"
                                                            className="text-foreground/60"
                                                        >
                                                            Spots
                                                        </AppText>
                                                        <AppText
                                                            variant="meta"
                                                            className={
                                                                disabled
                                                                    ? "text-muted-foreground"
                                                                    : "text-foreground"
                                                            }
                                                        >
                                                            {slot.bookedCount}/{slot.capacity}
                                                        </AppText>
                                                    </View>

                                                    <ChevronRight
                                                        size={16}
                                                        color={
                                                            disabled
                                                                ? colors.mutedForeground
                                                                : colors.primary
                                                        }
                                                    />
                                                </View>
                                            </View>

                                            {disabled ? (
                                                <AppText
                                                    variant="caption"
                                                    className="text-danger"
                                                >
                                                    {isBookable
                                                        ? "Full - viewable only"
                                                        : "Unavailable - viewable only"}
                                                </AppText>
                                            ) : null}
                                        </Card>
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        className={`flex-row items-center justify-between gap-3 rounded-xl border px-4 py-4 ${
                                            disabled
                                                ? "border-muted bg-muted opacity-55"
                                                : "border-border bg-card active:bg-surface"
                                        }`}
                                        onPress={() => !disabled && handleSelect(slot)}
                                        disabled={disabled || isLocked}
                                    >
                                        <View className="min-w-0 flex-1 gap-1.5">
                                            <AppText
                                                variant="h3"
                                                className={`${
                                                    disabled
                                                        ? "text-muted-foreground"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {formatSlotTime(slot)}
                                            </AppText>

                                            <AppText
                                                variant="meta"
                                                className={
                                                    disabled
                                                        ? "text-muted-foreground"
                                                        : "text-foreground/75"
                                                }
                                            >
                                                {lessonTitle}
                                            </AppText>

                                            {slot.coachName ? (
                                                <AppText
                                                    variant="meta"
                                                    className={
                                                        disabled
                                                            ? "text-muted-foreground"
                                                            : "text-foreground/75"
                                                    }
                                                >
                                                    Coach: {slot.coachName}
                                                </AppText>
                                            ) : null}
                                        </View>

                                        <AppText
                                            variant="badge"
                                            className={
                                                disabled
                                                    ? "text-muted-foreground"
                                                    : "text-primary"
                                            }
                                        >
                                            {statusLabel}
                                        </AppText>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </View>
            ) : null}
        </Screen>
    );
}
