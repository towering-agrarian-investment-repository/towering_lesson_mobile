import { ActivityIndicator, Text, View } from "react-native";

type CircleLoaderProps = {
    label?: string;
    fullScreen?: boolean;
};

export function CircleLoader({
    label,
    fullScreen = false,
}: CircleLoaderProps) {
    return (
        <View
            className={
                fullScreen
                    ? "flex-1 items-center justify-center bg-white px-6"
                    : "items-center justify-center"
            }
        >
            <ActivityIndicator
                size={fullScreen ? "large" : "small"}
                color="#16a34a"
            />

            {label ? (
                <Text className="mt-3 text-base text-gray-500">{label}</Text>
            ) : null}
        </View>
    );
}
