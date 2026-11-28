import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { AppText } from "@/design-system/components/AppText";
import {
    ActionButton,
    AnimatedPressable,
    cn,
    EmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useMemberLessonLogById } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import { formatDateForDisplay } from "@/utils/time-helper";
import { useQueryClient } from "@tanstack/react-query";
import { useEvent } from "expo";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import Play from "lucide-react-native/icons/play";
import Star from "lucide-react-native/icons/star";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type LessonLogParams = {
    id: string;
};

const VIDEO_BACKGROUND_COLOR = "#000";

function LessonVideo({ videoUrl }: { videoUrl: string }) {
    const [playRequested, setPlayRequested] = useState(false);
    const savedPositionRef = useRef(0);
    const { colors } = useTheme();
    const { t } = useTranslation();

    const handleDeactivate = useCallback((position: number) => {
        if (Number.isFinite(position) && position >= 0) {
            savedPositionRef.current = position;
        }
        setPlayRequested(false);
    }, []);

    const getInitialPosition = useCallback(() => savedPositionRef.current, []);

    if (!playRequested) {
        return (
            <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={t("common.playVideo")}
                className="h-60 items-center justify-center overflow-hidden rounded-[22px] border border-border bg-media-background"
                onPress={() => setPlayRequested(true)}
            >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-scrim-control">
                    <Play size={26} color={colors.mediaForeground} fill={colors.mediaForeground} />
                </View>
            </AnimatedPressable>
        );
    }

    return (
        <LessonVideoPlayer
            videoUrl={videoUrl}
            getInitialPosition={getInitialPosition}
            onDeactivate={handleDeactivate}
        />
    );
}

