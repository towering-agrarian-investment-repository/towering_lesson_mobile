import { apiClient } from "@/lib/client/api-client";
import type { ApiResponse } from "@/lib/api-response/api-response";
import type { PublishedBanner } from "@/types/banner";

export function getPublishedBanners(signal?: AbortSignal) {
    return apiClient<ApiResponse<PublishedBanner[]>>("/banner/published", {
        method: "GET",
        signal,
    });
}
