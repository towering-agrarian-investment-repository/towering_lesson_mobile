import { View, type ViewProps } from "react-native";
import { cn } from "../utils/cn";

type StackProps = ViewProps & {
    className?: string;
};

export function Stack({ className, ...props }: StackProps) {
    return <View className={cn("flex-col", className)} {...props} />;
}
