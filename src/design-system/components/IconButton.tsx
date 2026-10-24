import { type PressableProps } from "react-native";
import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { AnimatedPressable } from "./AnimatedPressable";

type IconButtonVariant = "primary" | "secondary" | "ghost";
type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = PressableProps & {
    children: ReactNode;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    className?: string;
    accessibilityLabel: string;
};

export function IconButton({
    children,
    variant = "ghost",
    size = "md",
    className,
    accessibilityLabel,
    disabled,
    ...props
}: IconButtonProps) {
    const isDisabled = Boolean(disabled);

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: isDisabled }}
            disabled={isDisabled}
            className={cn(
                "items-center justify-center rounded-full",
                isDisabled && "opacity-50",
                size === "sm" && "h-9 w-9",
                size === "md" && "h-11 w-11",
                size === "lg" && "h-14 w-14",
                variant === "primary" && "bg-primary",
                variant === "secondary" && "border border-border bg-surface",
                variant === "ghost" && "bg-transparent",
                className,
            )}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
}
