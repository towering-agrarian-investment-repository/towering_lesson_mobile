import {
    AppText as Text,
    cn,
    getPressedScaleStyle,
    useThemeColors,
} from "@/design-system";
import {
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { TicketListItemResponse } from "@/types/member-ticket";
import { formatType } from "@/utils/format-enum";
import { ChevronRight } from "lucide-react-native";
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

function TicketCard({ item, disabled = false, onPress, fullWidth = false }: Props) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const isInactive = item.status === "EXPIRED" || item.status === "FULLY_USED";
    const ticketTone = getTicketTypeTone(item.type);
    const isBookingDisabled =
        disabled || isInactive;

    const badgeLabel = formatType(item.type);
    const usageNote = getUsageNote(item, t);

    const handlePress = () => {
        if (isBookingDisabled) {
            return;
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
            style={({ pressed }) => getPressedScaleStyle(pressed, isBookingDisabled, 0.988)}
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
                        <Text
                            variant="badge"
                            className={cn(
                                "self-start rounded-md px-2 py-1",
                                !isInactive && ticketTone.badgeSolidClassName,
                                !isInactive && ticketTone.badgeSolidTextClassName,
                                isInactive && "bg-border text-muted-foreground",
                            )}
                        >
                            {badgeLabel}
                        </Text>

                        <ChevronRight
                            size={18}
                            color={isInactive ? colors.mutedForeground : colors.foreground}
                            strokeWidth={2.4}
                        />
                    </View>

                    <Text
                        variant="body"
                        className="text-foreground"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.name}
                    </Text>

                    <Text
                        variant="count"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-lg font-extrabold text-foreground"
                    >
                        {formatTicketDate(item.startDate)} ~ {formatTicketDate(item.endDate)}
                    </Text>
                </View>

                <View className="flex-row items-center justify-between gap-2">
                    <Text
                        variant="caption"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="min-w-0 flex-1 text-foreground"
                    >
                        {usageNote}
                    </Text>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <Text
                            variant="caption"
                            numberOfLines={1}
                            className="shrink-0 text-foreground"
                        >
                            {t("tickets.useOncePerDay")}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

export default TicketCard;
