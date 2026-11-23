import type { TFunction } from "i18next";

const ENUM_TRANSLATION_KEYS: Record<string, string> = {
    ACTIVE: "enums.active",
    INACTIVE: "enums.inactive",
    COMPLETED: "enums.completed",
    CANCELLED: "enums.cancelled",
    CANCELED: "enums.cancelled",
    ARCHIVED: "enums.archived",
    OPEN: "enums.open",
    CLOSED: "enums.closed",
    PENDING: "enums.pending",
    SCHEDULED: "enums.scheduled",
    IN_PROGRESS: "enums.inProgress",
    DRAFT: "enums.draft",
    RESERVED: "enums.reserved",
    CHECKED_IN: "enums.checkedIn",
    NO_SHOW: "enums.noShow",
    PRESENT: "enums.present",
    ABSENT: "enums.absent",
    PRIVATE_LESSON: "enums.privateLesson",
    GROUP_LESSON: "enums.groupLesson",
    DRILL: "enums.drill",
    NON_DRILL: "enums.nonDrill",
    ASSIGNED: "enums.assigned",
    SUBMITTED: "enums.submitted",
    REVIEWED: "enums.reviewed",
    RETURNED: "enums.returned",
    CONFIRMED: "enums.confirmed",
    APPROVED: "enums.approved",
    REJECTED: "enums.rejected",
    OVERDUE: "enums.overdue",
    MISSING: "enums.missing",
    PARENT: "enums.parent",
    GUARDIAN: "enums.guardian",
    MOTHER: "enums.mother",
    FATHER: "enums.father",
    MEMBER: "enums.member",
    FAMILY: "enums.family",
    EMERGENCY_CONTACT: "enums.emergencyContact",
    BAY_USAGE: "enums.bayUsage",
    LESSON_PROGRAM: "enums.lessonProgram",
    LOCKER_SERVICE: "enums.lockerService",
    LOCATION: "enums.location",
    OTHER: "enums.other",
    EXPIRED: "enums.expired",
    IN_USE: "enums.inUse",
    FULLY_USED: "enums.fullyUsed",
};

export function formatType(value: string | null | undefined, t: TFunction) {
    if (!value) return "-";

    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
    const key = ENUM_TRANSLATION_KEYS[normalized];
    return key ? t(key) : value;
}
