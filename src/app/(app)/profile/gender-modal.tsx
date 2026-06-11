import { AppText as Text, Screen } from "@/design-system";
import { GenderEnum } from "@/types/member.type";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";

type GenderModalParams = {
    currentGender?: GenderEnum | "";
};

const GENDER_OPTIONS: { label: string; value: GenderEnum }[] = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
    { label: "Other", value: "OTHER" },
];

export default function GenderModalScreen() {
    const { currentGender } = useLocalSearchParams<GenderModalParams>();

    const selectedGender =
        currentGender === "MALE" ||
        currentGender === "FEMALE" ||
        currentGender === "OTHER"
            ? currentGender
            : "";

    const handleSelect = (value: GenderEnum | "") => {
        router.dismissTo({
            pathname: "/profile/edit",
            params: {
                selectedGender: value,
            },
        });
    };

    return (
        <Screen>
            <View className="gap-3">
                <Text selectable className="text-sm leading-6 text-muted-foreground">
                    Choose the gender value for this member profile.
                </Text>

                <Pressable
                    onPress={() => handleSelect("")}
                    className={`rounded-xl border px-4 py-4 ${
                        selectedGender === ""
                            ? "border-success bg-success/10"
                            : "border-border bg-card"
                    }`}
                >
                    <Text
                        className={`text-base ${
                            selectedGender === ""
                                ? "font-semibold text-success"
                                : "text-foreground"
                        }`}
                    >
                        Clear selection
                    </Text>
                </Pressable>

                {GENDER_OPTIONS.map((option) => {
                    const isSelected = option.value === selectedGender;

                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => handleSelect(option.value)}
                            className={`flex-row items-center rounded-xl border px-4 py-4 ${
                                isSelected
                                    ? "border-success bg-success/10"
                                    : "border-border bg-card"
                            }`}
                        >
                            <Text
                                className={`flex-1 text-base ${
                                    isSelected
                                        ? "font-semibold text-success"
                                        : "text-foreground"
                                }`}
                            >
                                {option.label}
                            </Text>

                            {isSelected ? (
                                <Text className="text-lg font-bold text-success">✓</Text>
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
        </Screen>
    );
}
