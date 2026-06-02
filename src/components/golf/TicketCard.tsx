import { TicketListItemResponse } from "@/types/member-ticket";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
    item: TicketListItemResponse;
};

function normalizeLabel(value?: string | null) {
    if (!value) return "";

    return value
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

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

function getTicketStyle(type?: string | null, inactive?: boolean) {
    if (inactive) {
        return {
            card: style.inactiveCard,
            badge: style.inactiveBadge,
        };
    }

    switch (String(type ?? "").toUpperCase()) {
        case "BAY_USAGE":
            return {
                card: style.bayCard,
                badge: style.bayBadge,
            };

        case "PRIVATE_LESSON":
            return {
                card: style.privateCard,
                badge: style.privateBadge,
            };

        case "GROUP_LESSON":
            return {
                card: style.groupCard,
                badge: style.groupBadge,
            };

        case "LESSON_PROGRAM":
            return {
                card: style.programCard,
                badge: style.programBadge,
            };

        default:
            return {
                card: style.defaultCard,
                badge: style.defaultBadge,
            };
    }
}

function TicketCard({ item }: Props) {
    const isInactive = item.status === "EXPIRED" || item.status === "FULLY_USED";
    const ticketStyle = getTicketStyle(item.type, isInactive);
    const isLessonProgramTicket = item.type === "LESSON_PROGRAM";
    const isBookingDisabled = isInactive || isLessonProgramTicket;

    const badgeLabel = normalizeLabel(item.type);
    const usageNote = getUsageNote(item);

    const card = (
        <Pressable disabled={isBookingDisabled}>
            <View style={[style.card, ticketStyle.card]}>
                <Text style={[style.badge, ticketStyle.badge]}>{badgeLabel}</Text>

                <Text style={style.title} numberOfLines={2} ellipsizeMode="tail">
                    {item.name}
                </Text>

                <Text style={style.dateTitle}>
                    {formatTicketDate(item.startDate)} ~ {formatTicketDate(item.endDate)}
                </Text>

                <View style={style.footer}>
                    <Text style={style.meta}>{usageNote}</Text>

                    {!item.isUnlimited && item.onlyOnePerDay ? (
                        <Text style={style.onceText}>Use once per day</Text>
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
        color: "white",
    },

    title: {
        height: 40,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        color: "#0f172a",
    },

    dateTitle: {
        marginTop: 16,
        fontWeight: "800",
        fontSize: 16,
        color: "#0f172a",
    },

    footer: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },

    meta: {
        fontSize: 12,
        color: "#475569",
    },

    onceText: {
        fontSize: 11,
        color: "#64748b",
        fontWeight: "600",
    },

    bayCard: {
        borderColor: "#a7f3d0",
        backgroundColor: "#ecfdf5",
    },
    bayBadge: {
        backgroundColor: "#10b981",
    },

    privateCard: {
        borderColor: "#bae6fd",
        backgroundColor: "#f0f9ff",
    },
    privateBadge: {
        backgroundColor: "#0ea5e9",
    },

    groupCard: {
        borderColor: "#fde68a",
        backgroundColor: "#fffbeb",
    },
    groupBadge: {
        backgroundColor: "#f59e0b",
    },

    programCard: {
        borderColor: "#a5f3fc",
        backgroundColor: "#ecfeff",
    },
    programBadge: {
        backgroundColor: "#0891b2",
    },

    defaultCard: {
        borderColor: "#e2e8f0",
        backgroundColor: "#f0f0f5",
    },
    defaultBadge: {
        backgroundColor: "#334155",
    },

    inactiveCard: {
        borderColor: "#e2e8f0",
        backgroundColor: "#f1f5f9",
    },
    inactiveBadge: {
        backgroundColor: "#cbd5e1",
        color: "#334155",
    },
});

export default TicketCard;
