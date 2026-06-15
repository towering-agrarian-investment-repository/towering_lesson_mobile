import type { MemberLessonSlotResponse } from "@/types/member-lesson";

export function getLessonSpotsLeft(slot: MemberLessonSlotResponse) {
    return Math.max(slot.capacity - slot.bookedCount, 0);
}

export function isLessonSlotBookable(slot: MemberLessonSlotResponse) {
    return slot.bookable !== false;
}

export function isLessonSlotFull(slot: MemberLessonSlotResponse) {
    return getLessonSpotsLeft(slot) === 0 || !isLessonSlotBookable(slot);
}

export function isGroupLessonSlot(slot: MemberLessonSlotResponse) {
    return slot.lessonType === "GROUP_LESSON";
}

export function getLessonSlotDisplayName(slot: MemberLessonSlotResponse) {
    return (
        slot.name ??
        (isGroupLessonSlot(slot) ? "Group Lesson" : "Private Lesson")
    );
}
