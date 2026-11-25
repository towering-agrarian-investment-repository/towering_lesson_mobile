import type { TicketPauseResponse } from "@/types/member-ticket";
import type { TFunction } from "i18next";
import { formatDateForAPI, formatDateForDisplay } from "./time-helper";

export type TicketPausePeriod = {
    id: number;
    startDate: string;
    endDate: string;
};

export function getTicketPausePeriods(pauses?: readonly TicketPauseResponse[] | null): TicketPausePeriod[] {
    const periods: TicketPausePeriod[] = [];

    for (const pause of pauses ?? []) {
        if (pause.cancelledAt) continue;

        const startDate = formatDateForAPI(pause.pausedStartDate);
        const endDate = formatDateForAPI(pause.pausedEndDate);
        if (startDate && endDate && startDate <= endDate) {
            periods.push({ id: pause.id, startDate, endDate });
        }
    }

    return periods.sort((first, second) => first.startDate.localeCompare(second.startDate));
}

export function isTicketDatePaused(periods: readonly TicketPausePeriod[], date: string): boolean {
    return periods.some(({ startDate, endDate }) => date >= startDate && date <= endDate);
}

export function formatTicketPausePeriod({ startDate, endDate }: TicketPausePeriod, t: TFunction): string {
    return t("tickets.pausePeriod", {
        startDate: formatDateForDisplay(startDate),
        endDate: formatDateForDisplay(endDate),
    });
}
