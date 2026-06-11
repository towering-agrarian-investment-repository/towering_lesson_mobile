import { ApiResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";

export type DeviceType = "IOS" | "ANDROID";

export interface SavePushTokenRequest {
    deviceId?: string | null;
    expoPushToken: string;
    deviceType: DeviceType;
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
    expoPushToken: string,
): Promise<ApiResponse<void>> => {
    const params = new URLSearchParams();
    params.set("expoPushToken", expoPushToken);

    return apiClient(`/push-tokens?${params.toString()}`, {
        method: "DELETE",
    });
};
