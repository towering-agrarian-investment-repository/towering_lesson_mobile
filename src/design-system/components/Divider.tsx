import { View } from "react-native";
import { cn } from "../utils/cn";

type DividerProps = {
    className?: string;
};

export function Divider({ className }: DividerProps) {
    return <View className={cn("h-px w-full bg-border", className)} />;
}
