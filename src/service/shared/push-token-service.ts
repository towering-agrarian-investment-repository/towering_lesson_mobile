import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";

export type PushTokenPlatform = "EXPO";

export interface SavePushTokenRequest {
    deviceId: string;
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

export const deactivatePushInstallation = async (
    deviceId: string,
): Promise<ApiResponse<void>> => {
    return apiClient(`/push-tokens/installations/${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
    });
};
