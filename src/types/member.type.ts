export type GenderEnum = "MALE" | "FEMALE" | "OTHER";

export type MemberSelfResponse = {
    id: number;
    authUserId: string;
    name: string;
    nickname?: string | null;
    phoneNumber: string;
    profileImage: string | null;
    gender: GenderEnum | null;
    checkinNumber: string;
    isActive: boolean;
    grade: MemberGradeResponse | null;
    latestTicket: TicketResponse | null;
    parents: ParentSummaryResponse[];
};

type ParentSummaryResponse = {
    id: number;
    name: string;
    phoneNumber: string | null;
    profileImage: string | null;
    gender: GenderEnum;
    role?: string | null;
};

type MemberGradeResponse = {
    id: number;
    name: string;
    code: string;
    schoolId: number;
    schoolName: string;
    schoolCode: string;
};

type TicketResponse = {
    id: number;
    transactionId: number;
    name: string;
    type: TicketType;
    originalPrice: number; // BigDecimal
    discountAmount: number; // BigDecimal
    price: number; // BigDecimal
    period: number | null;
    totalCount: number | null;
    isUnlimited: boolean;
    onlyOnePerDay: boolean;
    usage: number;
    remaining: number;
    startDate: string; // OffsetDateTime -> ISO string
    endDate: string; // OffsetDateTime -> ISO string
    status: TicketStatus;
};
export type TicketStatus = "ACTIVE" | "EXPIRED" | "IN_USE" | "FULLY_USED" | "CANCELLED";
export type TicketType =
    "BAY_USAGE" | "PRIVATE_LESSON" | "GROUP_LESSON" | "LESSON_PROGRAM" | "LOCKER_SERVICE" | "LOCATION" | "OTHER";

export interface UpdateMyProfileRequest {
    name?: string | null;
    nickname?: string | null;
}
