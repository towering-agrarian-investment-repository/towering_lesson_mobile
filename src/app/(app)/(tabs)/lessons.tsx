import { MemberGroups } from "@/components/golf/MemberGroups";
import { Screen } from "@/design-system";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function LessonsScreen() {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await queryClient.refetchQueries({
                queryKey: ["member", "groups"],
                type: "active",
            });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <Screen
            scroll={false}
            contentClassName="flex-1"
        >
            <MemberGroups
                refreshing={refreshing}
                onRefresh={() => {
                    void handleRefresh();
                }}
            />
        </Screen>
    );
}
