import type { MemberActivityDay, MemberActivityStatusCounts } from "@/types/member-activity";

export function mapActivityDays(days: MemberActivityDay[]) {
    return days.map(day => ({
        date: day.date,
        count: day.count,
        status: getDisplayStatus(day.statusCounts),
        statusBreakdown: {
            reserved: day.statusCounts.RESERVED,
            "checked-in": day.statusCounts.CHECKED_IN,
            completed: day.statusCounts.COMPLETED,
            cancelled: day.statusCounts.CANCELLED,
            "no-show": day.statusCounts.NO_SHOW,
        },
        typeCounts: day.typeCounts,
    }));
}

function getDisplayStatus(statusCounts: MemberActivityStatusCounts) {
    const activeStatuses = Object.values(statusCounts).filter(count => count > 0);

    if (activeStatuses.length === 0) return undefined;
    if (activeStatuses.length > 1) return "mixed" as const;
    if (statusCounts.NO_SHOW > 0) return "no-show" as const;
    if (statusCounts.CANCELLED > 0) return "cancelled" as const;
    if (statusCounts.RESERVED > 0) return "reserved" as const;
    if (statusCounts.CHECKED_IN > 0) return "checked-in" as const;
    return "completed" as const;
}
