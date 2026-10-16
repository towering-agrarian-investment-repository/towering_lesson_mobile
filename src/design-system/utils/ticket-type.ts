import type { TicketType } from "@/types/member.type";
import type { TFunction } from "i18next";
import type { ThemeColors } from "./theme";

export type TicketTypeToneName =
    "bayUsage" | "privateLesson" | "groupLesson" | "lessonProgram" | "default";

type TicketTypeToneDefinition = {
    color: keyof ThemeColors;
    badgeClassName: string;
    badgeSolidClassName: string;
    dotClassName: string;
    borderClassName: string;
    emphasisBorderClassName: string;
    surfaceClassName: string;
};

const ticketTypeToneDefinitions: Record<
    TicketTypeToneName,
    TicketTypeToneDefinition
> = {
    bayUsage: {
        color: "ticketBay",
        badgeClassName: "bg-ticket-bay/10",
        badgeSolidClassName: "bg-[#007EA7]",
        dotClassName: "bg-ticket-bay",
        borderClassName: "border-ticket-bay/20",
        emphasisBorderClassName: "border-ticket-bay",
        surfaceClassName: "bg-ticket-bay/10",
    },
    privateLesson: {
        color: "ticketPrivate",
        badgeClassName: "bg-ticket-private/10",
        badgeSolidClassName: "bg-ticket-private",
        dotClassName: "bg-ticket-private",
        borderClassName: "border-ticket-private/20",
        emphasisBorderClassName: "border-ticket-private",
        surfaceClassName: "bg-ticket-private/10",
    },
    groupLesson: {
        color: "ticketGroup",
        badgeClassName: "bg-ticket-group/10",
        badgeSolidClassName: "bg-[#C77800]",
        dotClassName: "bg-ticket-group",
        borderClassName: "border-ticket-group/20",
        emphasisBorderClassName: "border-ticket-group",
        surfaceClassName: "bg-ticket-group/10",
    },
    lessonProgram: {
        color: "ticketProgram",
        badgeClassName: "bg-ticket-program/10",
        badgeSolidClassName: "bg-ticket-program",
        dotClassName: "bg-ticket-program",
        borderClassName: "border-ticket-program/20",
        emphasisBorderClassName: "border-ticket-program",
        surfaceClassName: "bg-ticket-program/10",
    },
    default: {
        color: "ticketDefault",
        badgeClassName: "bg-ticket-default/10",
        badgeSolidClassName: "bg-ticket-default",
        dotClassName: "bg-ticket-default",
        borderClassName: "border-ticket-default/20",
        emphasisBorderClassName: "border-ticket-default",
        surfaceClassName: "bg-ticket-default/10",
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

export function formatTicketTypeLabel(
    type: TicketType | string | null | undefined,
    t: TFunction,
) {
    if (!type) {
        return "";
    }

    switch (type.toUpperCase()) {
        case "BAY_USAGE":
            return t("tickets.types.bayUsage");
        case "PRIVATE_LESSON":
            return t("tickets.types.privateLesson");
        case "GROUP_LESSON":
            return t("tickets.types.groupLesson");
        case "LESSON_PROGRAM":
            return t("tickets.types.lessonProgram");
        case "LOCKER_SERVICE":
            return t("tickets.types.lockerService");
        case "LOCATION":
            return t("tickets.types.location");
        default:
            return t("tickets.types.other");
    }
}

export function getTicketTypeTone(type?: TicketType | string | null) {
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
    const type =
        maybeType ??
        (typeof colorsOrType === "string" || colorsOrType == null
            ? (colorsOrType as TicketType | string | null | undefined)
            : undefined);

    return getTicketTypeTone(type);
}
