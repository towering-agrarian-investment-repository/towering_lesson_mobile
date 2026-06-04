import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/design-system/utils/theme';
import { Tabs } from 'expo-router';

type Props = {}

function TabLayout({ }: Props) {
    const colors = useThemeColors();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerStyle: {
                    backgroundColor: colors.card,
                },
                headerTintColor: colors.foreground,
                headerTitleStyle: {
                    color: colors.foreground,
                },
                headerShadowVisible: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.secondaryForeground,
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
