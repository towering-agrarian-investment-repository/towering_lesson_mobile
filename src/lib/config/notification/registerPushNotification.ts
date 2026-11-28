import {
    confirmPushRegistration,
    getInstallationId,
    getPushRegistrationGeneration,
} from "@/lib/config/notification/pushRegistrationStorage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const registerForPushNotifications = async (
    userId: string,
    signal: AbortSignal,
    devicePushToken?: Notifications.DevicePushToken,
): Promise<string | null> => {
    const generation = getPushRegistrationGeneration();
    if (generation === null || signal.aborted) return null;

    if (!Device.isDevice) {
        if (__DEV__) {
            console.warn("[push] Push notifications require a physical device");
        }
        return null;
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        if (__DEV__) {
            console.warn(`[push] Notification permission is ${finalStatus}`);
        }
        return null;
    }

    if (signal.aborted || getPushRegistrationGeneration() !== generation) {
        return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
        throw new Error("Expo project ID not found");
    }

    const [tokenResponse, installationId] = await Promise.all([
        Notifications.getExpoPushTokenAsync({
            projectId,
            ...(devicePushToken ? { devicePushToken } : {}),
        }),
        getInstallationId(),
    ]);

    const expoPushToken = tokenResponse.data;

    await confirmPushRegistration({ userId, installationId, token: expoPushToken }, generation, signal);

    return expoPushToken;
};
