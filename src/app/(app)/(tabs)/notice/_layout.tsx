import { useThemeColors } from "@/design-system";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabStackLayout() {
    const colors = useThemeColors();
    const { t } = useTranslation();
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.foreground,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen
                name="index"
                options={{ title: t("navigation.tabs.notifications") }}
            />
        </Stack>
    );
}
