import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

const PRIMARY = "#38bdf8";

export default function DateScreen() {
    const router = useRouter();

    const handleDayPress = (day: DateData) => {
        router.push({
            pathname: "../select-bay",
            params: { date: day.dateString },
        });
    };

    return (
        <View style={s.container}>
            <Calendar
                style={s.calendar}
                onDayPress={handleDayPress}
                minDate={new Date().toISOString().split("T")[0]}
                renderArrow={(dir) => (
                    <Ionicons
                        name={dir === "left" ? "chevron-back" : "chevron-forward"}
                        size={20}
                        color={PRIMARY}
                    />
                )}
                theme={{
                    calendarBackground: "#fff",
                    selectedDayBackgroundColor: PRIMARY,
                    selectedDayTextColor: "#fff",
                    todayTextColor: PRIMARY,
                    textDisabledColor: "#cbd5e1",
                    // @ts-ignore
                    "stylesheet.calendar.main": {
                        week: {
                            marginTop: 18,
                            marginBottom: 18,
                            flexDirection: "row",
                            justifyContent: "space-around",
                        },
                    },
                }}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    calendar: { height: 520, backgroundColor: "#fff" },
});