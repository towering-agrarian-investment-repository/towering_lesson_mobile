import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemeColors } from "@/design-system";
import { useGetUnreadNotificationCount } from "@/lib/hook/shared/useNotification";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const update = useAppUpdateContext();
    const { data: unreadNotificationResponse } = useGetUnreadNotificationCount();
    const unreadNotificationCount = unreadNotificationResponse?.data ?? 0;
    return (
        <NativeTabs
            backBehavior="initialRoute"
            tintColor={colors.primary}
            backgroundColor={colors.background}
            badgeBackgroundColor={colors.notification}
            badgeTextColor={colors.primaryForeground}
            labelVisibilityMode="labeled"
            disableIndicator
            rippleColor="transparent"
            iconColor={{ default: colors.mutedForeground, selected: colors.primary }}
            labelStyle={{
                default: { fontSize: 11, fontWeight: "700", color: colors.mutedForeground },
                selected: { fontSize: 11, fontWeight: "700", color: colors.primary },
            }}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "house", selected: "house.fill" }}
                    src={{
                        default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="home-outline" />,
                        selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="home" />,
                    }}
                />
                <NativeTabs.Trigger.Label>
                    {t("navigation.tabs.home")}
                </NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="notice">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "bell", selected: "bell.fill" }}
                    src={{
                        default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="notifications-outline" />,
                        selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="notifications" />,
                    }}
                />
                <NativeTabs.Trigger.Label>
                    {t("navigation.tabs.notifications")}
                </NativeTabs.Trigger.Label>
                {unreadNotificationCount > 0 ? (
                    <NativeTabs.Trigger.Badge>
                        {String(unreadNotificationCount)}
                    </NativeTabs.Trigger.Badge>
                ) : null}
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="activity">
                <NativeTabs.Trigger.Icon sf="chart.bar" src={{
                    default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="stats-chart-outline" />,
                    selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="stats-chart" />,
                }} />
                <NativeTabs.Trigger.Label>
                    {t("activity.title")}
                </NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "person", selected: "person.fill" }}
                    src={{
                        default: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="person-outline" />,
                        selected: <NativeTabs.Trigger.VectorIcon family={Ionicons} name="person" />,
                    }}
                />
                <NativeTabs.Trigger.Label>
                    {t("navigation.tabs.profile")}
                </NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Badge
                    hidden={!update.isOptionalUpdateAvailable}
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
