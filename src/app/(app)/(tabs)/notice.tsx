import { EmptyState } from "@/components/ui/StateCard";
import { Screen } from "@/components/ui/Screen";

function NoticeScreen() {
    return (
        <Screen headerShown={false}>
            <EmptyState
                title="No notifications yet"
                message="Updates and alerts will appear here."
            />
        </Screen>
    )
}

export default NoticeScreen
