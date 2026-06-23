import { AppText as Text, cn } from "@/design-system";
import {
    getTicketTypeTone,
} from "@/design-system/utils/ticket-type";
import { TicketListItemResponse } from "@/types/member-ticket";
import { formatType } from "@/utils/format-enum";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

type Props = {
    item: TicketListItemResponse;
    disabled?: boolean;
    onPress?: (item: TicketListItemResponse) => void;
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
        return t("tickets.usageRemaining", {
            remaining: item.remaining ?? 0,
            total: item.totalCount,
        });
    }

    return t("tickets.flexibleUsage");
}

function TicketCard({ item, disabled = false, onPress }: Props) {
    const { t } = useTranslation();
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
        >
            <View
                className={cn(
                    "w-[220px] min-h-[114px]  flex-col gap-4 rounded-xl border p-5",
                    !isInactive && ticketTone.borderClassName,
                    !isInactive && ticketTone.surfaceClassName,
                    isInactive && "border-border bg-muted",
                )}
            >
                <View className="flex-1 flex-col gap-3">
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

                    <Text
                        variant="body"
                        className="text-foreground"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.name}
                    </Text>

                    <Text variant="count" className="text-lg font-extrabold text-foreground">
                        {formatTicketDate(item.startDate)} ~ {formatTicketDate(item.endDate)}
                    </Text>
                </View>

                <View className="flex-row justify-between gap-3 items-center">
                    <Text variant="caption" className="text-foreground">
                        {usageNote}
                    </Text>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <Text variant="caption" className="text-foreground">
                            {t("tickets.useOncePerDay")}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );
}

export default TicketCard;
