import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeColors } from "@/design-system";
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {}

function TabLayout({ }: Props) {
    const colors = useThemeColors();
    const { resolvedScheme } = useTheme();
    const insets = useSafeAreaInsets();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerTintColor: colors.foreground,
                headerTitleStyle: {
                    color: colors.foreground,
                },
                headerTitleAlign: "left",
                headerLeftContainerStyle: {
                    paddingLeft: 8,
                },
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerShadowVisible: false,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    borderTopWidth: resolvedScheme === "dark" ? 1 : 0,
                    height: 64 + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 10),
                    paddingTop: 6,
                },
                tabBarItemStyle: {
                    marginHorizontal: 6,
                    marginVertical: 4,
                    borderRadius: 12,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.mutedForeground,
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='home' size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='notice'
                options={{
                    title: "Notifications",
                    headerShown: true,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='notifications-outline' size={size} color={color} />
                    )
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: 'Profile',
                    headerShown: true,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='person' size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    )
}

export default TabLayout
