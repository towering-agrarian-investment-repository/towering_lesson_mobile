import happyGolfToolbarLogo from "@/assets/images/happygolf_toolbar_logo.png";
import { MotiView } from "moti";
import { Image, View } from "react-native";
import { AppText } from "./AppText";
import { useThemeColors } from "../utils/theme";

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
    const dotSize = fullScreen ? 12 : 8;

    return (
        <View
            className={
                fullScreen
                    ? "flex-1 items-center justify-center bg-background px-6"
                    : "items-center justify-center"
            }
        >
            {logoOnly ? (
                <MotiView
                    from={{ opacity: 0.75, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        type: "timing",
                        duration: 560,
                        loop: true,
                        repeatReverse: true,
                    }}
                >
                    <Image
                        source={happyGolfToolbarLogo}
                        className="h-14 w-64"
                        resizeMode="contain"
                    />
                </MotiView>
            ) : (
                <View className="flex-row items-center gap-2">
                    {[0, 1, 2].map((index) => (
                        <MotiView
                            key={index}
                            from={{ opacity: 0.35, scale: 0.9, translateY: 0 }}
                            animate={{ opacity: 1, scale: 1.15, translateY: -2 }}
                            transition={{
                                type: "timing",
                                duration: 360,
                                delay: index * 50,
                                loop: true,
                                repeatReverse: true,
                            }}
                            style={{
                                width: dotSize,
                                height: dotSize,
                                borderRadius: 999,
                                backgroundColor: colors.primary,
                            }}
                        />
                    ))}
                </View>
            )}

            {label && !logoOnly ? (
                <AppText variant="meta" className="mt-3 text-foreground/75">
                    {label}
                </AppText>
            ) : null}
        </View>
    );
}
