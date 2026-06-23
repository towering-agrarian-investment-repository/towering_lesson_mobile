export type GenderEnum = "MALE" | "FEMALE" | "OTHER";
export type MemberResponse = {
    id: number;
    authUserId: string;
    name: string;
    username: string;
    phoneNumber: string | null;
    profileImage: string | null;
    gender: GenderEnum | null;
    checkinNumber: string | null;
    isActive: boolean;
    grade: MemberGradeResponse | null;
    latestTicket: TicketResponse | null;
    parents: ParentSummaryResponse[];
};

export type ParentSummaryResponse = {
    id: number;
    name: string;
    isActive: boolean;
    childrenCount: number;
    phoneNumber: string | null;
    profileImage: string | null;
    createdAt: string; // OffsetDateTime -> ISO string
};

export type MemberGradeResponse = {
    id: number;
    name: string;
    code: string;
    schoolId: number;
    schoolName: string;
    schoolCode: string;
};

export type TicketResponse = {
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
    | "BAY_USAGE"
    | "PRIVATE_LESSON"
    | "GROUP_LESSON"
    | "LESSON_PROGRAM"
    | "LOCKER_SERVICE"
    | "LOCATION"
    | "OTHER";

export interface UserMiniResponse {
    id: number;
    username: string;
    fullName: string;
}

export type MemberStats = {
    total: number;
    active: number;
};

export type MemberRequest = {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    nationality: string;
    gradeId?: number;
    phone: string;
};

export interface UpdateMyProfileRequest {
    name?: string | null;
}
export interface UpdatePasswordRequest {
    currentPassword: string; // @NotBlank → required
    newPassword: string; // @NotBlank + @Size(min=8) → required
    confirmPassword?: string; // @Size(min=8) but NOT @NotBlank → optional
}
