import {
    AppText,
    cn,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import type { MemberLessonSlotResponse } from "@/types/member-lesson";
import { formatTypeOrNull } from "@/utils/format-enum";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import {
    getLessonSlotDisplayName,
    getLessonSpotsLeft,
    isGroupLessonSlot,
    isLessonSlotBookable,
    isLessonSlotFull,
} from "@/utils/lesson-slot";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { UserRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, View } from "react-native";

function formatSlotTime(slot: MemberLessonSlotResponse) {
    return formatTimeRange(slot.startTime, slot.endTime);
}

function isStartingSoon(slot: MemberLessonSlotResponse) {
    const startTime = new Date(slot.startTime).getTime();
    const minutesUntilStart = (startTime - Date.now()) / 60000;

    return minutesUntilStart >= 0 && minutesUntilStart <= 60;
}

function getMinutesUntilStart(slot: MemberLessonSlotResponse) {
    const minutesUntilStart =
        (new Date(slot.startTime).getTime() - Date.now()) / 60000;

    return minutesUntilStart >= 0 ? Math.ceil(minutesUntilStart) : null;
}

export default function SelectLessonSlotScreen() {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const { date, ticketId, ticketName, ticketType, notes } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
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
                    notes,
                },
            });
        });
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: isGroupTicket
                        ? t("booking.selectGroupTitle")
                        : t("booking.selectSlotTitle"),
                }}
            />

            <Screen
                scroll={false}
                contentClassName="min-h-0 gap-6"
            >
                <BookingStepHeader
                    step={2}
                    totalSteps={3}
                    context={
                        formatTypeOrNull(ticketType) ?? ticketName
                    }
                    selectionTrail={[
                        formatTypeOrNull(ticketType) ?? ticketName,
                        formatDateValue(date, "M.d"),
                    ]}
                />

            {isLoading ? (
                <View className="items-center justify-center gap-3 py-2">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} className="h-24 w-full rounded-xl" />
                    ))}
                </View>
            ) : null}

            {isError ? (
                <ErrorState
                    title={t("booking.failedLessonSlotsTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    onAction={() => {
                        void refetch();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slots.length === 0 ? (
                <EmptyState
                    title={
                        isGroupTicket
                            ? t("booking.noAvailableGroupsTitle")
                            : t("booking.noLessonSlotsTitle")
                    }
                    message={
                        isGroupTicket
                            ? t("booking.noAvailableGroupsMessage")
                            : t("booking.noLessonSlotsMessage")
                    }
                    actionLabel={t("booking.chooseAnotherDate")}
                    onAction={() => {
                        router.back();
                    }}
                />
            ) : null}

            {!isLoading && !isError && slots.length > 0 ? (
                <FlatList
                    className="min-h-0 flex-1"
                    data={slots}
                    keyExtractor={(slot) => String(slot.id)}
                    ItemSeparatorComponent={() => <View className="h-3" />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => {
                                void refetch();
                            }}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={7}
                    renderItem={({ item: slot }) => {
                        const disabled = isLessonSlotFull(slot);
                        const isBookable = isLessonSlotBookable(slot);
                        const startingSoon = !disabled && isStartingSoon(slot);
                        const minutesUntilStart = !disabled
                            ? getMinutesUntilStart(slot)
                            : null;
                        const lessonTitle = getLessonSlotDisplayName(slot);
                        const isGroupSlot = isGroupTicket || isGroupLessonSlot(slot);
                        const spotsLeft = getLessonSpotsLeft(slot);
                        const statusLabel = disabled
                            ? isBookable
                                ? t("booking.full")
                                : t("booking.statusUnavailable")
                            : isGroupSlot
                                ? t("booking.spotsLeft", { count: spotsLeft })
                                : t("booking.statusAvailable");
                        const countdownLabel =
                            minutesUntilStart == null
                                ? null
                                : minutesUntilStart < 60
                                    ? t("booking.startsInMinutes", { count: minutesUntilStart })
                                    : minutesUntilStart < 1440
                                        ? t("booking.startsInHours", {
                                            count: Math.ceil(minutesUntilStart / 60),
                                        })
                                        : t("booking.startsInDays", {
                                            count: Math.ceil(minutesUntilStart / 1440),
                                        });

                        return isGroupSlot ? (
                            <Pressable
                                key={slot.id}
                                accessibilityRole="button"
                                accessibilityLabel={`${formatSlotTime(slot)}, ${statusLabel}`}
                                className={`gap-2.5 rounded-2xl border p-3.5 ${disabled
                                        ? "border-border bg-muted/70 opacity-70"
                                        : "border-border bg-card"
                                        }`}
                                onPress={() => !disabled && handleSelect(slot)}
                                disabled={disabled || isLocked}
                            >
                                    <View className="flex-row items-start justify-between gap-3">
                                        <View className="min-w-0 flex-1 gap-2">
                                            <AppText
                                                variant="h3"
                                                className={
                                                    disabled
                                                        ? "text-muted-foreground"
                                                        : "text-foreground"
                                                }
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
                                                numberOfLines={1}
                                            >
                                                {lessonTitle}
                                            </AppText>
                                        </View>

                                        <View className="shrink-0 items-end">
                                            <AppText
                                                variant="caption"
                                                className="text-foreground/60"
                                            >
                                                {t("booking.spots")}
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
                                                    {slot.coachName || t("booking.tba")}
                                                </AppText>
                                            </View>
                                        </View>

                                        <View className="shrink-0 flex-row items-center gap-2">
                                            <AppText
                                                variant="badge"
                                                className={
                                                    disabled
                                                        ? "text-danger"
                                                        : startingSoon
                                                            ? "text-warning"
                                                            : "text-ticket-group"
                                                }
                                            >
                                                {countdownLabel ?? statusLabel}
                                            </AppText>

                                        </View>
                                    </View>

                                    {disabled ? (
                                        <AppText
                                            variant="caption"
                                            className="text-danger"
                                        >
                                            {isBookable
                                                ? t("booking.fullViewOnly")
                                                : t("booking.unavailableViewOnly")}
                                        </AppText>
                                    ) : null}

                                </Pressable>
                        ) : (
                            <Pressable
                                key={slot.id}
                                accessibilityRole="button"
                                accessibilityLabel={`${formatSlotTime(slot)}, ${statusLabel}`}
                                className={`flex-row items-center justify-between gap-3 rounded-xl border px-4 py-4 ${disabled
                                    ? "border-muted bg-muted opacity-55"
                                    : "border-border bg-card"
                                    }`}
                                onPress={() => !disabled && handleSelect(slot)}
                                disabled={disabled || isLocked}
                            >
                                <View className="min-w-0 flex-1 gap-1.5">
                                    <AppText
                                        variant="h3"
                                        className={`${disabled
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

                                    <View className="flex-row items-center justify-between gap-3">
                                        {slot.coachName ? (
                                            <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                                                <UserRound
                                                    size={13}
                                                    color={colors.mutedForeground}
                                                />
                                                <AppText
                                                    variant="meta"
                                                    className={cn(
                                                        "min-w-0 flex-1",
                                                        disabled
                                                            ? "text-muted-foreground"
                                                            : "text-foreground/75",
                                                    )}
                                                    numberOfLines={1}
                                                >
                                                    {slot.coachName}
                                                </AppText>
                                            </View>
                                        ) : <View className="flex-1" />}

                                        <AppText
                                            variant="badge"
                                            className={
                                                disabled
                                                    ? "text-muted-foreground"
                                                    : startingSoon
                                                        ? "text-warning"
                                                        : "text-primary"
                                            }
                                        >
                                            {countdownLabel ?? statusLabel}
                                        </AppText>
                                    </View>
                                </View>
                                </Pressable>
                        );
                    }}
                />
            ) : null}
            </Screen>
        </>
    );
}
