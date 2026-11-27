import type { MemberReservationSummaryResponse } from "./member-reservation";

export type MemberTicketPauseResponse = {
    id: number;
    ticketId: number;
    pausedStartDate: string;
    pausedEndDate: string;
};

export type MemberTicketSummaryResponse = {
    id: number;
    coachName: string | null;
    name: string;
    type: string;
    period: number | null;
    totalCount: number | null;
    isUnlimited: boolean;
    onlyOnePerDay: boolean;
    usedCount: number;
    remainingCount: number;
    fullyUsed: boolean;
    startDate: string | null;
    endDate: string | null;
    status: string;
    pauses: MemberTicketPauseResponse[];
};

export type MemberTicketDetailResponse = MemberTicketSummaryResponse & {
    reservations?: MemberReservationSummaryResponse[];
};
