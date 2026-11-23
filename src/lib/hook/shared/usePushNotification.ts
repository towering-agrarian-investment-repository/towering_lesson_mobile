
import { registerForPushNotifications } from "@/lib/config/notification/registerPushNotification";
import type { NotificationReferenceType } from "@/service/shared/notification-service";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

type NotificationPayload = {
    referenceType?: NotificationReferenceType | string;
    referenceId?: string | number | null;
};

const NUMERIC_REFERENCE_ID_PATTERN = /^\d+$/;

export const usePushNotification = (isLoggedIn: boolean) => {
    const router = useRouter();
    const lastHandledNotificationId = useRef<string | null>(null);

    const handleNotificationNavigation = useCallback(
        (response: Notifications.NotificationResponse | null) => {
            if (!response) {
                return;
            }

            const notificationId = response.notification.request.identifier;

            if (lastHandledNotificationId.current === notificationId) {
                return;
            }

            lastHandledNotificationId.current = notificationId;

            const data = response.notification.request.content.data as NotificationPayload;
            const referenceType = typeof data.referenceType === "string"
                ? data.referenceType.toUpperCase() as NotificationReferenceType
                : null;
            const referenceId = data.referenceId != null ? String(data.referenceId) : null;
            const hasValidReferenceId = referenceId !== null && NUMERIC_REFERENCE_ID_PATTERN.test(referenceId);

            if (referenceType === "BOOKING_BAY") {
                if (!hasValidReferenceId) {
                    return;
                }
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: referenceId,
                        type: "bay",
                    },
                });
                return;
            }

            if (referenceType === "BOOKING_LESSON") {
                if (!hasValidReferenceId) {
                    return;
                }
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: referenceId,
                        type: "lesson",
                    },
                });
                return;
            }

            if (referenceType === "LESSON_LOG") {
                if (!hasValidReferenceId) {
                    return;
                }
                router.push({
                    pathname: "/lesson-log/[id]",
                    params: {
                        id: referenceId,
                    },
                });
                return;
            }

            if (referenceType === "BOOKING") {
                router.navigate("/reservation");
                return;
            }

            router.navigate("/(app)/(tabs)/notice");
        },
        [router],
    );

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        const registerPushToken = async (
            devicePushToken?: Notifications.DevicePushToken,
        ) => {
            try {
                await registerForPushNotifications(devicePushToken);
            } catch (error) {
                if (__DEV__) {
                    console.error("[push] Registration failed", error);
                }
            }
        };

        void registerPushToken();

        const pushTokenSubscription = Notifications.addPushTokenListener((devicePushToken) => {
            void registerPushToken(devicePushToken);
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                handleNotificationNavigation(response);
            },
        );

        handleNotificationNavigation(Notifications.getLastNotificationResponse());

        return () => {
            pushTokenSubscription.remove();
            responseSubscription.remove();
        };
    }, [handleNotificationNavigation, isLoggedIn]);
};
