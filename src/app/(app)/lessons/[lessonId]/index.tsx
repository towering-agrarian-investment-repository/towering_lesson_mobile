import { LessonDetailView } from "@/components/golf/LessonDetailView";
import { useMemberLessonById } from "@/lib/hook/useMemberLessonFlow";
import { useLocalSearchParams } from "expo-router";

type LessonParams = {
    lessonId: string;
};

export default function StandaloneLessonDetailScreen() {
    const { lessonId } = useLocalSearchParams<LessonParams>();
    const numericLessonId = Number(lessonId);
    const { data, isLoading, isError, refetch, isRefetching } = useMemberLessonById(numericLessonId);

    return (
        <LessonDetailView
            detail={data?.data}
            hasData={Boolean(data)}
            isLoading={isLoading}
            isError={isError}
            isRefetching={isRefetching}
            onRefetch={() => refetch({ cancelRefetch: false })}
            getSessionHref={(sessionId) => `/lessons/${numericLessonId}/sessions?sessionId=${sessionId}`}
        />
    );
}
