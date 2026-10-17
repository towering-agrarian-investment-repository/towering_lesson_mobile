import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { NativeText } from "@/design-system/components/NativeText";
import { AvailabilityConflictNotice } from "@/components/golf/booking/AvailabilityConflictNotice";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { useMemberTicketLessonSlots } from "@/lib/hook/useReservation";
import type { MemberLessonSlotResponse } from "@/types/member-lesson";
import {
    getLessonSlotDisplayName,
    getLessonSpotsLeft,
    isGroupLessonSlot,
    isLessonSlotBookable,
    isLessonSlotFull,
} from "@/utils/lesson-slot";
import { formatDateValue, formatTimeRange } from "@/utils/time-helper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Stack } from "expo-router/stack";
import { UserRound } from "lucide-react-native";
import { useState } from "react";
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
    const { colors } = useTheme();
    const { t } = useTranslation();
    const {
        date,
        ticketId,
        ticketName,
        ticketType,
        notes,
        conflictMessage,
        conflictSlotId,
        conflictId,
    } = useLocalSearchParams<{
        date: string;
        ticketId?: string;
        ticketName: string;
        ticketType?: string;
        notes?: string;
        conflictMessage?: string;
        conflictSlotId?: string;
        conflictId?: string;
    }>();

    const router = useRouter();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const [dismissedConflictId, setDismissedConflictId] = useState<string>();
    const isGroupTicket =
        String(ticketType ?? "").toUpperCase() === "GROUP_LESSON";
    const visibleConflictMessage =
        dismissedConflictId === conflictId ? undefined : conflictMessage;

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
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));
    const hasLoadError = isError && !data;

    const slots = (data?.data ?? []).filter(
        (slot) => slot.startTime.split("T")[0] === date,
    );

    const handleSelect = (slot: MemberLessonSlotResponse) => {
        runWithNavigationLock(() => {
            setDismissedConflictId(conflictId);
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
                maxWidth={960}
                scroll={false}
                contentClassName="min-h-0 gap-6"
            >
                <BookingStepHeader
                    step={2}
                    totalSteps={3}
                    context={formatTicketTypeLabel(ticketType, t) || ticketName}
                    selectionTrail={[
                        formatTicketTypeLabel(ticketType, t) || ticketName,
                        formatDateValue(date, "M.d"),
                    ]}
                />

                {visibleConflictMessage ? (
                    <AvailabilityConflictNotice
                        key={conflictId}
                        message={visibleConflictMessage}
                    />
                ) : null}

                {isLoading ? (
                    <View className="items-center justify-center gap-3 py-2">
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton
                                key={index}
                                className="h-24 w-full rounded-xl"
                            />
                        ))}
                    </View>
                ) : null}

                {hasLoadError ? (
                    <ErrorState
                        title={t("booking.failedLessonSlotsTitle")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={
                            isRefetching
                                ? t("common.refreshing")
                                : t("common.refreshTryAgain")
                        }
                        onAction={handlePullRefresh}
                    />
                ) : null}

                {!isLoading && !hasLoadError && slots.length === 0 ? (
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
                            runWithNavigationLock(() =>
                                router.dismissTo({
                                    pathname: "/select-date",
                                    params: {
                                        ticketId,
                                        ticketName,
                                        ticketType,
                                        notes,
                                    },
                                }),
                            );
                        }}
                    />
                ) : null}

                {!isLoading && !hasLoadError && slots.length > 0 ? (
                    <FlatList
                        className="min-h-0 flex-1"
                        data={slots}
                        keyExtractor={(slot) => String(slot.id)}
                        ItemSeparatorComponent={() => <View className="h-3" />}
                        refreshControl={
                            <RefreshControl
                                refreshing={isPullRefreshing}
                                onRefresh={handlePullRefresh}
                            />
                        }
                        contentContainerStyle={{ paddingBottom: 24 }}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={6}
                        maxToRenderPerBatch={8}
                        windowSize={7}
                        renderItem={({ item: slot }) => {
                            const wasJustBooked = Boolean(
                                visibleConflictMessage &&
                                conflictSlotId === String(slot.id),
                            );
                            const disabled =
                                wasJustBooked || isLessonSlotFull(slot);
                            const isBookable = isLessonSlotBookable(slot);
                            const startingSoon =
                                !disabled && isStartingSoon(slot);
                            const minutesUntilStart = !disabled
                                ? getMinutesUntilStart(slot)
                                : null;
                            const lessonTitle = getLessonSlotDisplayName(slot);
                            const isGroupSlot =
                                isGroupTicket || isGroupLessonSlot(slot);
                            const spotsLeft = getLessonSpotsLeft(slot);
                            const statusLabel = wasJustBooked
                                ? t("booking.justBooked")
                                : disabled
                                    ? isBookable
                                        ? t("booking.full")
                                        : t("booking.statusUnavailable")
                                    : isGroupSlot
                                        ? t("booking.spotsLeft", {
                                            count: spotsLeft,
                                        })
                                        : t("booking.statusAvailable");
                            const countdownLabel =
                                minutesUntilStart == null
                                    ? null
                                    : minutesUntilStart < 60
                                        ? t("booking.startsInMinutes", {
                                            count: minutesUntilStart,
                                        })
                                        : minutesUntilStart < 1440
                                            ? t("booking.startsInHours", {
                                                count: Math.ceil(
                                                    minutesUntilStart / 60,
                                                ),
                                            })
                                            : t("booking.startsInDays", {
                                                count: Math.ceil(
                                                    minutesUntilStart / 1440,
                                                ),
                                            });

                            return isGroupSlot ? (
                                <Pressable
                                    key={slot.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${formatSlotTime(slot)}, ${statusLabel}`}
                                    className={`gap-2.5 rounded-2xl border p-3.5 ${wasJustBooked
                                            ? "border-warning/40 bg-warning/10 opacity-80"
                                            : disabled
                                                ? "border-border bg-muted/70 opacity-70"
                                                : "border-border bg-card"
                                        }`}
                                    onPress={() =>
                                        !disabled && handleSelect(slot)
                                    }
                                    disabled={disabled || isLocked}
                                >
                                    <View className="flex-row items-start justify-between gap-3">
                                        <View className="min-w-0 flex-1 gap-2">
                                            <NativeText
                                                variant="h3"
                                                textStyle={{
                                                    color: disabled
                                                        ? colors.mutedForeground
                                                        : colors.foreground
                                                }}
                                            >
                                                {formatSlotTime(slot)}
                                            </NativeText>

                                            <NativeText
                                                variant="meta"
                                                numberOfLines={1}
                                                textStyle={{
                                                    color: disabled
                                                        ? colors.mutedForeground
                                                        : colors.foreground +
                                                        "bf"
                                                }}
                                            >
                                                {lessonTitle}
                                            </NativeText>
                                        </View>

                                        <View className="shrink-0 items-end">
                                            <NativeText
                                                variant="caption"
                                                wrap={false}
                                                textStyle={{
                                                    color:
                                                        colors.foreground +
                                                        "99"
                                                }}
                                            >
                                                {t("booking.spots")}
                                            </NativeText>
                                            <NativeText
                                                variant="meta"
                                                wrap={false}
                                                textStyle={{
                                                    color: disabled
                                                        ? colors.mutedForeground
                                                        : colors.foreground
                                                }}
                                            >
                                                {String(
                                                    slot.bookedCount ?? "",
                                                ) +
                                                    "/" +
                                                    String(
                                                        slot.capacity ?? "",
                                                    )}
                                            </NativeText>
                                        </View>
                                    </View>

                                    <View className="flex-row items-center gap-3">
                                        <View className="min-w-0 flex-1 gap-1.5">
                                            <View className="flex-row items-center gap-1.5">
                                                <UserRound
                                                    size={13}
                                                    color={
                                                        colors.mutedForeground
                                                    }
                                                />
                                                <NativeText
                                                    variant="meta"
                                                    numberOfLines={1}
                                                    style={{ flex: 1, minWidth: 0 }}
                                                    textStyle={{
                                                        color:
                                                            colors.foreground +
                                                            "bf"
                                                    }}
                                                >
                                                    {slot.coachName ||
                                                        t("booking.tba")}
                                                </NativeText>
                                            </View>
                                        </View>

                                        <View className="shrink-0 flex-row items-center gap-2">
                                            <NativeText
                                                variant="badge"
                                                wrap={false}
                                                textStyle={{
                                                    ...(wasJustBooked
                                                        ? {
                                                            color: colors.warning,
                                                        }
                                                        : disabled
                                                            ? {
                                                                color: colors.danger,
                                                            }
                                                            : startingSoon
                                                                ? {
                                                                    color: colors.warning,
                                                                }
                                                                : {
                                                                    color: colors.ticketGroup,
                                                                })
                                                }}
                                            >
                                                {countdownLabel ??
                                                    statusLabel}
                                            </NativeText>
                                        </View>
                                    </View>

                                    {disabled ? (
                                        <NativeText variant="caption" color="danger" wrap={false}>
                                            {isBookable
                                                ? t("booking.fullViewOnly")
                                                : t(
                                                    "booking.unavailableViewOnly",
                                                )}
                                        </NativeText>
                                    ) : null}
                                </Pressable>
                            ) : (
                                <Pressable
                                    key={slot.id}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${formatSlotTime(slot)}, ${statusLabel}`}
                                    className={`flex-row items-center justify-between gap-3 rounded-xl border px-4 py-4 ${wasJustBooked
                                            ? "border-warning/40 bg-warning/10 opacity-80"
                                            : disabled
                                                ? "border-muted bg-muted opacity-55"
                                                : "border-border bg-card"
                                        }`}
                                    onPress={() =>
                                        !disabled && handleSelect(slot)
                                    }
                                    disabled={disabled || isLocked}
                                >
                                    <View className="min-w-0 flex-1 gap-1.5">
                                            <NativeText
                                                variant="h3"
                                                textStyle={{
                                                    color: disabled
                                                        ? colors.mutedForeground
                                                        : colors.foreground
                                                }}
                                            >
                                                {formatSlotTime(slot)}
                                            </NativeText>

                                            <NativeText
                                                variant="meta"
                                                textStyle={{
                                                    color: disabled
                                                        ? colors.mutedForeground
                                                        : colors.foreground +
                                                        "bf"
                                                }}
                                            >
                                                {lessonTitle}
                                            </NativeText>

                                        <View className="flex-row items-center justify-between gap-3">
                                            {slot.coachName ? (
                                                <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                                                    <UserRound
                                                        size={13}
                                                        color={
                                                            colors.mutedForeground
                                                        }
                                                    />
                                                        <NativeText
                                                            variant="meta"
                                                            numberOfLines={1}
                                                            style={{ flex: 1, minWidth: 0 }}
                                                            textStyle={{
                                                                color: disabled
                                                                    ? colors.mutedForeground
                                                                    : colors.foreground +
                                                                    "bf"
                                                            }}
                                                        >
                                                            {slot.coachName}
                                                        </NativeText>
                                                </View>
                                            ) : (
                                                <View className="flex-1" />
                                            )}

                                                <NativeText
                                                    variant="badge"
                                                    wrap={false}
                                                    textStyle={{
                                                        ...(wasJustBooked
                                                            ? {
                                                                color: colors.warning,
                                                            }
                                                            : disabled
                                                                ? {
                                                                    color: colors.mutedForeground,
                                                                }
                                                                : startingSoon
                                                                    ? {
                                                                        color: colors.warning,
                                                                    }
                                                                    : {
                                                                        color: colors.primary,
                                                                    })
                                                    }}
                                                >
                                                    {countdownLabel ??
                                                        statusLabel}
                                                </NativeText>
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
