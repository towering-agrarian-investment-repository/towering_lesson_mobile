import { AppText } from "@/design-system/components/AppText";
import { cn, getPressedScaleStyle } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import { TicketListItemResponse } from "@/types/member-ticket";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Props = {
    item: TicketListItemResponse;
    disabled?: boolean;
    onPress?: (item: TicketListItemResponse) => void;
    fullWidth?: boolean;
};

function formatTicketDate(date?: string | null) {
    if (!date) return "-";

    const value = new Date(date);

    const yy = String(value.getFullYear()).slice(2);
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");

    return `${yy}.${mm}.${dd}`;
}

function getUsageNote(
    item: TicketListItemResponse,
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

function TicketCard({
    item,
    disabled = false,
    onPress,
    fullWidth = false,
}: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const isInactive =
        item.status === "EXPIRED" || item.status === "FULLY_USED";
    const ticketTone = getTicketTypeTone(item.type);
    const isBookingDisabled = disabled || isInactive;

    const badgeLabel = formatTicketTypeLabel(item.type, t) || "-";
    const usageNote = getUsageNote(item, t);

    const handlePress = () => {
        if (isBookingDisabled) {
            return;
        }

        if (process.env.EXPO_OS !== "web") {
            void Haptics.selectionAsync();
        }

        onPress?.(item);
    };

    return (
        <Pressable
            disabled={isBookingDisabled}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            className={isBookingDisabled ? "opacity-75" : undefined}
            style={({ pressed }) =>
                getPressedScaleStyle(pressed, isBookingDisabled, 0.988)
            }
        >
            <View
                className={cn(
                    cn(
                        "min-h-[148px] flex-col gap-3 rounded-xl border p-5",
                        fullWidth ? "w-full" : "w-[220px]",
                    ),
                    !isInactive && ticketTone.borderClassName,
                    !isInactive && ticketTone.surfaceClassName,
                    isInactive && "border-border bg-muted",
                )}
            >
                <View className="flex-col gap-3">
                    <View className="flex-row items-center justify-between gap-3">
                        <View className={cn(
                            "self-start rounded-md px-2 py-1",
                            !isInactive && ticketTone.badgeSolidClassName,
                            isInactive && "bg-border",
                        )}>
                            <AppText
                                variant="badge"
                                wrap={false}
                                color={isInactive ? "mutedForeground" : "primaryForeground"}
                            >
                                {badgeLabel}
                            </AppText>
                        </View>

                        {item.type !== "LESSON_PROGRAM" ? (
                            <ChevronRight
                                size={18}
                                color={
                                    isInactive
                                        ? colors.mutedForeground
                                        : colors.foreground
                                }
                                strokeWidth={2.4}
                            />
                        ) : null}
                    </View>

                    <AppText variant="body" numberOfLines={1}>
                        {item.name}
                    </AppText>

                    <AppText
                        variant="count"
                        numberOfLines={1}
                        textStyle={{ lineHeight: typography.h3.lineHeight, fontSize: typography.subtitle.fontSize, fontWeight: "800" as const }}
                    >
                        {formatTicketDate(item.startDate) +
                            " ~ " +
                            formatTicketDate(item.endDate)}
                    </AppText>
                </View>

                <View className="flex-row items-center justify-between gap-2">
                    <AppText variant="caption" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
                        {usageNote}
                    </AppText>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <AppText variant="caption" wrap={false} numberOfLines={1} style={{ flexShrink: 0 }}>
                            {t("tickets.useOncePerDay")}
                        </AppText>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

export default memo(TicketCard);
