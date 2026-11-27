import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";

type PushTokenPlatform = "EXPO";

interface SavePushTokenRequest {
    deviceId: string;
    pushToken: string;
    platform: PushTokenPlatform;
}

export const savePushToken = async (data: SavePushTokenRequest, signal: AbortSignal): Promise<ApiResponse<null>> => {
    return apiClient("/push-tokens", {
        method: "POST",
        body: JSON.stringify(data),
        signal,
    });
};

export const deactivatePushInstallation = async (deviceId: string, signal: AbortSignal): Promise<ApiResponse<null>> => {
    return apiClient(`/push-tokens/installations/${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
        signal,
    });
};
