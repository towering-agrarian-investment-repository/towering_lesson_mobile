import { getMemberActivity } from "@/service/member-activity.service";
import type { MemberActivityResponse } from "@/types/member-activity";
import { useQuery } from "@tanstack/react-query";

export function useMemberActivity(year: number | "all", enabled = true) {
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
        staleTime: 5 * 60_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
}
