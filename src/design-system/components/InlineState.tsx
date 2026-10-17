import { View } from "react-native";
import { typography } from "@/design-system/utils/typography";
import { NativeText } from "./NativeText";

import { cn } from "../utils/cn";

type InlineStateTone = "neutral" | "danger";

type InlineStateProps = {
    title: string;
    message?: string;
    tone?: InlineStateTone;
    className?: string;
};

export function InlineState({
    title,
    message,
    tone = "neutral",
    className,
}: InlineStateProps) {
    return (
        <View className={cn("w-full px-1 py-2", className)}>
            <NativeText
                variant="meta"
                color={tone === "danger" ? "danger" : "mutedForeground"}
                align="center"
                textStyle={{ lineHeight: typography.body.lineHeight }}
            >
                {message ? `${title}. ${message}` : title}
            </NativeText>
        </View>
    );
}
