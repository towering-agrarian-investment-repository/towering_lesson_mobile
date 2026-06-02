import { Image, ActivityIndicator, Text, View } from "react-native";

type CircleLoaderProps = {
    label?: string;
    fullScreen?: boolean;
    logoOnly?: boolean;
};

export function CircleLoader({
    label,
    fullScreen = false,
    logoOnly = false,
}: CircleLoaderProps) {
    return (
        <View
            className={
                fullScreen
                    ? "flex-1 items-center justify-center bg-white px-6"
                    : "items-center justify-center"
            }
        >
            {logoOnly ? (
                <Image
                    source={require("../../../assets/golf/drawable-xxxhdpi/happygolf_toolbar_logo.png")}
                    className="h-14 w-64"
                    resizeMode="contain"
                />
            ) : (
                <ActivityIndicator
                    size={fullScreen ? "large" : "small"}
                    color="#16a34a"
                />
            )}

            {label && !logoOnly ? (
                <Text className="mt-3 text-base text-gray-500">{label}</Text>
            ) : null}
        </View>
    );
}
