
import { addNotificationReceivedListener, addNotificationResponseReceivedListener, registerForPushNotifications, removeNotificationSubscription } from "@/lib/config/notification/registerPushNotification";
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

    const notificationListener =
        useRef<Notifications.EventSubscription | null>(null);

    const responseListener =
        useRef<Notifications.EventSubscription | null>(null);
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

        registerForPushNotifications()
            .then((token) => {
                setExpoPushToken(token);
            })
            .catch((error) => {
                console.log("Failed to register push notification:", error);
            });

        notificationListener.current = addNotificationReceivedListener(
            (receivedNotification) => {
                setNotification(receivedNotification);
            },
        );

        responseListener.current = addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;

                console.log("Notification tapped:", data);
                handleNotificationNavigation(response);
            },
        );

        void Notifications.getLastNotificationResponseAsync().then((response) => {
            handleNotificationNavigation(response);
        });

        return () => {
            removeNotificationSubscription(notificationListener.current);
            removeNotificationSubscription(responseListener.current);
        };
    }, [handleNotificationNavigation, isLoggedIn]);

    return {
        expoPushToken,
        notification,
    };
};
