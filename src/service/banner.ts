import { apiClient } from "@/lib/client/api-client";
import type { ApiResponse } from "@/lib/api-response/api-response";
import type { PublishedBannerResponse } from "@/types/banner";

export function getPublishedBanners(signal?: AbortSignal) {
    return apiClient<ApiResponse<PublishedBannerResponse[]>>("/banner/published", {
        method: "GET",
        signal,
    });
}
