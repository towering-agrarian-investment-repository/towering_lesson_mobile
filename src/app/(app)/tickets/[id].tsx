import ReservationCard, {
    ReservationCardSkeleton,
} from "@/components/golf/ReservationCard";
import { TicketTypeIcon } from "@/components/golf/TicketTypeIcon";
import TitleSectionWithBadge from "@/components/golf/TitleSectionWithBadge";
import {
    cn,
    CompactEmptyState,
    Divider,
    EmptyState,
    ErrorState,
    Screen,
    Skeleton,
    triggerImpactHaptic,
} from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { NativeText } from "@/design-system/components/NativeText";
import {
    getNativeButtonStyle,
    getNativeButtonTextStyle,
} from "@/design-system/utils/native-button-styles";
import { useTheme } from "@/design-system/utils/theme";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { prefetchTicketAvailability } from "@/lib/booking/prefetchTicketAvailability";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useMemberTicketById } from "@/lib/hook/useTicket";
import type { MemberReservationResponse } from "@/types/member-reservation";
import type {
    TicketDetailResponse,
    TicketPauseResponse,
} from "@/types/member-ticket";
import { formatType } from "@/utils/format-enum";
import {
    getEffectiveTicketStatus,
    getTicketStatusLabel,
    getTicketStatusTone,
} from "@/utils/status-tone";
import { formatDateForDisplay, formatDateValue } from "@/utils/time-helper";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { contentShape, frame, shapes } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { useMinuteClock } from "@/lib/hook/useMinuteClock";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";
import Animated, { cubicBezier, useReducedMotion } from "react-native-reanimated";

const PROGRESS_EASING = cubicBezier(0.23, 1, 0.32, 1);

const reservationKeyExtractor = (item: MemberReservationResponse) =>
    `${item.reservationType}:${item.id}`;
const RESERVATION_LIST_CONTENT_STYLE = {
    flexGrow: 1,
    paddingBottom: 32,
} as const;

function ReservationSeparator() {
    return <View className="h-2.5" />;
}

function getDaysLeftCount(
    endDate: string | null,
    isActive: boolean,
    referenceTime: number,
) {
    if (!isActive || !endDate) return null;
    const end = toAppTimeZoneDate(endDate);
    const today = toAppTimeZoneDate(referenceTime);
    if (!end || !today) return null;
    const days = differenceInCalendarDays(end, today);
    return days >= 0 ? days : null;
}

