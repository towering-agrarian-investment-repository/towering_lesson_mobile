import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

type InputProps = TextInputProps & {
    label?: string;
    error?: string;
    className?: string;
    containerClassName?: string;
};

export function Input({
    label,
    error,
    className,
    containerClassName,
    ...props
}: InputProps) {
    const colors = useThemeColors();

    return (
        <View className={cn("gap-3", containerClassName)}>
            {label ? <AppText variant="label" className="text-foreground/75">{label}</AppText> : null}

            <TextInput
                placeholderTextColor={colors.mutedForeground}
                className={cn(
                    "h-12 rounded-xl border border-border bg-surface px-5 text-base text-foreground",
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
