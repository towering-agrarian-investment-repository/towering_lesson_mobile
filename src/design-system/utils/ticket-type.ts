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
    badgeSolidClassName: string;
    badgeSolidTextClassName: string;
    dotClassName: string;
    borderClassName: string;
    emphasisBorderClassName: string;
    surfaceClassName: string;
    iconClassName: string;
};

const ticketTypeToneDefinitions: Record<TicketTypeToneName, TicketTypeToneDefinition> = {
    bayUsage: {
        badgeClassName: "bg-ticket-bay/10",
        badgeTextClassName: "text-ticket-bay",
        badgeSolidClassName: "bg-ticket-bay",
        badgeSolidTextClassName: "text-primary-foreground",
        dotClassName: "bg-ticket-bay",
        borderClassName: "border-ticket-bay/20",
        emphasisBorderClassName: "border-ticket-bay",
        surfaceClassName: "bg-ticket-bay/10",
        iconClassName: "text-ticket-bay",
    },
    privateLesson: {
        badgeClassName: "bg-ticket-private/10",
        badgeTextClassName: "text-ticket-private",
        badgeSolidClassName: "bg-ticket-private",
        badgeSolidTextClassName: "text-primary-foreground",
        dotClassName: "bg-ticket-private",
        borderClassName: "border-ticket-private/20",
        emphasisBorderClassName: "border-ticket-private",
        surfaceClassName: "bg-ticket-private/10",
        iconClassName: "text-ticket-private",
    },
    groupLesson: {
        badgeClassName: "bg-ticket-group/10",
        badgeTextClassName: "text-ticket-group",
        badgeSolidClassName: "bg-ticket-group",
        badgeSolidTextClassName: "text-primary-foreground",
        dotClassName: "bg-ticket-group",
        borderClassName: "border-ticket-group/20",
        emphasisBorderClassName: "border-ticket-group",
        surfaceClassName: "bg-ticket-group/10",
        iconClassName: "text-ticket-group",
    },
    lessonProgram: {
        badgeClassName: "bg-ticket-program/10",
        badgeTextClassName: "text-ticket-program",
        badgeSolidClassName: "bg-ticket-program",
        badgeSolidTextClassName: "text-primary-foreground",
        dotClassName: "bg-ticket-program",
        borderClassName: "border-ticket-program/20",
        emphasisBorderClassName: "border-ticket-program",
        surfaceClassName: "bg-ticket-program/10",
        iconClassName: "text-ticket-program",
    },
    default: {
        badgeClassName: "bg-ticket-default/10",
        badgeTextClassName: "text-ticket-default",
        badgeSolidClassName: "bg-ticket-default",
        badgeSolidTextClassName: "text-primary-foreground",
        dotClassName: "bg-ticket-default",
        borderClassName: "border-ticket-default/20",
        emphasisBorderClassName: "border-ticket-default",
        surfaceClassName: "bg-ticket-default/10",
        iconClassName: "text-ticket-default",
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
    colorsOrType?: unknown,
    maybeType?: TicketType | string | null,
) {
    const type = maybeType ?? (
        typeof colorsOrType === "string" || colorsOrType == null
            ? colorsOrType as TicketType | string | null | undefined
            : undefined
    );

    return getTicketTypeTone(type);
}
