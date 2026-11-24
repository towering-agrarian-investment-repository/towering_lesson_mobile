import { LessonDetailView } from "@/components/golf/LessonDetailView";
import { useMemberLessonByGroup } from "@/lib/hook/useMemberLessonFlow";
import { useLocalSearchParams } from "expo-router";

type LessonParams = {
    groupId: string;
    lessonId: string;
};

export default function LessonDetailScreen() {
    const { groupId, lessonId } = useLocalSearchParams<LessonParams>();
    const numericGroupId = Number(groupId);
    const numericLessonId = Number(lessonId);
    const { data, isLoading, isError, refetch, isRefetching } = useMemberLessonByGroup(numericGroupId, numericLessonId);

    return (
        <LessonDetailView
            detail={data?.data}
            hasData={Boolean(data)}
            isLoading={isLoading}
            isError={isError}
            isRefetching={isRefetching}
            onRefetch={() => refetch({ cancelRefetch: false })}
            getSessionHref={(sessionId) =>
                `/groups/${numericGroupId}/lessons/${numericLessonId}/sessions?sessionId=${sessionId}`
            }
        />
    );
}
