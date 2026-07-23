import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";

export type PushTokenPlatform = "EXPO";

export interface SavePushTokenRequest {
    deviceId?: string | null;
    pushToken: string;
    platform: PushTokenPlatform;
}

export const savePushToken = async (
    data: SavePushTokenRequest,
): Promise<ApiResponse<void>> => {
    return apiClient("/push-tokens", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const deactivatePushToken = async (
    pushToken: string,
): Promise<ApiResponse<void>> => {
    const params = new URLSearchParams();
    params.set("pushToken", pushToken);

    return apiClient(`/push-tokens?${params.toString()}`, {
        method: "DELETE",
    });
};
