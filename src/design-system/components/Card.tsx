import { View, type ViewProps } from "react-native";
import { cn } from "../utils/cn";

type CardProps = ViewProps & {
    className?: string;
};

export function Card({ className, ...props }: CardProps) {
    return (
        <View
            className={cn("rounded-2xl border border-border bg-card p-4", className)}
            {...props}
        />
    );
}
