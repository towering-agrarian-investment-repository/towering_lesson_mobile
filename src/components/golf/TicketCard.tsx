import { AnimatedPressable, cn, Skeleton } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { useTheme } from "@/design-system/utils/theme";
import { formatTicketTypeLabel, getTicketTypeTone } from "@/design-system/utils/ticket-type";
import type { TicketListItemResponse } from "@/types/member-ticket";
import { toAppTimeZoneDate } from "@/utils/timezone";
import { ChevronRight } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type Props = {
    item: TicketListItemResponse;
    disabled?: boolean;
    onPress?: (item: TicketListItemResponse) => void;
    fullWidth?: boolean;
};

function formatTicketDate(date?: string | null) {
    if (!date) return "-";

    const value = toAppTimeZoneDate(date) ?? new Date(date);
    if (Number.isNaN(value.getTime())) return "-";

    const yy = String(value.getFullYear()).slice(2);
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");

    return `${yy}.${mm}.${dd}`;
}

function getUsageNote(item: TicketListItemResponse, t: (key: string, options?: Record<string, unknown>) => string) {
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

function TicketCard({ item, disabled = false, onPress, fullWidth = false }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const isFullyUsed = item.fullyUsed || item.status === "FULLY_USED";
    const isInactive = item.status === "EXPIRED" || isFullyUsed;
    const ticketTone = getTicketTypeTone(item.type);
    const isPressDisabled = disabled || isInactive;

    const badgeLabel = formatTicketTypeLabel(item.type, t) || "-";
    const usageNote = getUsageNote(item, t);

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
            accessibilityLabel={
                isFullyUsed
                    ? `${item.name}, ${t("tickets.limitReached")}`
                    : item.type === "LESSON_PROGRAM"
                      ? `${item.name}, ${t("tickets.adminEnrollmentLabel")}`
                      : item.name
            }
            accessibilityState={{ disabled: isPressDisabled }}
            className={isPressDisabled ? "opacity-75" : undefined}
        >
            <View
                className={cn(
                    "min-h-[148px] flex-col gap-3 rounded-xl border p-5",
                    fullWidth ? "w-full" : "w-[220px]",
                    !isInactive && ticketTone.borderClassName,
                    !isInactive && ticketTone.surfaceClassName,
                    isInactive && "border-border bg-muted",
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

                        {isFullyUsed ? (
                            <View className="min-w-0 shrink rounded-md bg-card px-2 py-1">
                                <AppText variant="badge" color="warning" align="right" numberOfLines={2}>
                                    {t("tickets.limitReachedBadge")}
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
            </View>
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
