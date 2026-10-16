import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
import {
    EmptyState,
    ErrorState,
    ListRow,
    Screen,
    Skeleton,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { useMemberLessonLogById } from "@/lib/hook/useLessonLog";
import { useNavigationLock } from "@/lib/hook/useNavigationLock";
import { getMemberReservationDetailQueryOptions } from "@/lib/hook/useReservation";
import { formatDateForDisplay } from "@/utils/time-helper";
import { Button, Host, Text } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { useQueryClient } from "@tanstack/react-query";
import { useEvent } from "expo";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Star } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { RefreshControl, View } from "react-native";

type LessonLogParams = {
    id: string;
};

const VIDEO_BACKGROUND_COLOR = "#000";

function LessonVideo({ videoUrl }: { videoUrl: string }) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
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
                style={{
                    width: "100%",
                    height: 240,
                    backgroundColor: VIDEO_BACKGROUND_COLOR,
                }}
            />

            {videoError ? (
                <View className="px-4 py-3">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.caption,
                                lineHeight: typography.subtext.lineHeight * uiFontScale,
                                color: uiColors.danger,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {t("lessonLog.videoLoadFailed")}
                        </Text>
                    </Host>
                </View>
            ) : null}
        </View>
    );
}
function LessonLogDetailsScreen() {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<LessonLogParams>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const colors = useThemeColors();
    const { isLocked, runWithNavigationLock } = useNavigationLock();

    const {
        data: lessonLogResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useMemberLessonLogById(Number(id));

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
                        <Skeleton
                            key={index}
                            className="h-20 w-full rounded-xl"
                        />
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
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                }
            >
                <ErrorState
                    title={t("lessonLog.failedPostTitle")}
                    message={t("common.pullToRefreshAndTryAgain")}
                    actionLabel={
                        isRefetching
                            ? t("common.refreshing")
                            : t("common.refreshTryAgain")
                    }
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
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                }
            >
                <EmptyState
                    title={t("lessonLog.postNotAvailableTitle")}
                    message={t("lessonLog.postNotFoundMessage")}
                />
            </Screen>
        );
    }

    const canReview = lessonLog.status !== "APPROVED";
    const hasSubmittedReview =
        Boolean(lessonLog.comment?.trim()) || (lessonLog.ratings ?? 0) > 0;
    const reviewStateLabel = hasSubmittedReview
        ? t("lessonLog.commentSubmitted")
        : t("lessonLog.leaveReview");

    return (
        <Screen
            contentClassName="grow gap-5"
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={() => {
                        void refetch();
                    }}
                />
            }
            footer={
                canReview ? (
                    <View className="pb-8 pt-4">
                        <Host
                            matchContents={{ vertical: true }}
                            ignoreSafeArea="all"
                            colorScheme={uiScheme}
                            seedColor={uiColors.primary}
                            accessibilityLabel={t(
                                "lessonLog.leaveCommentAccessibility",
                            )}
                            accessibilityState={{
                                disabled: isLocked,
                                busy: false,
                            }}
                            style={{ width: "100%" }}>
                            <Button
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [
                                            frame({
                                                maxWidth: Infinity,
                                                minHeight: 48,
                                            }),
                                        ]
                                        : [
                                            fillMaxWidth(),
                                            defaultMinSize({ minHeight: 48 }),
                                        ]
                                }
                                variant="text"
                                disabled={isLocked}
                                onPress={() => {
                                    runWithNavigationLock(() => {
                                        router.push({
                                            pathname:
                                                "/lesson-log/[id]/comment",
                                            params: {
                                                id: String(lessonLog.id),
                                            },
                                        });
                                    });
                                }}
                                style={{
                                    ...getNativeButtonStyle(
                                        uiColors,
                                        "filled",
                                        isLocked,
                                        uiColors.primary,
                                    ), ...{ borderRadius: 12 }
                                }}
                            >
                                <Text
                                    modifiers={
                                        process.env.EXPO_OS === "ios"
                                            ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                            : [fillMaxWidth()]
                                    }
                                    textStyle={{
                                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                        textAlign: "center",
                                        color: uiColors.primaryForeground,
                                        fontSize:
                                            typography.label.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {t("lessonLog.leaveComment")}
                                </Text>
                            </Button>
                        </Host>
                    </View>
                ) : null
            }
        >
            <View className="gap-2">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.h2, lineHeight: typography.h2.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.h2.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {lessonLog.coachName ?? t("lessonLog.coachFallback")}
                    </Text>
                </Host>
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            fontSize: typography.meta.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {formatDateForDisplay(lessonLog.lessonDate)}
                    </Text>
                </Host>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-3">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.label.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {t("lessonLog.proCommentLabel")}
                    </Text>
                </Host>
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.body,
                            color: uiColors.foreground,
                            lineHeight: typography.h3.lineHeight * uiFontScale,
                            fontSize: typography.body.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {lessonLog.body?.trim() || t("lessonLog.noProComment")}
                    </Text>
                </Host>
            </View>

            {videoUrl ? (
                <>
                    <View className="h-px bg-border" />

                    <View className="gap-3">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {t("lessonLog.videoLabel")}
                            </Text>
                        </Host>
                        <LessonVideo videoUrl={videoUrl} />
                    </View>
                </>
            ) : null}

            <View className="gap-3">
                <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                    <Text
                        textStyle={{
                            ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.label.fontSize * uiFontScale,
                        }}
                        modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                        {t("lessonLog.yourReviewLabel")}
                    </Text>
                </Host>

                {lessonLog.ratings ? (
                    <View className="flex-row items-center gap-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Star
                                key={index}
                                size={20}
                                fill={
                                    index < lessonLog.ratings!
                                        ? colors.warning
                                        : "transparent"
                                }
                                color={
                                    index < lessonLog.ratings!
                                        ? colors.warning
                                        : colors.border
                                }
                                strokeWidth={1.8}
                            />
                        ))}
                        <Host matchContents ignoreSafeArea="all">
                            <Text
                                textStyle={{
                                    ...typography.meta, lineHeight: typography.meta.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    fontSize:
                                        typography.meta.fontSize * uiFontScale,
                                }}
                            >
                                {String(lessonLog.ratings ?? "") + "/5"}
                            </Text>
                        </Host>
                    </View>
                ) : null}

                {lessonLog.comment?.trim() ? (
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.body,
                                color: uiColors.foreground,
                                lineHeight: typography.h3.lineHeight * uiFontScale,
                                fontSize:
                                    typography.body.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {lessonLog.comment}
                        </Text>
                    </Host>
                ) : (
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.muted,
                                color: uiColors.mutedForeground,
                                lineHeight: typography.body.lineHeight * uiFontScale,
                                fontSize:
                                    typography.muted.fontSize * uiFontScale,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {hasSubmittedReview
                                ? t("lessonLog.reviewSubmittedMessage")
                                : canReview
                                    ? t("lessonLog.canLeaveReviewMessage")
                                    : t("lessonLog.reviewSubmittedMessage")}
                        </Text>
                    </Host>
                )}

                <View className="self-start rounded-full bg-muted px-3 py-1.5">
                    <Host matchContents ignoreSafeArea="all">
                        <Text
                            textStyle={{
                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                color: hasSubmittedReview
                                    ? uiColors.success
                                    : uiColors.warning,
                                fontSize:
                                    typography.caption.fontSize * uiFontScale,
                            }}
                        >
                            {reviewStateLabel}
                        </Text>
                    </Host>
                </View>
            </View>

            {lessonLog.reservation?.id ? (
                <>
                    <View className="h-px bg-border" />

                    <View className="gap-3">
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.label.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {t("lessonLog.relatedReservationLabel")}
                            </Text>
                        </Host>

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
                                title={
                                    lessonLog.reservation.name?.trim() ||
                                    t(
                                        "reservations.reservationFallbackWithId",
                                        { id: lessonLog.reservation.id },
                                    )
                                }
                                subtitle={t("lessonLog.viewReservationDetails")}
                                onPressIn={() => {
                                    void queryClient.prefetchQuery(
                                        getMemberReservationDetailQueryOptions(
                                            lessonLog.reservation!.id,
                                            "lesson",
                                        ),
                                    );
                                }}
                            />
                        </Link>
                    </View>
                </>
            ) : null}
        </Screen>
    );
}

export default LessonLogDetailsScreen;
