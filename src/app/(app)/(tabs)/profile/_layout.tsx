import { ProfileHeaderActions } from "@/components/golf/profile/ProfileHeaderActions";
import { getStackHeaderOptions, useThemeColors } from "@/design-system";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabStackLayout() {
    const colors = useThemeColors();
    const { t } = useTranslation();
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                ...getStackHeaderOptions(colors),
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
