export type MemberActivityStatus = "RESERVED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type MemberActivityStatusCounts = Record<MemberActivityStatus, number>;
export type MemberActivityTypeCounts = { lesson: number; bay: number };

export type MemberActivityDay = {
    date: string;
    count: number;
    statusCounts: MemberActivityStatusCounts;
    typeCounts: MemberActivityTypeCounts;
};

export type MemberActivityWeek = {
    weekStart: string;
    weekEnd: string;
    count: number;
    statusCounts: MemberActivityStatusCounts;
    typeCounts: MemberActivityTypeCounts;
};

export type MemberActivityResponse = {
    year: number | null;
    range?: "all" | "year";
    totalReservationDays: number;
    totalReservationHours: number;
    totalReservations: number;
    daily: MemberActivityDay[];
    weekly: MemberActivityWeek[];
};
