import { Ionicons } from '@expo/vector-icons';
import { getPressedScaleStyle, triggerSelectionHaptic, useTheme, useThemeColors } from "@/design-system";
import { Tabs, useRouter } from 'expo-router';
import { useAppUpdateContext } from "@/lib/update/update-context";
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabLayout() {
    const colors = useThemeColors();
    const { resolvedScheme } = useTheme();
    const { t } = useTranslation();
    const update = useAppUpdateContext();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                headerTintColor: colors.foreground,
                headerTitleStyle: {
                    color: colors.foreground,
                    fontWeight: "700",
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
                    height: 68 + insets.bottom,
                    paddingBottom: Math.max(insets.bottom, 10),
                    paddingTop: 8,
                },
                tabBarItemStyle: {
                    marginHorizontal: 4,
                    marginVertical: 4,
                    borderRadius: 14,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "700",
                },
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.mutedForeground,
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: t("navigation.tabs.home"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'home' : 'home-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name='notice'
                options={{
                    title: t("navigation.tabs.notifications"),
                    headerShown: true,
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'notifications' : 'notifications-outline'}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='activity'
                options={{
                    title: "Your Activity",
                    headerShown: true,
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? 'stats-chart' : 'stats-chart-outline'}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='lessons'
                options={{
                    href: null,
                    title: t("navigation.tabs.lessons"),
                    headerShown: true,
                    headerLeft: () => (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("common.goBack")}
                            className="mr-1 h-11 w-11 items-center justify-center rounded-full"
                            hitSlop={8}
                            style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.94)}
                            onPress={() => {
                                triggerSelectionHaptic();
                                if (router.canGoBack()) {
                                    router.back();
                                    return;
                                }

                                router.replace("/(app)/(tabs)/profile");
                            }}
                        >
                            <ChevronLeft
                                size={20}
                                color={colors.foreground}
                                strokeWidth={2.4}
                            />
                        </Pressable>
                    ),
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: t("navigation.tabs.profile"),
                    headerShown: true,
                    tabBarIcon: ({ color, size, focused }) => (
                        <View className="relative">
                            <Ionicons
                                name={focused ? 'person' : 'person-outline'}
                                size={size}
                                color={color}
                            />
                            {update.isOptionalUpdateAvailable ? (
                                <View className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-danger" />
                            ) : null}
                        </View>
                    ),
                }}
            />
        </Tabs>
    )
}

export default TabLayout
