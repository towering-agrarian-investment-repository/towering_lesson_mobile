import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

type TextareaProps = TextInputProps & {
    label?: string;
    error?: string;
    className?: string;
    containerClassName?: string;
};

export function Textarea({
    label,
    error,
    className,
    containerClassName,
    ...props
}: TextareaProps) {
    const colors = useThemeColors();

    return (
        <View className={cn("gap-3", containerClassName)}>
            {label ? <AppText variant="label">{label}</AppText> : null}

            <TextInput
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
                className={cn(
                    "min-h-32 rounded-xl border border-border bg-surface pl-2 pr-2 py-3 text-base leading-6 text-foreground",
                    "focus:border-primary",
                    error && "border-danger",
                    className,
                )}
                {...props}
            />

            {error ? (
                <AppText variant="meta" className="text-danger">
                    {error}
                </AppText>
            ) : null}
        </View>
    );
}
