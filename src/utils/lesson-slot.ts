import type { MemberLessonSlotResponse } from "@/types/member-lesson";
import type { TFunction } from "i18next";

export function getLessonSpotsLeft(slot: MemberLessonSlotResponse) {
    return Math.max(slot.capacity - slot.bookedCount, 0);
}

export function isLessonSlotBookable(slot: MemberLessonSlotResponse) {
    return slot.bookable !== false;
}

export function isLessonSlotFull(slot: MemberLessonSlotResponse) {
    return getLessonSpotsLeft(slot) === 0 || !isLessonSlotBookable(slot);
}

export function isLessonSlotBookedByCurrentMember(slot: MemberLessonSlotResponse) {
    return slot.bookedByCurrentMember === true;
}

export function isGroupLessonSlot(slot: MemberLessonSlotResponse) {
    return slot.lessonType === "GROUP_LESSON";
}

export function getLessonSlotDisplayName(slot: MemberLessonSlotResponse, t: TFunction) {
    return (
        slot.name ??
        t(
            isGroupLessonSlot(slot)
                ? "bookingConfirmation.groupLessonFallback"
                : "bookingConfirmation.privateLessonFallback",
        )
    );
}