export default function TicketDetailScreen() {
    const { t } = useTranslation();
    const { colors, resolvedScheme: uiScheme, fontScale: uiFontScale } =
        useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();
    const referenceTime = useMinuteClock();

    const parsedId = id ? Number(id) : undefined;
    const ticketId =
        parsedId != null && Number.isSafeInteger(parsedId) && parsedId > 0
            ? parsedId
            : undefined;

    const {
        data: ticket,
        isLoading,
        isError,
        isPlaceholderData,
        refetch,
        isRefetching,
    } = useMemberTicketById(ticketId);

    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } =
        usePullToRefresh(() => refetch({ cancelRefetch: false }));

    const reservations = useMemo(
        () => ticket?.reservations ?? [],
        [ticket?.reservations],
    );

    const dateCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const reservation of reservations) {
            counts.set(
                reservation.reservationDate,
                (counts.get(reservation.reservationDate) ?? 0) + 1,
            );
        }
        return counts;
    }, [reservations]);

    const handleReservationPress = useCallback(
        (reservation: MemberReservationResponse) => {
            void queryClient.prefetchQuery(
                getMemberReservationDetailQueryOptions(
                    reservation.id,
                    reservation.reservationType,
                ),
            );
            runWithNavigationLock(() => {
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: String(reservation.id),
                        type: reservation.reservationType,
                    },
                });
            });
        },
        [queryClient, router, runWithNavigationLock],
    );

    const handleBookPress = useCallback(() => {
        if (!ticket || isLocked) return;
        triggerImpactHaptic();
        prefetchTicketAvailability(queryClient, ticket);
        runWithNavigationLock(() => {
            router.push({
                pathname: "/select-date",
                params: {
                    ticketId: String(ticket.id),
                    ticketName: ticket.name,
                    ticketType: ticket.type,
                },
            });
        });
    }, [isLocked, queryClient, router, runWithNavigationLock, ticket]);

    const renderReservationItem = useCallback(
        ({
            item,
            index,
        }: {
            item: MemberReservationResponse;
            index: number;
        }) => (
            <View className="gap-2.5">
                {index === 0 ||
                reservations[index - 1].reservationDate !==
                    item.reservationDate ? (
                    <ReservationDateHeader
                        startTime={item.startTime}
                        count={dateCounts.get(item.reservationDate) ?? 1}
                        isFirst={index === 0}
                    />
                ) : null}
                <ReservationCard
                    reservation={item}
                    referenceTime={
                        item.reservationStatus.toUpperCase() === "RESERVED"
                            ? referenceTime
                            : undefined
                    }
                    disabled={isLocked}
                    onPress={handleReservationPress}
                />
            </View>
        ),
        [
            dateCounts,
            handleReservationPress,
            isLocked,
            referenceTime,
            reservations,
        ],
    );

    if (isLoading && !ticket) {
        return (
            <Screen contentClassName="gap-6">
                    <View className="gap-5">
                        <View className="gap-2.5">
                            <View className="flex-row items-center justify-between gap-2">
                                <View className="flex-row items-center gap-2">
                                    <Skeleton className="h-7 w-7 rounded-lg" />
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                </View>
                                <Skeleton className="h-6 w-16 rounded-md" />
                            </View>
                            <Skeleton className="h-8 w-4/5 rounded-full" />
                        </View>

                        <View className="gap-3">
                            <View className="flex-row gap-3">
                                {Array.from({ length: 3 }, (_, index) => (
                                    <View
                                        key={index}
                                        className="min-w-0 flex-1 gap-1 py-1"
                                    >
                                        <Skeleton className="h-8 w-14 rounded-lg" />
                                        <Skeleton className="h-3.5 w-16 rounded-full" />
                                    </View>
                                ))}
                            </View>
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </View>
                    </View>

                    <View>
                        <Divider className="bg-border/70" />
                        <View className="flex-row items-center justify-between py-3.5">
                            <Skeleton className="h-4 w-20 rounded-full" />
                            <Skeleton className="h-4 w-36 rounded-full" />
                        </View>
                        <Divider className="bg-border/70" />
                        <View className="flex-row items-center justify-between py-3.5">
                            <Skeleton className="h-4 w-16 rounded-full" />
                            <Skeleton className="h-4 w-24 rounded-full" />
                        </View>
                        <Divider className="bg-border/70" />
                    </View>

                    <View className="gap-3">
                        <Skeleton className="h-5 w-32 rounded-full" />
                        <View className="gap-2.5">
                            {Array.from({ length: 3 }, (_, index) => (
                                <ReservationCardSkeleton key={index} />
                            ))}
                        </View>
                    </View>
                </Screen>
        );
    }

    if (isError && !ticket) {
        return (
                <Screen
                    contentClassName="grow"
                    bottomPadding={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                >
                    <ErrorState
                        title={t("tickets.detailLoadError")}
                        message={t("common.pullToRefreshAndTryAgain")}
                        actionLabel={
                            isRefetching
                                ? t("common.refreshing")
                                : t("common.refreshTryAgain")
                        }
                        actionPending={isRefetching || isPullRefreshing}
                        onAction={handlePullRefresh}
                    />
                </Screen>
        );
    }

    if (!ticket) {
        return (
                <Screen
                    contentClassName="grow"
                    bottomPadding={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                >
                    <EmptyState
                        title={t("tickets.notFoundTitle")}
                        message={t("tickets.notFoundMessage")}
                        actionLabel={t("tickets.historyTitle")}
                        onAction={() => {
                            runWithNavigationLock(() => {
                                router.dismissTo("/ticket-history");
                            });
                        }}
                    />
                </Screen>
        );
    }

    const effectiveStatus = getEffectiveTicketStatus(
        ticket.status,
        ticket.fullyUsed,
    );
    const canBook =
        (effectiveStatus === "ACTIVE" || effectiveStatus === "IN_USE") &&
        !ticket.fullyUsed &&
        ticket.type !== "LESSON_PROGRAM";

    const footer = canBook ? (
        <View>
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                colorScheme={uiScheme}
                seedColor={colors.primary}
                accessibilityLabel={t("tickets.bookWithTicket")}
                accessibilityState={{ disabled: isLocked, busy: false }}
                style={{ width: "100%" }}
            >
                <Button
                    variant="text"
                    disabled={isLocked}
                    onPress={handleBookPress}
                    style={{
                        ...getNativeButtonStyle(
                            colors,
                            "filled",
                            isLocked,
                            colors.primary,
                        ),
                        borderRadius: 12,
                    }}
                    modifiers={
                        process.env.EXPO_OS === "ios"
                            ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                            : [
                                  fillMaxWidth(),
                                  defaultMinSize({ minHeight: 48 }),
                              ]
                    }
                >
                    <Text
                        modifiers={
                            process.env.EXPO_OS === "ios"
                                ? [
                                      frame({
                                          maxWidth: Infinity,
                                          minHeight: 48,
                                      }),
                                      contentShape(shapes.rectangle()),
                                  ]
                                : [fillMaxWidth()]
                        }
                        textStyle={getNativeButtonTextStyle(
                            colors,
                            "filled",
                            uiFontScale,
                            colors.primary,
                        )}
                    >
                        {t("tickets.bookWithTicket")}
                    </Text>
                </Button>
            </Host>
        </View>
    ) : undefined;

    return (
        <Screen scroll={false} footer={footer}>
                <FlatList
                    className="flex-1"
                    data={reservations}
                    keyExtractor={reservationKeyExtractor}
                    renderItem={renderReservationItem}
                    ItemSeparatorComponent={ReservationSeparator}
                    refreshControl={
                        <RefreshControl
                            refreshing={isPullRefreshing}
                            onRefresh={handlePullRefresh}
                        />
                    }
                    contentContainerStyle={RESERVATION_LIST_CONTENT_STYLE}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <TicketDetailHeader
                            ticket={ticket}
                            referenceTime={referenceTime}
                            reservationsCount={
                                ticket.reservations != null
                                    ? ticket.reservations.length
                                    : (ticket.reservationCount ?? 0) +
                                      (ticket.bayReservationCount ?? 0)
                            }
                        />
                    }
                    ListEmptyComponent={
                        isPlaceholderData && ticket.reservations === undefined ? (
                            <View
                                className="gap-2.5"
                                accessibilityLiveRegion="polite"
                                accessibilityLabel={t("tickets.loadingReservations")}
                            >
                                <ReservationCardSkeleton />
                                <ReservationCardSkeleton />
                            </View>
                        ) : (
                            <CompactEmptyState
                                title={t("tickets.noReservationsYet")}
                            />
                        )
                    }
                />
            </Screen>
    );
}

