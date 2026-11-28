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

const LESSON_STATUS_TONES: Record<string, Tone> = {
    SCHEDULED: warning,
    IN_PROGRESS: primary,
    COMPLETED: success,
    CANCELLED: danger,
};

const SESSION_STATUS_TONES: Record<string, Tone> = {
    PENDING: primary,
    IN_PROGRESS: warning,
    COMPLETED: success,
    CANCELLED: danger,
};

const SESSION_TYPE_TONES: Record<string, Tone> = {
    DRILL: primary,
    NON_DRILL: warning,
};

const HOMEWORK_SUBMISSION_TONES: Record<string, Tone> = {
    SUBMITTED: primary,
    REVIEWED: success,
    RETURNED: warning,
};

const HOMEWORK_REVIEW_TONES: Record<string, Tone> = {
    PENDING: warning,
    CONFIRMED: success,
};

export function getLessonStatusTone(status?: string | null): Tone {
    return LESSON_STATUS_TONES[status ?? ""] ?? neutral;
}

export function getSessionStatusTone(status?: string | null): Tone {
    return SESSION_STATUS_TONES[status ?? ""] ?? neutral;
}

export function getSessionTypeTone(type?: string | null): Tone {
    return SESSION_TYPE_TONES[type ?? ""] ?? neutral;
}

export function getHomeworkSubmissionTone(status?: string | null): Tone {
    return HOMEWORK_SUBMISSION_TONES[status ?? ""] ?? neutral;
}

export function getHomeworkReviewTone(status?: string | null): Tone {
    return HOMEWORK_REVIEW_TONES[status ?? ""] ?? neutral;
}

export function getEffectiveTicketStatus(status?: string | null, fullyUsed?: boolean): string {
    const normalized = status?.toUpperCase().replaceAll("-", "_") ?? "";
    if (fullyUsed && (normalized === "ACTIVE" || normalized === "IN_USE")) {
        return "FULLY_USED";
    }
    return normalized;
}

export function getTicketStatusGroup(status?: string | null, fullyUsed?: boolean): "active" | "past" | "other" {
    switch (getEffectiveTicketStatus(status, fullyUsed)) {
        case "ACTIVE":
        case "IN_USE":
            return "active";
        case "FULLY_USED":
        case "EXPIRED":
        case "CANCELLED":
        case "CANCELED":
        case "TRANSFERRED":
        case "REFUNDED":
            return "past";
        default:
            return "other";
    }
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
        case "REFUNDED":
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
        case "REFUNDED":
            return t("tickets.statuses.refunded");
        default:
            return formatType(status, t);
    }
}
