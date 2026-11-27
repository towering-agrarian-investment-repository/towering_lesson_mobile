export type GenderEnum = "MALE" | "FEMALE" | "OTHER";

export type MemberSelfResponse = {
    id: number;
    name: string;
    nickname?: string | null;
    phoneNumber: string;
    profileImage: string | null;
    gender: GenderEnum | null;
    checkinNumber: string | null;
    membershipActive: boolean;
    grade: MemberGradeResponse | null;
    latestTicket: MemberLatestTicketResponse | null;
    parents: ParentSummaryResponse[];
};

type ParentSummaryResponse = {
    id: number;
    name: string;
    role: string;
    phoneNumber: string | null;
    profileImage: string | null;
};

type MemberGradeResponse = {
    id: number;
    name: string;
    code: string;
    schoolId: number;
    schoolName: string;
    schoolCode: string;
};

type MemberLatestTicketResponse = {
    id: number;
    name: string;
    type: TicketType;
    period: number | null;
    totalCount: number | null;
    isUnlimited: boolean;
    onlyOnePerDay: boolean;
    usedCount: number;
    remainingCount: number;
    fullyUsed: boolean;
    startDate: string | null;
    endDate: string | null;
    status: TicketStatus;
};
export type TicketStatus = "ACTIVE" | "EXPIRED" | "IN_USE" | "FULLY_USED" | "CANCELLED" | "REFUNDED";
export type TicketType =
    "BAY_USAGE" | "PRIVATE_LESSON" | "GROUP_LESSON" | "LESSON_PROGRAM" | "LOCKER_SERVICE" | "LOCATION" | "OTHER";

export interface UpdateMyProfileRequest {
    name?: string | null;
    nickname?: string | null;
}
