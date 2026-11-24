import { ProfileHeaderActions } from "@/components/golf/profile/ProfileHeaderActions";
import { getTabStackHeaderOptions, useTheme } from "@/design-system";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabStackLayout() {
    const { colors, resolvedScheme } = useTheme();
    const { t } = useTranslation();
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                ...getTabStackHeaderOptions(colors, resolvedScheme),
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: t("navigation.tabs.profile"),
                    headerRight: () => <ProfileHeaderActions />,
                }}
            />
        </Stack>
    );
}
