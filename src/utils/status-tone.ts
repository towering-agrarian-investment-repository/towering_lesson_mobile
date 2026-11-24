import type { ThemeColors } from "@/design-system/utils/theme";
import type { TFunction } from "i18next";
import { formatType } from "./format-enum";

type Tone = {
    className: string;
    color: "mutedForeground" | "primary" | "success" | "warning" | "danger";
};

const neutral: Tone = { className: "bg-muted", color: "mutedForeground" };
const primary: Tone = { className: "bg-primary/10", color: "primary" };
const success: Tone = { className: "bg-success/10", color: "success" };
const warning: Tone = { className: "bg-warning/10", color: "warning" };
const danger: Tone = { className: "bg-danger/10", color: "danger" };

/** Reservation and attendance colors are shared by lists, details, and charts. */
export function getReservationStatusColor(colors: ThemeColors, status?: string | null) {
    switch (status?.toUpperCase().replaceAll("-", "_")) {
        case "RESERVED":
            return colors.reservationReserved;
        case "CHECKED_IN":
            return colors.reservationCheckedIn;
        case "COMPLETED":
            return colors.reservationCompleted;
        case "CANCELLED":
        case "CANCELED":
            return colors.reservationCancelled;
        case "NO_SHOW":
            return colors.reservationNoShow;
        default:
            return colors.mutedForeground;
    }
}

export function getReservationStatusLabel(status: string | null | undefined, t: TFunction) {
    switch (status?.toUpperCase().replaceAll("-", "_")) {
        case "RESERVED":
            return t("reservations.statuses.reserved");
        case "CHECKED_IN":
            return t("reservations.statuses.checkedIn");
        case "COMPLETED":
            return t("reservations.statuses.completed");
        case "CANCELLED":
        case "CANCELED":
            return t("reservations.statuses.cancelled");
        case "NO_SHOW":
            return t("reservations.statuses.noShow");
        default:
            return formatType(status, t);
    }
}

export function getLessonStatusTone(status?: string | null): Tone {
    return (
        (
            {
                SCHEDULED: warning,
                IN_PROGRESS: primary,
                COMPLETED: success,
                CANCELLED: danger,
            } as Record<string, Tone>
        )[status ?? ""] ?? neutral
    );
}

export function getSessionStatusTone(status?: string | null): Tone {
    return (
        (
            {
                PENDING: primary,
                IN_PROGRESS: warning,
                COMPLETED: success,
                CANCELLED: danger,
            } as Record<string, Tone>
        )[status ?? ""] ?? neutral
    );
}

export function getSessionTypeTone(type?: string | null): Tone {
    return ({ DRILL: primary, NON_DRILL: warning } as Record<string, Tone>)[type ?? ""] ?? neutral;
}

export function getHomeworkSubmissionTone(status?: string | null): Tone {
    return (
        (
            {
                SUBMITTED: primary,
                REVIEWED: success,
                RETURNED: warning,
            } as Record<string, Tone>
        )[status ?? ""] ?? neutral
    );
}

export function getHomeworkReviewTone(status?: string | null): Tone {
    return ({ PENDING: warning, CONFIRMED: success } as Record<string, Tone>)[status ?? ""] ?? neutral;
}

export function getEffectiveTicketStatus(status?: string | null, fullyUsed?: boolean): string {
    const normalized = status?.toUpperCase().replaceAll("-", "_") ?? "";
    if (
        fullyUsed &&
        normalized !== "EXPIRED" &&
        normalized !== "CANCELLED" &&
        normalized !== "CANCELED" &&
        normalized !== "TRANSFERRED"
    ) {
        return "FULLY_USED";
    }
    return normalized;
}

export function getTicketStatusTone(status?: string | null, fullyUsed?: boolean): Tone {
    switch (getEffectiveTicketStatus(status, fullyUsed)) {
        case "ACTIVE":
            return success;
        case "IN_USE":
            return primary;
        case "FULLY_USED":
            return warning;
        case "CANCELLED":
        case "CANCELED":
            return danger;
        case "EXPIRED":
        case "TRANSFERRED":
        default:
            return neutral;
    }
}

export function getTicketStatusLabel(
    status: string | null | undefined,
    fullyUsed: boolean | undefined,
    t: TFunction,
): string {
    switch (getEffectiveTicketStatus(status, fullyUsed)) {
        case "ACTIVE":
            return t("tickets.statuses.active");
        case "IN_USE":
            return t("tickets.statuses.inUse");
        case "FULLY_USED":
            return t("tickets.statuses.fullyUsed");
        case "EXPIRED":
            return t("tickets.statuses.expired");
        case "CANCELLED":
        case "CANCELED":
            return t("tickets.statuses.cancelled");
        case "TRANSFERRED":
            return t("tickets.statuses.transferred");
        default:
            return formatType(status, t);
    }
}
