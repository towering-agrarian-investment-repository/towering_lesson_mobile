import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/design-system";
import { colorWithOpacity } from "@/design-system/utils/color";
import { useGetUnreadNotificationCount } from "@/lib/hook/shared/useNotification";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
    const { colors, resolvedScheme } = useTheme();
    const { t } = useTranslation();
    const update = useAppUpdateContext();
    const { data: unreadNotificationResponse } = useGetUnreadNotificationCount();
    const unreadNotificationCount = unreadNotificationResponse?.data ?? 0;

    return (
        <NativeTabs
            backBehavior="initialRoute"
            tintColor={colors.primary}
            backgroundColor={colors.background}
            blurEffect={resolvedScheme === "dark" ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
            badgeBackgroundColor={colors.danger}
            badgeTextColor={colors.dangerForeground}
            labelVisibilityMode="labeled"
            indicatorColor={colorWithOpacity(colors.primary, 0.14)}
            rippleColor={colorWithOpacity(colors.primary, 0.12)}
            iconColor={{
                default: colors.mutedForeground,
                selected: colors.primary,
            }}
            labelStyle={{
                default: {
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.mutedForeground,
                },
                selected: {
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.primary,
                },
            }}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "house", selected: "house.fill" }}
                    src={{
                        default: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="home-outline" />,
                        selected: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="home" />,
                    }}
                />
                <NativeTabs.Trigger.Label>{t("navigation.tabs.home")}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="notice">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "bell", selected: "bell.fill" }}
                    src={{
                        default: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="bell-outline" />,
                        selected: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="bell" />,
                    }}
                />
                <NativeTabs.Trigger.Label>{t("navigation.tabs.notifications")}</NativeTabs.Trigger.Label>
                {unreadNotificationCount > 0 ? (
                    <NativeTabs.Trigger.Badge>
                        {unreadNotificationCount > 99 ? "99+" : String(unreadNotificationCount)}
                    </NativeTabs.Trigger.Badge>
                ) : null}
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="activity">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="chart-box-outline" />
                        ),
                        selected: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="chart-box" />,
                    }}
                />
                <NativeTabs.Trigger.Label>{t("activity.title")}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
                <NativeTabs.Trigger.Icon
                    sf={{ default: "person", selected: "person.fill" }}
                    src={{
                        default: (
                            <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="account-outline" />
                        ),
                        selected: <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="account" />,
                    }}
                />
                <NativeTabs.Trigger.Label>{t("navigation.tabs.profile")}</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Badge hidden={!update.isOptionalUpdateAvailable} />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
