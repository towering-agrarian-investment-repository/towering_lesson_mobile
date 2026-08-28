import type { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";
import type { MemberActivityResponse } from "@/types/member-activity";

export async function getMemberActivity(year: number | "all", signal?: AbortSignal) {
    const query = year === "all"
        ? "range=all"
        : `year=${encodeURIComponent(String(year))}`;

    return apiClient<ApiResponse<MemberActivityResponse>>(
        `/member/activity?${query}`,
        { method: "GET", signal },
    );
}
