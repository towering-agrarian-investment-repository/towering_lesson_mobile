import { AnimatedPressable, cn, Skeleton, triggerImpactHaptic, triggerSelectionHaptic } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel, getTicketTypeTone } from "@/design-system/utils/ticket-type";
import { canBookWithTicket } from "@/lib/booking/ticket-eligibility";
import type { MemberTicketSummaryResponse } from "@/types/member-ticket";
import { getTicketStatusGroup, getTicketStatusLabel, getTicketStatusTone } from "@/utils/status-tone";
import { formatTicketPausePeriod, getTicketPausePeriods } from "@/utils/ticket-pause";
import { formatDateForAPI, formatDateForDisplay } from "@/utils/time-helper";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { TicketPausePeriods } from "./TicketPausePeriods";
import { TicketTypeIcon } from "./TicketTypeIcon";

type Props = {
    item: MemberTicketSummaryResponse;
    disabled?: boolean;
    showBookAction?: boolean;
    onPress?: (item: MemberTicketSummaryResponse) => void;
    onBookPress?: (item: MemberTicketSummaryResponse) => void;
};

function TicketHistoryCard({ item, disabled = false, showBookAction = false, onPress, onBookPress }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const ticketTone = getTicketTypeTone(item.type);
    const typeLabel = formatTicketTypeLabel(item.type, t) || "-";
    const isInactive = getTicketStatusGroup(item.status, item.fullyUsed) !== "active";
    const statusTone = getTicketStatusTone(item.status, item.fullyUsed);
    const statusLabel = getTicketStatusLabel(item.status, item.fullyUsed, t);
    const dateRange = `${formatDateForDisplay(item.startDate) || "-"} ~ ${formatDateForDisplay(item.endDate) || "-"}`;
    const hasCountLimit = !item.isUnlimited && item.totalCount != null && item.totalCount > 0;
    const remainingCount = Math.max(0, item.remainingCount ?? 0);
    const remainingRatio = hasCountLimit ? Math.min(1, Math.max(0, remainingCount / item.totalCount!)) : 0;
    const ticketEndDate = item.endDate ? toAppTimeZoneDate(item.endDate) : null;
    const now = new Date();
    const today = toAppTimeZoneDate(now);
    const todayKey = formatDateForAPI(now);
    const pausePeriods = getTicketPausePeriods(item.pauses).filter(({ endDate }) => endDate >= todayKey);
    const daysLeft = ticketEndDate && today ? differenceInCalendarDays(ticketEndDate, today) : null;
    const showExpiry = !isInactive && !item.fullyUsed && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
    const expiryLabel = daysLeft === 0 ? t("tickets.expiresToday") : t("tickets.daysLeft", { count: daysLeft ?? 0 });
    const expiryIsUrgent = daysLeft !== null && daysLeft <= 3;

    return (
        <AnimatedPressable
            disabled={disabled}
            onPress={() => {
                if (disabled) return;
                triggerSelectionHaptic();
                onPress?.(item);
            }}
            accessibilityRole="button"
            accessibilityLabel={t("tickets.openDetailAccessibility", {
                name: item.name,
            })}
            accessibilityHint={pausePeriods.map((period) => formatTicketPausePeriod(period, t)).join(", ") || undefined}
            accessibilityState={{ disabled }}
            className={cn(
                "flex-row overflow-hidden rounded-2xl border border-border bg-card",
                disabled && "opacity-75",
            )}
        >
            <View className={cn("w-1.5 shrink-0", isInactive ? "bg-border" : ticketTone.dotClassName)} />

            <View className="min-w-0 flex-1">
                <View className="gap-3 p-4">
                    <View className="flex-row items-center justify-between gap-2">
                        <View className="min-w-0 flex-1 flex-row items-center gap-2">
                            <View
                                className={cn(
                                    "h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                    isInactive ? "bg-muted" : ticketTone.badgeClassName,
                                )}
                            >
                                <TicketTypeIcon
                                    type={item.type}
                                    size={15}
                                    color={isInactive ? colors.mutedForeground : colors[ticketTone.color]}
                                    strokeWidth={2.2}
                                />
                            </View>
                            <AppText
                                variant="caption"
                                color="mutedForeground"
                                numberOfLines={1}
                                style={{ flex: 1, minWidth: 0 }}
                                textStyle={{ fontWeight: "600" }}
                            >
                                {typeLabel}
                            </AppText>
                        </View>

                        {statusLabel && statusLabel !== "-" ? (
                            <View className={cn("shrink-0 rounded-md px-2 py-0.5", statusTone.className)}>
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

                    <AppText
                        variant="body"
                        numberOfLines={2}
                        color={isInactive ? "mutedForeground" : "foreground"}
                        textStyle={{ fontWeight: "700" }}
                    >
                        {item.name}
                    </AppText>
                    <TicketPausePeriods periods={pausePeriods} />

                    {hasCountLimit ? (
                        <View className="flex-row items-center justify-between gap-3">
                            <View className="flex-row items-baseline gap-1">
                                <AppText
                                    variant="h2"
                                    color={isInactive ? "mutedForeground" : "foreground"}
                                    wrap={false}
                                    tabular
                                >
                                    {String(remainingCount)}
                                </AppText>
                                <AppText variant="caption" color="mutedForeground" wrap={false}>
                                    {t("tickets.ofTotalLeft", {
                                        total: item.totalCount,
                                    })}
                                </AppText>
                            </View>

                            <View className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                <View
                                    className={cn(
                                        "h-full rounded-full",
                                        isInactive ? "bg-muted-foreground" : ticketTone.dotClassName,
                                    )}
                                    style={{
                                        width: `${Math.round(remainingRatio * 100)}%`,
                                    }}
                                />
                            </View>
                        </View>
                    ) : (
                        <AppText
                            variant="subtext"
                            color={isInactive ? "mutedForeground" : "foreground"}
                            textStyle={{ fontWeight: "700" }}
                        >
                            {item.isUnlimited ? t("tickets.unlimitedUsage") : t("tickets.flexibleUsage")}
                        </AppText>
                    )}
                </View>

                <TicketPerforation />

                <View className="flex-row items-center justify-between gap-2 bg-surface px-4 py-2.5">
                    {showExpiry ? (
                        <View
                            className={cn(
                                "shrink-0 rounded-md px-2 py-0.5",
                                expiryIsUrgent ? "bg-danger/10" : "bg-warning/10",
                            )}
                        >
                            <AppText variant="badge" wrap={false} color={expiryIsUrgent ? "danger" : "warning"}>
                                {expiryLabel}
                            </AppText>
                        </View>
                    ) : null}
                    <AppText
                        variant="caption"
                        color="mutedForeground"
                        numberOfLines={1}
                        tabular
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        {dateRange}
                    </AppText>

                    {showBookAction && canBookWithTicket(item) && onBookPress ? (
                        <AnimatedPressable
                            accessibilityRole="button"
                            accessibilityLabel={`${t("tickets.bookWithTicket")} — ${item.name}`}
                            accessibilityState={{ disabled }}
                            disabled={disabled}
                            hitSlop={12}
                            onPress={(event) => {
                                event.stopPropagation();
                                if (disabled) return;
                                triggerImpactHaptic();
                                onBookPress(item);
                            }}
                            className="shrink-0 flex-row items-center gap-1 rounded-lg bg-primary px-3 py-1.5"
                        >
                            <AppText
                                variant="badge"
                                color="primaryForeground"
                                wrap={false}
                                textStyle={{ fontWeight: "700" }}
                            >
                                {t("tickets.bookWithTicket")}
                            </AppText>
                            <ChevronRight size={13} color={colors.primaryForeground} strokeWidth={2.5} />
                        </AnimatedPressable>
                    ) : showBookAction && !isInactive && item.type === "LESSON_PROGRAM" ? (
                        <View className="shrink-0 flex-row items-center gap-1">
                            <AppText variant="caption" color="mutedForeground" wrap={false}>
                                {t("tickets.adminEnrollmentLabel")}
                            </AppText>
                            <ChevronRight size={15} color={colors.mutedForeground} strokeWidth={2.2} />
                        </View>
                    ) : (
                        <View className="shrink-0 flex-row items-center gap-1">
                            <ChevronRight size={15} color={colors.mutedForeground} strokeWidth={2.2} />
                        </View>
                    )}
                </View>
            </View>
        </AnimatedPressable>
    );
}

function TicketPerforation() {
    return (
        <View className="bg-surface">
            <View className="border-b border-dashed border-border" />
        </View>
    );
}

export function TicketHistoryCardSkeleton() {
    return (
        <View className="flex-row overflow-hidden rounded-2xl border border-border bg-card">
            <View className="w-1.5 shrink-0 bg-muted" />
            <View className="min-w-0 flex-1">
                <View className="gap-3 p-4">
                    <View className="flex-row items-center justify-between gap-2">
                        <View className="flex-row items-center gap-2">
                            <Skeleton className="h-7 w-7 rounded-lg" />
                            <Skeleton className="h-3.5 w-20 rounded-full" />
                        </View>
                        <Skeleton className="h-5 w-14 rounded-md" />
                    </View>
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                    <View className="flex-row items-center justify-between gap-3">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-1.5 w-20 rounded-full" />
                    </View>
                </View>
                <TicketPerforation />
                <View className="flex-row items-center justify-between gap-2 bg-surface px-4 py-2.5">
                    <Skeleton className="h-3.5 w-32 rounded-full" />
                    <Skeleton className="h-3.5 w-20 rounded-full" />
                </View>
            </View>
        </View>
    );
}

export default memo(TicketHistoryCard);
