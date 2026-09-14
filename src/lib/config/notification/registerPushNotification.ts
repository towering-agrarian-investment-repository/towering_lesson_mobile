import { getInstallationId } from "@/lib/config/notification/pushRegistrationStorage";
import { savePushToken } from "@/service/shared/push-token-service";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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
	devicePushToken?: Notifications.DevicePushToken,
): Promise<string | null> => {
	if (!Device.isDevice) {
		console.warn("[push] Push notifications require a physical device");
		return null;
	}

	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("default", {
			name: "default",
			importance: Notifications.AndroidImportance.MAX,
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
		console.warn(`[push] Notification permission is ${finalStatus}`);
		return null;
	}

	const projectId =
		Constants.expoConfig?.extra?.eas?.projectId ??
		Constants.easConfig?.projectId;

	if (!projectId) {
		throw new Error("Expo project ID not found");
	}

	const tokenResponse = await Notifications.getExpoPushTokenAsync({
		projectId,
		...(devicePushToken ? { devicePushToken } : {}),
	});

	const expoPushToken = tokenResponse.data;
	const installationId = await getInstallationId();

	await savePushToken({
		deviceId: installationId,
		pushToken: expoPushToken,
		platform: "EXPO",
	});

	if (__DEV__) {
		console.info("[push] Expo push token registered with the backend");
	}

	return expoPushToken;
};
