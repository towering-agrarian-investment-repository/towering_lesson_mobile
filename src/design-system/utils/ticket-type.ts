import type { ThemeColors } from "./theme";
import type { TicketType } from "@/types/member.type";

export type TicketTypeToneName =
    | "bayUsage"
    | "privateLesson"
    | "groupLesson"
    | "lessonProgram"
    | "default";

type TicketTypeToneDefinition = {
    badgeClassName: string;
    badgeTextClassName: string;
    dotClassName: string;
    borderClassName: string;
    emphasisBorderClassName: string;
    surfaceClassName: string;
    iconClassName: string;
    getCardStyle: (colors: ThemeColors) => {
        borderColor: string;
        backgroundColor: string;
    };
    getBadgeStyle: (colors: ThemeColors) => {
        backgroundColor: string;
        color: string;
    };
};

const ticketTypeToneDefinitions: Record<TicketTypeToneName, TicketTypeToneDefinition> = {
    bayUsage: {
        badgeClassName: "bg-ticket-bay/10",
        badgeTextClassName: "text-ticket-bay",
        dotClassName: "bg-ticket-bay",
        borderClassName: "border-ticket-bay/20",
        emphasisBorderClassName: "border-ticket-bay",
        surfaceClassName: "bg-ticket-bay/10",
        iconClassName: "text-ticket-bay",
        getCardStyle: (colors) => ({
            borderColor: colors.ticketBay,
            backgroundColor: `${colors.ticketBay}12`,
        }),
        getBadgeStyle: (colors) => ({
            backgroundColor: colors.ticketBay,
            color: colors.primaryForeground,
        }),
    },
    privateLesson: {
        badgeClassName: "bg-ticket-private/10",
        badgeTextClassName: "text-ticket-private",
        dotClassName: "bg-ticket-private",
        borderClassName: "border-ticket-private/20",
        emphasisBorderClassName: "border-ticket-private",
        surfaceClassName: "bg-ticket-private/10",
        iconClassName: "text-ticket-private",
        getCardStyle: (colors) => ({
            borderColor: colors.ticketPrivate,
            backgroundColor: `${colors.ticketPrivate}12`,
        }),
        getBadgeStyle: (colors) => ({
            backgroundColor: colors.ticketPrivate,
            color: colors.primaryForeground,
        }),
    },
    groupLesson: {
        badgeClassName: "bg-ticket-group/10",
        badgeTextClassName: "text-ticket-group",
        dotClassName: "bg-ticket-group",
        borderClassName: "border-ticket-group/20",
        emphasisBorderClassName: "border-ticket-group",
        surfaceClassName: "bg-ticket-group/10",
        iconClassName: "text-ticket-group",
        getCardStyle: (colors) => ({
            borderColor: colors.ticketGroup,
            backgroundColor: `${colors.ticketGroup}12`,
        }),
        getBadgeStyle: (colors) => ({
            backgroundColor: colors.ticketGroup,
            color: colors.primaryForeground,
        }),
    },
    lessonProgram: {
        badgeClassName: "bg-ticket-program/10",
        badgeTextClassName: "text-ticket-program",
        dotClassName: "bg-ticket-program",
        borderClassName: "border-ticket-program/20",
        emphasisBorderClassName: "border-ticket-program",
        surfaceClassName: "bg-ticket-program/10",
        iconClassName: "text-ticket-program",
        getCardStyle: (colors) => ({
            borderColor: colors.ticketProgram,
            backgroundColor: `${colors.ticketProgram}12`,
        }),
        getBadgeStyle: (colors) => ({
            backgroundColor: colors.ticketProgram,
            color: colors.primaryForeground,
        }),
    },
    default: {
        badgeClassName: "bg-ticket-default/10",
        badgeTextClassName: "text-ticket-default",
        dotClassName: "bg-ticket-default",
        borderClassName: "border-border",
        emphasisBorderClassName: "border-ticket-default",
        surfaceClassName: "bg-ticket-default/10",
        iconClassName: "text-ticket-default",
        getCardStyle: (colors) => ({
            borderColor: colors.border,
            backgroundColor: colors.surface,
        }),
        getBadgeStyle: (colors) => ({
            backgroundColor: colors.ticketDefault,
            color: colors.primaryForeground,
        }),
    },
};

export function getTicketTypeToneName(
    type?: TicketType | string | null,
): TicketTypeToneName {
    switch (String(type ?? "").toUpperCase()) {
        case "BAY_USAGE":
            return "bayUsage";
        case "PRIVATE_LESSON":
            return "privateLesson";
        case "GROUP_LESSON":
            return "groupLesson";
        case "LESSON_PROGRAM":
            return "lessonProgram";
        default:
            return "default";
    }
}

export function formatTicketTypeLabel(type?: TicketType | string | null) {
    if (!type) {
        return "";
    }

    return type
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function getTicketTypeTone(
    type?: TicketType | string | null,
) {
    const name = getTicketTypeToneName(type);
    const tone = ticketTypeToneDefinitions[name];

    return {
        name,
        ...tone,
    };
}

export function getTicketTypeStyles(
    colors: ThemeColors,
    type?: TicketType | string | null,
) {
    const tone = getTicketTypeTone(type);

    return {
        ...tone,
        cardStyle: tone.getCardStyle(colors),
        badgeStyle: tone.getBadgeStyle(colors),
    };
}
