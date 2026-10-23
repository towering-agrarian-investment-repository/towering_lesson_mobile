import { getMemberActivity, getMemberActivitySummary } from "@/service/member-activity.service";
import type { MemberActivityResponse, MemberActivitySummary } from "@/types/member-activity";
import { useQuery } from "@tanstack/react-query";

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
        enabled,
    });
}

export function useMemberActivity(
    year: number | "all",
    enabled = true,
    refetchInterval: number | false = false,
) {
    return useQuery<MemberActivityResponse, Error>({
        queryKey: ["member", "activity", year],
        queryFn: async ({ signal }) => {
            const response = await getMemberActivity(year, signal);
            if (!response.data) {
                throw new Error(response.status.message || "Activity data is unavailable.");
            }
            return response.data;
        },
        enabled,
        refetchInterval,
    });
}
