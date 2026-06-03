import { EmptyState } from "@/components/ui/StateCard";
import { Screen } from "@/components/ui/Screen";

export default function LessonLogScreen() {
    return (
        <Screen headerShown={false}>
            <EmptyState
                title="No lesson logs yet"
                message="Your lesson history will appear here."
            />
        </Screen>
    );
}
