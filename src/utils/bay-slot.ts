import type { BaySlotScheduleResponse } from "@/types/member-bay";

export function getBaySlotAvailability(slot?: BaySlotScheduleResponse | null) {
    const slotStatus = String(slot?.slotStatus ?? "").toUpperCase();
    const isBlocked = slotStatus === "BLOCKED";
    const isReserved = (slot?.reservations?.length ?? 0) > 0;
    const isUnavailable = !slot || (!isBlocked && !isReserved && slotStatus !== "AVAILABLE");
    const isDisabled = isBlocked || isReserved || isUnavailable;

    return {
        slotStatus,
        isBlocked,
        isReserved,
        isUnavailable,
        isDisabled,
    };
}
