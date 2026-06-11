import { cancelMealReminders, requestPermission, scheduleMealReminders } from "@/utils/notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { AppText as Text, useThemeColors } from "@/design-system";
import { StyleSheet, Switch, View } from 'react-native';

const REMINDERS_KEY = 'remindersEnabled';
export default function ReminderToggle() {
    const [enabled, setEnabled] = useState(false);
    const colors = useThemeColors();

    useEffect(() => {
        const load = async () => {
            const val = await AsyncStorage.getItem(REMINDERS_KEY);
            setEnabled(val === 'true')
        };
        load();
    }, [])

    const toggle = async (value: boolean) => {
        if (value) {
            const granted = await requestPermission();
            if (!granted) return;
            await scheduleMealReminders();
        } else {
            await cancelMealReminders();
        }
        setEnabled(value);
        await AsyncStorage.setItem(REMINDERS_KEY, value.toString())
    }

    return (
        <View style={styles.container}>
            <Text variant="body" style={[styles.label, { color: colors.foreground }]}>Meal Reminders</Text>
            <Switch
                value={enabled}
                onValueChange={toggle}
                trackColor={{ false: colors.border, true: colors.primary }}
            />
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
    },
    label: {
        fontSize: 16,
    },
});