function TicketDetailHeader({
    ticket,
    referenceTime,
    reservationsCount,
}: {
    ticket: TicketDetailResponse;
    referenceTime: number;
    reservationsCount: number;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const ticketTone = getTicketTypeTone(ticket.type);
    const typeLabel = formatTicketTypeLabel(ticket.type, t);
    const effectiveStatus = getEffectiveTicketStatus(
        ticket.status,
        ticket.fullyUsed,
    );
    const isActive =
        effectiveStatus === "ACTIVE" || effectiveStatus === "IN_USE";
    const statusTone = getTicketStatusTone(ticket.status, ticket.fullyUsed);
    const statusLabel = getTicketStatusLabel(
        ticket.status,
        ticket.fullyUsed,
        t,
    );
    const hasCountLimit =
        !ticket.isUnlimited &&
        ticket.totalCount != null &&
        ticket.totalCount > 0;
    const remainingCount = Math.max(0, ticket.remainingCount ?? 0);
    const remainingRatio = hasCountLimit
        ? Math.min(1, Math.max(0, remainingCount / ticket.totalCount!))
        : 0;
    const daysLeftCount = getDaysLeftCount(
        ticket.endDate,
        isActive,
        referenceTime,
    );
    const validityValue = `${formatDateForDisplay(ticket.startDate) || "-"} ~ ${formatDateForDisplay(ticket.endDate) || "-"}`;

    const stats: { value: string; label: string; isText?: boolean }[] = hasCountLimit
        ? [
              {
                  value: String(remainingCount),
                  label: t("tickets.statRemaining"),
              },
              {
                  value: String(ticket.usedCount ?? 0),
                  label: t("tickets.statUsed"),
              },
              daysLeftCount != null
                  ? {
                        value: String(daysLeftCount),
                        label: t("tickets.statDaysLeft"),
                    }
                  : {
                        value: String(ticket.totalCount),
                        label: t("tickets.statTotal"),
                    },
          ]
        : [
              {
                  value: ticket.isUnlimited
                      ? t("tickets.unlimitedShort")
                      : t("tickets.flexibleShort"),
                  label: t("tickets.statUsage"),
                  isText: true,
              },
              {
                  value: String(ticket.usedCount ?? 0),
                  label: t("tickets.statUsed"),
              },
              ...(daysLeftCount != null
                  ? [
                        {
                            value: String(daysLeftCount),
                            label: t("tickets.statDaysLeft"),
                        },
                    ]
                  : []),
          ];

    const metadataRows: { label: string; value: string }[] = [
        { label: t("tickets.validityPeriod"), value: validityValue },
    ];
    if (ticket.coachName) {
        metadataRows.push({
            label: t("reservations.coachLabel"),
            value: ticket.coachName,
        });
    }
    if (!ticket.isUnlimited && ticket.onlyOnePerDay) {
        metadataRows.push({
            label: t("tickets.dailyLimitLabel"),
            value: t("tickets.useOncePerDay"),
        });
    }

    return (
        <View className="gap-6 pb-4">
            <View className="gap-5">
                <View className="gap-2.5">
                    <View className="flex-row items-center justify-between gap-2">
                        <View className="min-w-0 flex-1 flex-row items-center gap-2">
                            <View
                                className={cn(
                                    "h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                    isActive
                                        ? ticketTone.badgeClassName
                                        : "bg-muted",
                                )}
                            >
                                <TicketTypeIcon
                                    type={ticket.type}
                                    size={15}
                                    color={
                                        isActive
                                            ? colors[ticketTone.color]
                                            : colors.mutedForeground
                                    }
                                    strokeWidth={2.2}
                                />
                            </View>
                            {typeLabel ? (
                                <AppText
                                    variant="meta"
                                    color="mutedForeground"
                                    numberOfLines={1}
                                    style={{ flex: 1, minWidth: 0 }}
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {typeLabel}
                                </AppText>
                            ) : null}
                        </View>

                        {statusLabel && statusLabel !== "-" ? (
                            <View
                                className={cn(
                                    "shrink-0 rounded-md px-2.5 py-1",
                                    statusTone.className,
                                )}
                            >
                                <AppText
                                    variant="badge"
                                    wrap={false}
                                    color={statusTone.color}
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {statusLabel}
                                </AppText>
                            </View>
                        ) : null}
                    </View>

                    <NativeText variant="h2" textStyle={{ fontWeight: "700" }}>
                        {ticket.name}
                    </NativeText>
                </View>

                <View className="gap-3">
                    <View className="flex-row gap-3">
                        {stats.map((stat) => (
                            <TicketStat
                                key={stat.label}
                                value={stat.value}
                                label={stat.label}
                                isText={stat.isText}
                            />
                        ))}
                    </View>

                    {hasCountLimit ? (
                        <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <Animated.View
                                className={cn(
                                    "h-full rounded-full",
                                    isActive
                                        ? ticketTone.dotClassName
                                        : "bg-muted-foreground",
                                )}
                                style={{
                                    width: `${Math.round(remainingRatio * 100)}%`,
                                    transitionProperty: "width",
                                    transitionDuration: reducedMotion ? 0 : 280,
                                    transitionTimingFunction: PROGRESS_EASING,
                                }}
                            />
                        </View>
                    ) : null}
                </View>
            </View>

            <View>
                <Divider className="bg-border/70" />
                {metadataRows.map((row) => (
                    <View key={row.label}>
                        <MetadataRow label={row.label} value={row.value} />
                        <Divider className="bg-border/70" />
                    </View>
                ))}
            </View>

            {ticket.pauses && ticket.pauses.length > 0 ? (
                <View className="gap-2">
                    <NativeText
                        variant="label"
                        textStyle={{ fontWeight: "700" }}
                    >
                        {t("tickets.pausesTitle")}
                    </NativeText>
                    <View>
                        <Divider className="bg-border/70" />
                        {ticket.pauses.map((pause) => (
                            <View key={pause.id}>
                                <PauseItem pause={pause} />
                                <Divider className="bg-border/70" />
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            {isActive && ticket.type === "LESSON_PROGRAM" ? (
                <View className="rounded-xl bg-surface px-4 py-3">
                    <AppText variant="meta" color="mutedForeground">
                        {t("tickets.adminEnrollmentMessage")}
                    </AppText>
                </View>
            ) : null}

            <TitleSectionWithBadge
                label={t("tickets.reservationsTitle")}
                length={reservationsCount}
            />
        </View>
    );
}

function TicketStat({
    value,
    label,
    isText = false,
}: {
    value: string;
    label: string;
    isText?: boolean;
}) {
    return (
        <View className="min-w-0 flex-1 gap-1 py-1">
            <AppText
                variant={isText ? "h3" : "h1"}
                color="foreground"
                numberOfLines={1}
                adjustsFontSizeToFit
                textStyle={{
                    fontWeight: "800",
                    fontVariant: ["tabular-nums"],
                }}
            >
                {value}
            </AppText>
            <AppText
                variant="caption"
                color="mutedForeground"
                numberOfLines={2}
            >
                {label}
            </AppText>
        </View>
    );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row items-center justify-between gap-4 py-3.5">
            <AppText
                variant="meta"
                color="mutedForeground"
                wrap={false}
                style={{ flexShrink: 0 }}
            >
                {label}
            </AppText>
            <AppText
                variant="meta"
                align="right"
                numberOfLines={2}
                style={{ flex: 1, minWidth: 0 }}
                textStyle={{
                    fontWeight: "600",
                    fontVariant: ["tabular-nums"],
                }}
            >
                {value}
            </AppText>
        </View>
    );
}

function PauseItem({ pause }: { pause: TicketPauseResponse }) {
    const { t } = useTranslation();
    const range = `${formatDateForDisplay(pause.pauseStartDate) || "-"} ~ ${formatDateForDisplay(pause.pauseEndDate) || "-"}`;

    return (
        <View className="gap-1 py-3">
            <View className="flex-row items-center justify-between gap-2">
                <AppText
                    variant="meta"
                    textStyle={{
                        fontWeight: "600",
                        fontVariant: ["tabular-nums"],
                    }}
                    style={{ flex: 1, minWidth: 0 }}
                >
                    {range}
                </AppText>
                <AppText
                    variant="badge"
                    color="mutedForeground"
                    wrap={false}
                >
                    {formatType(pause.status, t)}
                </AppText>
            </View>
            {pause.reason ? (
                <AppText variant="caption" color="mutedForeground">
                    {pause.reason}
                </AppText>
            ) : null}
        </View>
    );
}

function ReservationDateHeader({
    startTime,
    count,
    isFirst = false,
}: {
    startTime: string;
    count: number;
    isFirst?: boolean;
}) {
    const { t } = useTranslation();

    return (
        <View
            className={
                isFirst
                    ? "flex-row items-baseline justify-between gap-2 px-0.5 pt-1"
                    : "flex-row items-baseline justify-between gap-2 px-0.5 pt-3.5"
            }
        >
            <AppText
                variant="label"
                numberOfLines={1}
                style={{ flex: 1, minWidth: 0 }}
                textStyle={{ fontWeight: "700" }}
            >
                {formatDateValue(startTime, "EEE, MMM d, yyyy")}
            </AppText>
            <AppText
                variant="caption"
                color="mutedForeground"
                wrap={false}
                numberOfLines={1}
            >
                {t("reservations.count", { count })}
            </AppText>
        </View>
    );
}
