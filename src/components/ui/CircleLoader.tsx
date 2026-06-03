import { AppText } from "@/design-system";
import { useThemeColors } from "@/design-system/utils/theme";
import { Image, ActivityIndicator, View } from "react-native";

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
    const colors = useThemeColors();

    return (
        <View
            className={
                fullScreen
                    ? "flex-1 items-center justify-center bg-background px-6"
                    : "items-center justify-center"
            }
        >
            {logoOnly ? (
                <Image
                    source={require("../../../assets/images/happygolf_toolbar_logo.png")}
                    className="h-14 w-64"
                    resizeMode="contain"
                />
            ) : (
                <ActivityIndicator
                    size={fullScreen ? "large" : "small"}
                    color={colors.primary}
                />
            )}

            {label && !logoOnly ? (
                <AppText variant="subtext" className="mt-3 text-foreground/75">
                    {label}
                </AppText>
            ) : null}
        </View>
    );
}
