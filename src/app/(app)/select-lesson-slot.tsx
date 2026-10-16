import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { AvailabilityConflictNotice } from "@/components/golf/booking/AvailabilityConflictNotice";
import { BookingStepHeader } from "@/components/golf/booking/BookingStepHeader";
import {
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel } from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
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
import { Host, Text } from "@expo/ui";
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
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

                {isError ? (
                    <ErrorState
                        title={t("booking.failedLessonSlotsTitle")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={
                            isRefetching
                                ? t("common.refreshing")
                                : t("common.refreshTryAgain")
                        }
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
                                            <Host
                                                matchContents={{ vertical: true }}
                                                ignoreSafeArea="all"
                                                style={{ width: "100%" }}>
                                                <Text
                                                    textStyle={{
                                                        ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                                                        color: disabled
                                                            ? uiColors.mutedForeground
                                                            : uiColors.foreground,
                                                        fontSize:
                                                            typography.h3
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                                    {formatSlotTime(slot)}
                                                </Text>
                                            </Host>

                                            <Host
                                                matchContents={{ vertical: true }}
                                                ignoreSafeArea="all"
                                                style={{ width: "100%" }}>
                                                <Text
                                                    numberOfLines={1}
                                                    textStyle={{
                                                        ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                                        color: disabled
                                                            ? uiColors.mutedForeground
                                                            : uiColors.foreground +
                                                            "bf",
                                                        fontSize:
                                                            typography.meta
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                                    {lessonTitle}
                                                </Text>
                                            </Host>
                                        </View>

                                        <View className="shrink-0 items-end">
                                            <Host
                                                matchContents
                                                ignoreSafeArea="all"
                                            >
                                                <Text
                                                    textStyle={{
                                                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                                        color:
                                                            uiColors.foreground +
                                                            "99",
                                                        fontSize:
                                                            typography.caption
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                >
                                                    {t("booking.spots")}
                                                </Text>
                                            </Host>
                                            <Host
                                                matchContents
                                                ignoreSafeArea="all"
                                            >
                                                <Text
                                                    textStyle={{
                                                        ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                                        color: disabled
                                                            ? uiColors.mutedForeground
                                                            : uiColors.foreground,
                                                        fontSize:
                                                            typography.meta
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                >
                                                    {String(
                                                        slot.bookedCount ?? "",
                                                    ) +
                                                        "/" +
                                                        String(
                                                            slot.capacity ?? "",
                                                        )}
                                                </Text>
                                            </Host>
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
                                                <Host
                                                    matchContents={{ vertical: true }}
                                                    ignoreSafeArea="all"
                                                    style={{ flex: 1, minWidth: 0 }}
                                                >
                                                    <Text
                                                        numberOfLines={1}
                                                        textStyle={{
                                                            ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                                            color:
                                                                uiColors.foreground +
                                                                "bf",
                                                            fontSize:
                                                                typography.meta
                                                                    .fontSize *
                                                                uiFontScale,
                                                        }}
                                                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                                        {slot.coachName ||
                                                            t("booking.tba")}
                                                    </Text>
                                                </Host>
                                            </View>
                                        </View>

                                        <View className="shrink-0 flex-row items-center gap-2">
                                            <Host
                                                matchContents
                                                ignoreSafeArea="all"
                                            >
                                                <Text
                                                    textStyle={{
                                                        ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                                                        ...(wasJustBooked
                                                            ? {
                                                                color: uiColors.warning,
                                                            }
                                                            : disabled
                                                                ? {
                                                                    color: uiColors.danger,
                                                                }
                                                                : startingSoon
                                                                    ? {
                                                                        color: uiColors.warning,
                                                                    }
                                                                    : {
                                                                        color: uiColors.ticketGroup,
                                                                    }),
                                                        fontSize:
                                                            typography.badge
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                >
                                                    {countdownLabel ??
                                                        statusLabel}
                                                </Text>
                                            </Host>
                                        </View>
                                    </View>

                                    {disabled ? (
                                        <Host
                                            matchContents
                                            ignoreSafeArea="all"
                                        >
                                            <Text
                                                textStyle={{
                                                    ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                                    color: uiColors.danger,
                                                    fontSize:
                                                        typography.caption
                                                            .fontSize *
                                                        uiFontScale,
                                                }}
                                            >
                                                {isBookable
                                                    ? t("booking.fullViewOnly")
                                                    : t(
                                                        "booking.unavailableViewOnly",
                                                    )}
                                            </Text>
                                        </Host>
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
                                        <Host
                                            matchContents={{ vertical: true }}
                                            ignoreSafeArea="all"
                                            style={{ width: "100%" }}>
                                            <Text
                                                textStyle={{
                                                    ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                                                    color: disabled
                                                        ? uiColors.mutedForeground
                                                        : uiColors.foreground,
                                                    fontSize:
                                                        typography.h3.fontSize *
                                                        uiFontScale,
                                                }}
                                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                                {formatSlotTime(slot)}
                                            </Text>
                                        </Host>

                                        <Host
                                            matchContents={{ vertical: true }}
                                            ignoreSafeArea="all"
                                            style={{ width: "100%" }}>
                                            <Text
                                                textStyle={{
                                                    ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                                    color: disabled
                                                        ? uiColors.mutedForeground
                                                        : uiColors.foreground +
                                                        "bf",
                                                    fontSize:
                                                        typography.meta
                                                            .fontSize *
                                                        uiFontScale,
                                                }}
                                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                                {lessonTitle}
                                            </Text>
                                        </Host>

                                        <View className="flex-row items-center justify-between gap-3">
                                            {slot.coachName ? (
                                                <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                                                    <UserRound
                                                        size={13}
                                                        color={
                                                            colors.mutedForeground
                                                        }
                                                    />
                                                    <Host
                                                        matchContents={{ vertical: true }}
                                                        ignoreSafeArea="all"
                                                        style={{ flex: 1, minWidth: 0 }}
                                                    >
                                                        <Text
                                                            numberOfLines={1}
                                                            textStyle={{
                                                                ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                                                color: disabled
                                                                    ? uiColors.mutedForeground
                                                                    : uiColors.foreground +
                                                                    "bf",
                                                                fontSize:
                                                                    typography
                                                                        .meta
                                                                        .fontSize *
                                                                    uiFontScale,
                                                            }}
                                                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                                            {slot.coachName}
                                                        </Text>
                                                    </Host>
                                                </View>
                                            ) : (
                                                <View className="flex-1" />
                                            )}

                                            <Host
                                                matchContents
                                                ignoreSafeArea="all"
                                            >
                                                <Text
                                                    textStyle={{
                                                        ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                                                        ...(wasJustBooked
                                                            ? {
                                                                color: uiColors.warning,
                                                            }
                                                            : disabled
                                                                ? {
                                                                    color: uiColors.mutedForeground,
                                                                }
                                                                : startingSoon
                                                                    ? {
                                                                        color: uiColors.warning,
                                                                    }
                                                                    : {
                                                                        color: uiColors.primary,
                                                                    }),
                                                        fontSize:
                                                            typography.badge
                                                                .fontSize *
                                                            uiFontScale,
                                                    }}
                                                >
                                                    {countdownLabel ??
                                                        statusLabel}
                                                </Text>
                                            </Host>
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
