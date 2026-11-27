import { getPublishedBanners } from "@/service/banner";
import type { PublishedBannerResponse } from "@/types/banner";
import { useQuery } from "@tanstack/react-query";

export function usePublishedBanners() {
    return useQuery<PublishedBannerResponse[], Error>({
        queryKey: ["banners", "published"],
        queryFn: async ({ signal }) => {
            const response = await getPublishedBanners(signal);
            return response.data;
        },
        staleTime: 5 * 60_000,
    });
}
