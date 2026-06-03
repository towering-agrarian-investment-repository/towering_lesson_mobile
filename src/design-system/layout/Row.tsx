import { View, type ViewProps } from "react-native";
import { cn } from "../utils/cn";

type RowProps = ViewProps & {
    className?: string;
};

export function Row({ className, ...props }: RowProps) {
    return <View className={cn("flex-row items-center", className)} {...props} />;
}
