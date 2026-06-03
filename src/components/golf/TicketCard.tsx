import { TicketListItemResponse } from "@/types/member-ticket";
import { Link } from "expo-router";
import { AppText as Text } from "@/design-system";
import {
    formatTicketTypeLabel,
    getTicketTypeStyles,
} from "@/design-system/utils/ticket-type";
import { useThemeColors } from "@/design-system/utils/theme";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
    item: TicketListItemResponse;
};

function formatTicketDate(date?: string | null) {
    if (!date) return "-";

    const value = new Date(date);

    const yy = String(value.getFullYear()).slice(2);
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");

    return `${yy}.${mm}.${dd}`;
}

function getUsageNote(item: TicketListItemResponse) {
    if (item.isUnlimited) {
        return "Unlimited Usage";
    }

    if (item.totalCount != null) {
        return `${item.remaining ?? 0} out of ${item.totalCount}`;
    }

    return "Flexible Usage";
}

function TicketCard({ item }: Props) {
    const colors = useThemeColors();
    const isInactive = item.status === "EXPIRED" || item.status === "FULLY_USED";
    const ticketStyle = getTicketTypeStyles(colors, item.type);
    const isLessonProgramTicket = item.type === "LESSON_PROGRAM";
    const isBookingDisabled = isInactive || isLessonProgramTicket;

    const badgeLabel = formatTicketTypeLabel(item.type);
    const usageNote = getUsageNote(item);

    const card = (
        <Pressable disabled={isBookingDisabled}>
            <View
                style={[
                    style.card,
                    ticketStyle.cardStyle,
                    isInactive && {
                        borderColor: colors.border,
                        backgroundColor: colors.muted,
                    },
                ]}
            >
                <Text
                    style={[
                        style.badge,
                        ticketStyle.badgeStyle,
                        isInactive && {
                            backgroundColor: colors.border,
                            color: colors.mutedForeground,
                        },
                    ]}
                >
                    {badgeLabel}
                </Text>

                <Text
                    style={[style.title, { color: colors.foreground }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {item.name}
                </Text>

                <Text style={[style.dateTitle, { color: colors.foreground }]}>
                    {formatTicketDate(item.startDate)} ~ {formatTicketDate(item.endDate)}
                </Text>

                <View style={style.footer}>
                    <Text style={[style.meta, { color: colors.mutedForeground }]}>
                        {usageNote}
                    </Text>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <Text style={[style.onceText, { color: colors.mutedForeground }]}>
                            Use once per day
                        </Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
    );

    if (isBookingDisabled) {
        return card;
    }

    return (
        <Link
            href={{
                pathname: "/select-date",
                params: {
                    ticketId: String(item.id),
                    ticketType: item.type,
                },
            }}
            asChild
        >
            {card}
        </Link>
    );
}

const style = StyleSheet.create({
    card: {
        width: 240,
        minHeight: 160,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },

    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginBottom: 12,
        fontSize: 12,
        fontWeight: "700",
    },

    title: {
        height: 40,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
    },

    dateTitle: {
        marginTop: 16,
        fontWeight: "800",
        fontSize: 16,
    },

    footer: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },

    meta: {
        fontSize: 12,
    },

    onceText: {
        fontSize: 11,
        fontWeight: "600",
    },
});

export default TicketCard;
