import { cancelMealReminders, requestPermission, scheduleMealReminders } from "@/utils/notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { AppText as Text, useThemeColors } from "@/design-system";
import { Switch, View } from "react-native";

const REMINDERS_KEY = "remindersEnabled";

export default function ReminderToggle() {
    const [enabled, setEnabled] = useState(false);
    const colors = useThemeColors();

    useEffect(() => {
        const load = async () => {
            const value = await AsyncStorage.getItem(REMINDERS_KEY);
            setEnabled(value === "true");
        };

        void load();
    }, []);

    const toggle = async (value: boolean) => {
        if (value) {
            const granted = await requestPermission();
            if (!granted) {
                return;
            }

            await scheduleMealReminders();
        } else {
            await cancelMealReminders();
        }

        setEnabled(value);
        await AsyncStorage.setItem(REMINDERS_KEY, value.toString());
    };

    return (
        <View className="mt-7 flex-row items-center justify-between">
            <Text variant="body">Meal Reminders</Text>
            <Switch
                value={enabled}
                onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.primary }}
            />
        </View>
    );
}
