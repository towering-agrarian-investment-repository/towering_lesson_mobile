import { View, type ViewProps } from "react-native";
import { cn } from "../utils/cn";

type ContainerProps = ViewProps & {
    className?: string;
};

export function Container({ className, ...props }: ContainerProps) {
    return <View className={cn("w-full px-4", className)} {...props} />;
}
