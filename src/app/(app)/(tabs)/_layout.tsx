import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemeColors } from "@/design-system";
import { useAppUpdateContext } from "@/lib/update/update-context";
import { NativeTabs } from "expo-router/native-tabs";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
    const colors = useThemeColors();
    const { t } = useTranslation();
    const update = useAppUpdateContext();
    return (
        <NativeTabs
            backBehavior="initialRoute"
            tintColor={colors.primary}
            backgroundColor={colors.background}
            badgeBackgroundColor={colors.danger}
            labelVisibilityMode="labeled"
            disableIndicator
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
