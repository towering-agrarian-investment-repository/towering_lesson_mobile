import type { MemberReservationDetailResponse } from "@/lib/hook/useReservation";
import type { MemberBayReservationResponse } from "@/types/member-bay";
import type { MemberLessonReservationResponse } from "@/types/member-lesson";
import type { MemberReservationDomain } from "@/types/member-reservation";

export function isReservationDomain(value?: string | string[]): value is MemberReservationDomain {
    return value === "lesson" || value === "bay";
}

export function isBayReservationDetail(
    reservation: MemberReservationDetailResponse,
): reservation is MemberBayReservationResponse {
    return reservation.reservationType === "bay";
}

export function isLessonReservationDetail(
    reservation: MemberReservationDetailResponse,
): reservation is MemberLessonReservationResponse {
    return reservation.reservationType === "lesson";
}

export function getReservationTitle(reservation: MemberReservationDetailResponse, t: (key: string) => string) {
    const name = isBayReservationDetail(reservation) ? reservation.bayName : reservation.lessonAvailability?.name;

    return name?.trim() || t("common.notAvailable");
}

export function getReservationPolicies(t: (key: string) => string) {
    return {
        lesson: [
            {
                title: t("bookingConfirmation.lessonCancellationPolicyTitle"),
                description: t("bookingConfirmation.lessonCancellationPolicyDescription"),
            },
            {
                title: t("bookingConfirmation.lessonNoShowPolicyTitle"),
                description: t("bookingConfirmation.lessonNoShowPolicyDescription"),
            },
        ],
        bay: [
            {
                title: t("bookingConfirmation.bayCancellationPolicyTitle"),
                description: t("bookingConfirmation.bayCancellationPolicyDescription"),
            },
            {
                title: t("bookingConfirmation.bayNoShowPolicyTitle"),
                description: t("bookingConfirmation.bayNoShowPolicyDescription"),
            },
        ],
    } as const;
}