function LessonVideoPlayer({
    videoUrl,
    getInitialPosition,
    onDeactivate,
}: {
    videoUrl: string;
    getInitialPosition: () => number;
    onDeactivate: (position: number) => void;
}) {
    const { t } = useTranslation();
    const player = useVideoPlayer(videoUrl, (videoPlayer) => {
        videoPlayer.loop = false;
        const initialPosition = getInitialPosition();
        if (initialPosition > 0) {
            videoPlayer.currentTime = initialPosition;
        }
        videoPlayer.play();
    });

    useFocusEffect(
        useCallback(() => {
            return () => {
                let currentTime = Number.NaN;
                try {
                    currentTime = player.currentTime;
                    const duration = player.duration;
                    if (duration > 0 && currentTime >= duration) currentTime = 0;
                    player.pause();
                } catch {
                    // Player may already be released on unmount.
                }
                onDeactivate(currentTime);
            };
        }, [onDeactivate, player]),
    );

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
                style={{
                    width: "100%",
                    height: 240,
                    backgroundColor: VIDEO_BACKGROUND_COLOR,
                }}
            />

            {videoError ? (
                <View className="px-4 py-3">
                    <AppText variant="caption" color="danger" textStyle={{ lineHeight: typography.subtext.lineHeight }}>
                        {t("lessonLog.videoLoadFailed")}
                    </AppText>
                </View>
            ) : null}
        </View>
    );
}
function LessonLogDetailsScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<LessonLogParams>();
    const router = useRouter();
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const { data: lessonLogResponse, isLoading, isError, refetch, isRefetching } = useMemberLessonLogById(Number(id));
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );

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

    if (isError && !lessonLogResponse) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <ErrorState
                    title={t("lessonLog.failedPostTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    if (!lessonLog) {
        return (
            <Screen
                contentClassName="grow"
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <EmptyState title={t("lessonLog.postNotAvailableTitle")} message={t("lessonLog.postNotFoundMessage")} />
            </Screen>
        );
    }

    const canReview = lessonLog.status !== "APPROVED";
    const hasSubmittedReview = Boolean(lessonLog.comment?.trim()) || (lessonLog.ratings ?? 0) > 0;
    const reviewStateLabel = hasSubmittedReview ? t("lessonLog.commentSubmitted") : t("lessonLog.leaveReview");

    return (
        <Screen
            contentClassName="grow gap-6"
            refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            footer={
                canReview ? (
                    <ActionButton
                        label={hasSubmittedReview ? t("lessonLog.editReview") : t("lessonLog.leaveReview")}
                        accessibilityLabel={t("lessonLog.leaveCommentAccessibility")}
                        disabled={isLocked}
                        haptic="selection"
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
                ) : null
            }
        >
            <View className="gap-2">
                <AppText variant="h2">{lessonLog.coachName ?? t("lessonLog.coachFallback")}</AppText>
                <AppText variant="subtext" color="mutedForeground">
                    {formatDateForDisplay(lessonLog.lessonDate)}
                </AppText>
            </View>

            <View className="h-px bg-border" />

            {videoUrl ? (
                <>
                    <View className="gap-3">
                        <AppText variant="label">{t("lessonLog.videoLabel")}</AppText>
                        <LessonVideo key={videoUrl} videoUrl={videoUrl} />
                    </View>

                    <View className="h-px bg-border" />
                </>
            ) : null}

            <View className="gap-3">
                <AppText variant="label">{t("lessonLog.proCommentLabel")}</AppText>
                <AppText variant="body" textStyle={{ lineHeight: typography.h3.lineHeight }}>
                    {lessonLog.body?.trim() || t("lessonLog.noProComment")}
                </AppText>
            </View>

            <View className="gap-3">
                <AppText variant="label">{t("lessonLog.yourReviewLabel")}</AppText>

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
                        <AppText variant="subtext" color="mutedForeground" wrap={false}>
                            {String(lessonLog.ratings ?? "") + "/5"}
                        </AppText>
                    </View>
                ) : null}

                {lessonLog.comment?.trim() ? (
                    <AppText variant="body" textStyle={{ lineHeight: typography.h3.lineHeight }}>
                        {lessonLog.comment}
                    </AppText>
                ) : (
                    <AppText
                        variant="body"
                        color="mutedForeground"
                        textStyle={{ lineHeight: typography.body.lineHeight }}
                    >
                        {hasSubmittedReview
                            ? t("lessonLog.reviewSubmittedMessage")
                            : canReview
                              ? t("lessonLog.canLeaveReviewMessage")
                              : t("lessonLog.reviewSubmittedMessage")}
                    </AppText>
                )}

                <View
                    className={cn(
                        "self-start rounded-md px-2.5 py-1",
                        hasSubmittedReview ? "bg-success/10" : "bg-warning/10",
                    )}
                >
                    <AppText
                        variant="badge"
                        wrap={false}
                        color={hasSubmittedReview ? "success" : "warning"}
                        textStyle={{ fontWeight: "600" }}
                    >
                        {reviewStateLabel}
                    </AppText>
                </View>
            </View>

            {lessonLog.reservation?.id ? (
                <>
                    <View className="h-px bg-border" />

                    <View className="gap-3">
                        <AppText variant="label">{t("lessonLog.relatedReservationLabel")}</AppText>

                        <ListRow
                            leading={
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                    <CalendarDays size={19} color={colors.primary} strokeWidth={2.2} />
                                </View>
                            }
                            title={
                                lessonLog.reservation.name?.trim() ||
                                t("reservations.reservationFallbackWithId", { id: lessonLog.reservation.id })
                            }
                            subtitle={t("lessonLog.viewReservationDetails")}
                            disabled={isLocked}
                            onPressIn={() => {
                                void queryClient.prefetchQuery(
                                    getMemberReservationDetailQueryOptions(lessonLog.reservation!.id, "lesson"),
                                );
                            }}
                            onPress={() => {
                                const targetId = String(lessonLog.reservation!.id);
                                runWithNavigationLock(() => {
                                    const routes = navigation.getState()?.routes ?? [];
                                    const previousRoute = routes.length >= 2 ? routes[routes.length - 2] : undefined;
                                    const previousParams = previousRoute?.params as
                                        { id?: string | number; type?: string } | undefined;
                                    if (
                                        previousRoute?.name === "reservation/[id]" &&
                                        String(previousParams?.id) === targetId &&
                                        (!previousParams?.type || previousParams.type === "lesson")
                                    ) {
                                        router.back();
                                        return;
                                    }

                                    router.push({
                                        pathname: "/reservation/[id]",
                                        params: {
                                            id: targetId,
                                            type: "lesson",
                                        },
                                    });
                                });
                            }}
                        />
                    </View>
                </>
            ) : null}
        </Screen>
    );
}

export default LessonLogDetailsScreen;
