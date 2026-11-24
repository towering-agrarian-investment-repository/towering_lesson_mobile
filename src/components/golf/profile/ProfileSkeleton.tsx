import { Skeleton } from "@/design-system";
import { View } from "react-native";

export function ProfileSkeleton() {
    return (
        <>
            <View className="flex-row items-center gap-5">
                <Skeleton className="h-24 w-24 rounded-full" />
                <View className="min-w-0 flex-1 gap-2.5">
                    <Skeleton className="h-6 w-40 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                </View>
            </View>
            <View className="gap-3">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))}
            </View>
        </>
    );
}
