import {
    AppText as Text,
    getPressedScaleStyle,
    triggerSelectionHaptic,
} from "@/design-system";
import { registerForPushNotifications } from "@/lib/config/notification/registerPushNotification";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    AppState,
    Linking,
    Pressable,
    Switch,
    View,
} from "react-native";

type PermissionState = {
    granted: boolean;
    canAskAgain: boolean;
};

async function getPermissionState(): Promise<PermissionState> {
    const settings = await Notifications.getPermissionsAsync();

    return {
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
    };
}

export default function ReminderToggle() {
    const { t } = useTranslation();
    const [enabled, setEnabled] = useState(false);
    const [canAskAgain, setCanAskAgain] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const syncPermissionState = async () => {
        const permissionState = await getPermissionState();

        setEnabled(permissionState.granted);
        setCanAskAgain(permissionState.canAskAgain);
        setIsLoading(false);
    };

    useEffect(() => {
        void syncPermissionState();

        const subscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                void syncPermissionState();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleOpenSettings = () => {
        triggerSelectionHaptic();
        void Linking.openSettings();
    };

    const handleToggle = async (value: boolean) => {
        if (isUpdating) {
            return;
        }

        if (!value) {
            handleOpenSettings();
            return;
        }

        setIsUpdating(true);

        try {
            const currentPermission = await getPermissionState();

            if (currentPermission.granted) {
                setEnabled(true);
                setCanAskAgain(currentPermission.canAskAgain);
                return;
            }

            if (currentPermission.canAskAgain) {
                await registerForPushNotifications();
            }

            await syncPermissionState();
        } finally {
            setIsUpdating(false);
        }
    };

    const showSettingsHelper = !enabled && !canAskAgain && !isLoading;

    return (
        <View className="gap-2 px-0 py-3">
            <View className="flex-row items-center justify-between gap-3">
                <Text variant="body" className="min-w-0 flex-1 text-foreground">
                    {t("reminder.notifications")}
                </Text>

                <Switch
                    value={enabled}
                    onValueChange={handleToggle}
                    disabled={isUpdating || isLoading}
                />
            </View>

            {showSettingsHelper ? (
                <View className="gap-2">
                    <Text variant="meta" className="text-danger">
                        {t("reminder.notificationsDenied")}
                    </Text>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("reminder.openSettings")}
                        className="self-start rounded-full bg-muted px-3 py-2"
                        style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.99)}
                        onPress={handleOpenSettings}
                    >
                        <Text variant="label" className="text-foreground">
                            {t("reminder.openSettings")}
                        </Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );
}
