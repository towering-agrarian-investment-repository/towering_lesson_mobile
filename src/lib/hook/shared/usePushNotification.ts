
import { registerForPushNotifications } from "@/lib/config/notification/registerPushNotification";
import type { NotificationReferenceType } from "@/service/shared/notification-service";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationPayload = {
    referenceType?: NotificationReferenceType | string;
    referenceId?: string | number | null;
};

export const usePushNotification = (isLoggedIn: boolean) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] =
        useState<Notifications.Notification | null>(null);
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

            if (referenceType === "BOOKING_BAY" && referenceId) {
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: referenceId,
                        type: "bay",
                    },
                });
                return;
            }

            if (referenceType === "BOOKING_LESSON" && referenceId) {
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: referenceId,
                        type: "lesson",
                    },
                });
                return;
            }

            if (referenceType === "LESSON_LOG" && referenceId) {
                router.push({
                    pathname: "/lesson-log/[id]",
                    params: {
                        id: referenceId,
                    },
                });
                return;
            }

            if (referenceType === "BOOKING" && referenceId) {
                router.push({
                    pathname: "/reservation/[id]",
                    params: {
                        id: referenceId,
                    },
                });
                return;
            }

            router.push("/(app)/(tabs)/notice");
        },
        [],
    );

    useEffect(() => {
        if (!isLoggedIn) {
            return;
        }

        let isActive = true;

        const registerPushToken = async (
            devicePushToken?: Notifications.DevicePushToken,
        ) => {
            try {
                const token = await registerForPushNotifications(devicePushToken);

                if (!isActive) {
                    return;
                }

                setExpoPushToken(token);
            } catch (error) {
                console.error("[push] Registration failed", error);
            }
        };

        void registerPushToken();

        const pushTokenSubscription = Notifications.addPushTokenListener((devicePushToken) => {
            void registerPushToken(devicePushToken);
        });

        const notificationSubscription = Notifications.addNotificationReceivedListener(
            (receivedNotification) => {
                setNotification(receivedNotification);
            },
        );

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                handleNotificationNavigation(response);
            },
        );

        void Notifications.getLastNotificationResponseAsync()
            .then((response) => {
                handleNotificationNavigation(response);
            })
            .catch((error) => {
                console.error("[push] Failed to read the last notification response", error);
            });

        return () => {
            isActive = false;
            pushTokenSubscription.remove();
            notificationSubscription.remove();
            responseSubscription.remove();
        };
    }, [handleNotificationNavigation, isLoggedIn]);

    return {
        expoPushToken: isLoggedIn ? expoPushToken : null,
        notification,
    };
};
