import { getMemberActivity, getMemberActivitySummary } from "@/service/member-activity.service";
import type { MemberActivityResponse, MemberActivitySummary } from "@/types/member-activity";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useMemberActivitySummary(enabled = true) {
    return useQuery<MemberActivitySummary, Error>({
        queryKey: ["member", "activity", "summary"],
        queryFn: async ({ signal }) => {
            const response = await getMemberActivitySummary(signal);
            if (!response.data) {
                throw new Error(response.status.message || "Activity years are unavailable.");
            }
            return response.data;
        },
        staleTime: 5 * 60_000,
        enabled,
    });
}

export function useMemberActivity(year: number | "all", enabled = true) {
    const currentYear = new Date().getFullYear();
    const isPastYear = typeof year === "number" && year < currentYear;

    return useQuery<MemberActivityResponse, Error>({
        queryKey: ["member", "activity", year],
        queryFn: async ({ signal }) => {
            const response = await getMemberActivity(year, signal);
            if (!response.data) {
                throw new Error(response.status.message || "Activity data is unavailable.");
            }
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: isPastYear ? 5 * 60_000 : 30_000,
        enabled,
    });
}
