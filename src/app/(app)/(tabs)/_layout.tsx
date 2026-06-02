import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

type Props = {}

function TabLayout({ }: Props) {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    borderTopColor: "#c7c7d4"
                },
                tabBarActiveTintColor: "#32bbfa",
                tabBarInactiveTintColor: "#363641",
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
