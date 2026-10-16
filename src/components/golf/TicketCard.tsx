import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { cn, getPressedScaleStyle, useThemeColors } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import {
    formatTicketTypeLabel,
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { typography } from "@/design-system/utils/typography";
import { TicketListItemResponse } from "@/types/member-ticket";
import { Host, Text } from "@expo/ui";
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
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
                            <Host
                                matchContents
                                ignoreSafeArea="all"


                            >
                                <Text
                                    textStyle={{
                                        ...typography.badge, lineHeight: typography.badge.lineHeight * uiFontScale,
                                        color: isInactive
                                            ? uiColors.mutedForeground
                                            : uiColors.primaryForeground,
                                        fontSize:
                                            typography.badge.fontSize * uiFontScale,
                                    }}
                                >
                                    {badgeLabel}
                                </Text>
                            </Host>
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

                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            numberOfLines={1}
                            textStyle={{
                                ...typography.body, lineHeight: typography.body.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                fontSize:
                                    typography.body.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {item.name}
                        </Text>
                    </Host>

                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            numberOfLines={1}
                            textStyle={{
                                ...typography.count, lineHeight: typography.h3.lineHeight * uiFontScale,
                                fontSize: typography.subtitle.fontSize * uiFontScale,
                                fontWeight: "800" as const,
                                color: uiColors.foreground,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {formatTicketDate(item.startDate) +
                                " ~ " +
                                formatTicketDate(item.endDate)}
                        </Text>
                    </Host>
                </View>

                <View className="flex-row items-center justify-between gap-2">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        style={{ flex: 1, minWidth: 0 }}
                    >
                        <Text
                            numberOfLines={1}
                            textStyle={{
                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                color: uiColors.foreground,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {usageNote}
                        </Text>
                    </Host>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <Host
                            matchContents
                            ignoreSafeArea="all"
                            style={{ flexShrink: 0 }}
                        >
                            <Text
                                numberOfLines={1}
                                textStyle={{
                                    ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.caption.fontSize *
                                        uiFontScale,
                                }}
                            >
                                {t("tickets.useOncePerDay")}
                            </Text>
                        </Host>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

export default memo(TicketCard);
