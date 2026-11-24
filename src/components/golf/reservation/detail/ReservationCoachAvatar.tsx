import { AppText } from "@/design-system/components/AppText";
import { typography } from "@/design-system/utils/typography";
import { Image } from "expo-image";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

type ReservationCoachAvatarProps = {
    name: string;
    imageUrl?: string | null;
};

export function ReservationCoachAvatar({ name, imageUrl }: ReservationCoachAvatarProps) {
    const reducedMotion = useReducedMotion();

    if (imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                cachePolicy="memory-disk"
                recyclingKey={imageUrl}
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                }}
                contentFit="cover"
                transition={reducedMotion ? 0 : 150}
            />
        );
    }

    return (
        <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
            <AppText
                variant="body"
                color="foreground"
                wrap={false}
                textStyle={{
                    lineHeight: typography.caption.lineHeight,
                    fontSize: typography.caption.fontSize,
                    fontWeight: "700" as const,
                }}
            >
                {name?.charAt(0).toUpperCase() || "?"}
            </AppText>
        </View>
    );
}
