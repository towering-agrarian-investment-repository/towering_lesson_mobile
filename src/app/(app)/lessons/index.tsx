import { MemberGroups } from "@/components/golf/MemberGroups";
import { Screen } from "@/design-system";
import { useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";

export default function LessonsScreen() {
    const queryClient = useQueryClient();
    const { refreshing, onRefresh: handleRefresh } = usePullToRefresh(() =>
        queryClient.refetchQueries({
            queryKey: ["member", "groups"],
            type: "active",
        }, { cancelRefetch: false }),
    );

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
