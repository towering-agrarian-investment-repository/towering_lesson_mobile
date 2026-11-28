import type { MemberReservationSummaryResponse } from "./member-reservation";
import type { TicketStatus } from "./member.type";

export type MemberTicketPauseResponse = {
    id: number;
    pausedStartDate: string;
    pausedEndDate: string;
};

export type MemberTicketSummaryResponse = {
    id: number;
    coachName: string | null;
    name: string;
    type: string;
    totalCount: number | null;
    isUnlimited: boolean;
    onlyOnePerDay: boolean;
    usedCount: number;
    remainingCount: number | null;
    startDate: string | null;
    endDate: string | null;
    effectiveStatus: TicketStatus | "TRANSFERRED";
    canStartBooking: boolean;
    pauses: MemberTicketPauseResponse[];
};

export type MemberTicketDetailResponse = MemberTicketSummaryResponse & {
    reservations?: MemberReservationSummaryResponse[];
};
