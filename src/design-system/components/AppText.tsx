import { Text, type TextProps } from "react-native";
import { cn } from "../utils/cn";

type AppTextVariant =
    | "h1"
    | "h2"
    | "h3"
    | "body"
    | "value"
    | "subtext"
    | "muted"
    | "caption"
    | "meta"
    | "eyebrow"
    | "label";

type AppTextProps = TextProps & {
    variant?: AppTextVariant;
    className?: string;
};

export function AppText({
    variant = "body",
    className,
    ...props
}: AppTextProps) {
    return (
        <Text
            className={cn(
                "text-foreground",
                variant === "h1" && "text-3xl font-bold",
                variant === "h2" && "text-2xl font-bold",
                variant === "h3" && "text-xl font-semibold",
                variant === "body" && "text-base",
                variant === "value" && "text-lg font-semibold",
                variant === "subtext" && "text-base text-muted-foreground",
                variant === "muted" && "text-base text-muted-foreground",
                variant === "caption" && "text-xs text-muted-foreground",
                variant === "meta" && "text-sm text-muted-foreground",
                variant === "eyebrow" &&
                    "text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground",
                variant === "label" && "text-sm font-medium",
                className,
            )}
            {...props}
        />
    );
}
