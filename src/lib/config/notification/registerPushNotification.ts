import { savePushToken } from "@/service/shared/push-token-service";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
	if (!Device.isDevice) {
		return null;
	}

	if (process.env.EXPO_OS === "android") {
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
	});

	const expoPushToken = tokenResponse.data;

	await savePushToken({
		deviceId: getDeviceId(),
		expoPushToken,
		deviceType: process.env.EXPO_OS === "ios" ? "IOS" : "ANDROID",
	});

	return expoPushToken;
};

export const getDeviceId = (): string | null => {
	return Device.osInternalBuildId ?? Device.deviceName ?? null;
};

export const addNotificationReceivedListener = (
	callback: (notification: Notifications.Notification) => void,
) => {
	return Notifications.addNotificationReceivedListener(callback);
};

export const addNotificationResponseReceivedListener = (
	callback: (response: Notifications.NotificationResponse) => void,
) => {
	return Notifications.addNotificationResponseReceivedListener(callback);
};

export const removeNotificationSubscription = (
	subscription: Notifications.EventSubscription | null,
) => {
	subscription?.remove();
};
