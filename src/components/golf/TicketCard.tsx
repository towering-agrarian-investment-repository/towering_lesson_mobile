import { AnimatedPressable, cn, Skeleton } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel, getTicketTypeTone, isBookableTicketType } from "@/design-system/utils/ticket-type";
import type { MemberTicketSummaryResponse } from "@/types/member-ticket";
import { getTicketStatusGroup } from "@/utils/status-tone";
import { formatTicketPausePeriod, getTicketPausePeriods } from "@/utils/ticket-pause";
import { getAppTimeZoneDateParts } from "@/utils/timezone";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { TicketPausePeriods } from "./TicketPausePeriods";

type Props = {
    item: MemberTicketSummaryResponse;
    todayKey: string;
    disabled?: boolean;
    onPress?: (item: MemberTicketSummaryResponse) => void;
    fullWidth?: boolean;
};

function formatTicketDate(date?: string | null) {
    if (!date) return "-";

    const parts = getAppTimeZoneDateParts(date);
    if (!parts) return "-";

    return `${parts.year.slice(2)}.${parts.month}.${parts.day}`;
}

function getUsageNote(
    item: MemberTicketSummaryResponse,
    t: (key: string, options?: Record<string, unknown>) => string,
) {
    if (item.isUnlimited) {
        return t("tickets.unlimitedUsage");
    }

    if (item.totalCount != null) {
        return t("tickets.usage", {
            used: item.usedCount ?? 0,
            total: item.totalCount,
        });
    }

    return t("tickets.flexibleUsage");
}

function TicketCard({ item, todayKey, disabled = false, onPress, fullWidth = false }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const effectiveStatus = item.effectiveStatus;
    const isRefunded = effectiveStatus === "REFUNDED";
    const isFullyUsed = effectiveStatus === "FULLY_USED";
    const isInactive = getTicketStatusGroup(effectiveStatus) !== "active";
    const ticketTone = getTicketTypeTone(item.type);
    const isPressDisabled = disabled || isInactive || (isBookableTicketType(item.type) && !item.canStartBooking);

    const badgeLabel = formatTicketTypeLabel(item.type, t) || "-";
    const usageNote = getUsageNote(item, t);
    const pausePeriods = getTicketPausePeriods(item.pauses).filter(({ endDate }) => endDate >= todayKey);
    const inactiveBadgeLabel = isRefunded
        ? t("tickets.statuses.refunded")
        : isFullyUsed
          ? t("tickets.limitReachedBadge")
          : null;
    const accessibilityStatus = isRefunded
        ? inactiveBadgeLabel
        : isFullyUsed
          ? t("tickets.limitReached")
          : item.type === "LESSON_PROGRAM"
            ? t("tickets.adminEnrollmentLabel")
            : null;

    return (
        <AnimatedPressable
            disabled={isPressDisabled}
            haptic={isPressDisabled ? false : "selection"}
            onPress={() => {
                if (isPressDisabled) {
                    return;
                }
                onPress?.(item);
            }}
            accessibilityRole="button"
            accessibilityLabel={accessibilityStatus ? `${item.name}, ${accessibilityStatus}` : item.name}
            accessibilityHint={pausePeriods.map((period) => formatTicketPausePeriod(period, t)).join(", ") || undefined}
            accessibilityState={{ disabled: isPressDisabled }}
            className={cn(
                "min-h-[148px] flex-col gap-3 rounded-xl border p-5",
                fullWidth ? "w-full" : "w-[220px]",
                !isInactive && ticketTone.borderClassName,
                !isInactive && ticketTone.surfaceClassName,
                isInactive && "border-border bg-muted",
                isPressDisabled && "opacity-75",
            )}
        >
            <View className="flex-col gap-3">
                <View className="flex-row items-center justify-between gap-3">
                    <View
                        className={cn(
                            "self-start rounded-md px-2 py-1",
                            !isInactive && ticketTone.badgeSolidClassName,
                            isInactive && "bg-border",
                        )}
                    >
                        <AppText
                            variant="badge"
                            wrap={false}
                            color={isInactive ? "mutedForeground" : "primaryForeground"}
                        >
                            {badgeLabel}
                        </AppText>
                    </View>

                    {inactiveBadgeLabel ? (
                        <View className="min-w-0 shrink rounded-md bg-card px-2 py-1">
                            <AppText
                                variant="badge"
                                color={isRefunded ? "mutedForeground" : "warning"}
                                align="right"
                                numberOfLines={2}
                            >
                                {inactiveBadgeLabel}
                            </AppText>
                        </View>
                    ) : item.type !== "LESSON_PROGRAM" ? (
                        <ChevronRight
                            size={18}
                            color={isInactive ? colors.mutedForeground : colors.foreground}
                            strokeWidth={2.4}
                        />
                    ) : (
                        <AppText variant="badge" color="mutedForeground" align="right" numberOfLines={2}>
                            {t("tickets.adminEnrollmentLabel")}
                        </AppText>
                    )}
                </View>

                <AppText variant="body" numberOfLines={1}>
                    {item.name}
                </AppText>

                <AppText variant="subtitle" tabular numberOfLines={1} textStyle={{ fontWeight: "700" }}>
                    {`${formatTicketDate(item.startDate)} ~ ${formatTicketDate(item.endDate)}`}
                </AppText>
            </View>

            <View className="flex-row items-center justify-between gap-2">
                <AppText
                    variant="caption"
                    color="mutedForeground"
                    tabular
                    numberOfLines={1}
                    style={{ flex: 1, minWidth: 0 }}
                >
                    {usageNote}
                </AppText>

                {!item.isUnlimited && item.onlyOnePerDay ? (
                    <AppText
                        variant="caption"
                        color="mutedForeground"
                        wrap={false}
                        numberOfLines={1}
                        style={{ flexShrink: 0 }}
                    >
                        {t("tickets.useOncePerDay")}
                    </AppText>
                ) : null}
            </View>
            <TicketPausePeriods periods={pausePeriods} />
        </AnimatedPressable>
    );
}

export function TicketCardSkeleton() {
    return (
        <View
            className="min-h-[148px] w-full flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5"
            accessibilityRole="progressbar"
        >
            <View className="flex-col gap-3">
                <View className="flex-row items-center justify-between">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                </View>
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
            </View>
            <View className="flex-row items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
            </View>
        </View>
    );
}

export default memo(TicketCard);
