import { AppText, Button, EmptyState, ErrorState, ListRow, Screen, Skeleton, useThemeColors } from "@/design-system";
import { useMemberLessonLogById } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useEvent } from "expo";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Star } from "lucide-react-native";
import React from "react";
import { Pressable, RefreshControl, View } from "react-native";

type LessonLogParams = {
    id: string;
}

const VIDEO_BACKGROUND_COLOR = "#000";

function LessonVideo({ videoUrl }: { videoUrl: string }) {
    const player = useVideoPlayer(videoUrl, (videoPlayer) => {
        videoPlayer.loop = false;
    });

    const { status } = useEvent(player, "statusChange", {
        status: player.status,
    });

    const videoError = status === "error";

    return (
        <View className="overflow-hidden rounded-[22px]">
            <VideoView
                player={player}
                nativeControls
                fullscreenOptions={{ enable: true }}
                contentFit="contain"
                style={{ width: "100%", height: 240, backgroundColor: VIDEO_BACKGROUND_COLOR }}
            />

            {videoError ? (
                <View className="px-4 py-3">
                    <AppText selectable variant="caption" className="leading-5 text-danger">
                        Video failed to load. Try refreshing the page.
                    </AppText>
                </View>
            ) : null}
        </View>
    );
}
function LessonLogDetailsScreen() {
    const { id } = useLocalSearchParams<LessonLogParams>()
    const router = useRouter();
    const colors = useThemeColors();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const { data: lessonLogResponse, isLoading, isError, refetch, isRefetching } = useMemberLessonLogById(Number(id));

    const lessonLog = lessonLogResponse?.data;
    const videoUrl = lessonLog?.videoUrl?.trim() || null;

    if (isLoading) {
        return (
            <Screen contentClassName="gap-6">
                <View className="flex-col gap-4">
                    <Skeleton className="h-8 w-2/3 rounded-xl" />
                    <Skeleton className="h-5 w-1/3 rounded-full" />
                </View>
                <View className="flex-col gap-4">
                    {Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} className="h-20 w-full rounded-xl" />
                    ))}
                </View>
            </Screen>
        );
    }

    if (isError) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />
                }
            >
                <ErrorState
                    title="Failed to load lesson post"
                    message="Pull to refresh and try again."
                    actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                    onAction={() => {
                        void refetch();
                    }}
                />
            </Screen>
        );
    }

    if (!lessonLog) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />
                }
            >
                <EmptyState title="Lesson post not available" message="The requested lesson post could not be found." />
            </Screen>
        );
    }

    const canReview = lessonLog.status !== "APPROVED";

    return (
        <Screen
            contentClassName="grow gap-5"
            refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />
            }
            footer={
                canReview ? (
                    <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                        <Button
                            title="Leave a Comment"
                            accessibilityLabel="Leave a comment for this lesson"
                            disabled={isLocked}
                            onPress={() => {
                                runWithNavigationLock(() => {
                                    router.push({
                                        pathname: "/lesson-log/[id]/comment",
                                        params: {
                                            id: String(lessonLog.id),
                                        },
                                    });
                                });
                            }}
                        />
                    </View>
                ) : null
            }
        >
            <View className="gap-2">
                <AppText selectable variant="h2">
                    {lessonLog.coachName ?? "Coach"}
                </AppText>
                <AppText selectable variant="meta">
                    {formatDateForDisplay(lessonLog.lessonDate)}
                </AppText>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-3">
                <AppText selectable variant="label">
                    Lesson Pro Comment
                </AppText>
                <AppText selectable variant="body" className="leading-7">
                    {lessonLog.body?.trim() || "No pro comment has been added for this lesson yet."}
                </AppText>
            </View>

            {videoUrl ? (
                <>
                    <View className="h-px bg-border" />

                    <View className="gap-3">
                        <AppText selectable variant="label">
                            Lesson Video
                        </AppText>
                        <LessonVideo videoUrl={videoUrl} />
                    </View>
                </>
            ) : null}

            <View className="gap-3">
                <AppText selectable variant="label">
                    Your Review
                </AppText>

                {lessonLog.ratings ? (
                    <View className="flex-row items-center gap-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Star
                                key={index}
                                size={20}
                                fill={index < lessonLog.ratings! ? colors.warning : "transparent"}
                                color={index < lessonLog.ratings! ? colors.warning : colors.border}
                                strokeWidth={1.8}
                            />
                        ))}
                        <AppText selectable variant="meta">
                            {lessonLog.ratings}/5
                        </AppText>
                    </View>
                ) : null}

                {lessonLog.comment?.trim() ? (
                    <AppText selectable variant="body" className="leading-7">
                        {lessonLog.comment}
                    </AppText>
                ) : (
                    <AppText selectable variant="muted" className="leading-6">
                        {canReview
                            ? "You can leave a rating and comment for this lesson."
                            : "Your comment has been submitted."}
                    </AppText>
                )}

                <View className="rounded-full self-start bg-muted px-3 py-1.5">
                    <AppText
                        selectable
                        variant="caption"
                        className={canReview ? "text-warning" : "text-success"}
                    >
                        {canReview ? "Leave a review" : "Comment submitted"}
                    </AppText>
                </View>
            </View>

            {lessonLog.reservation?.id ? (
                <>
                    <View className="h-px bg-border" />

                    <View className="gap-3">
                        <AppText selectable variant="label">
                            Related Reservation
                        </AppText>

                        <Link
                            href={{
                                pathname: "/reservation/[id]",
                                params: {
                                    id: String(lessonLog.reservation.id),
                                    type: "lesson",
                                },
                            }}
                            asChild
                        >
                            <ListRow
                                title={lessonLog.reservation.name?.trim() || `Reservation #${lessonLog.reservation.id}`}
                                subtitle="View reservation details"
                            />
                        </Link>
                    </View>
                </>
            ) : null}
        </Screen>
    );
}

export default LessonLogDetailsScreen;
