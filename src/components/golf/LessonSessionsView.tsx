import { NativeText } from "@/design-system/components/NativeText";
import { Badge, EmptyState, getPressedScaleStyle } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import type { SessionInstanceResponse } from "@/types/member-session";
import { formatType } from "@/utils/format-enum";
import { getSessionTitle } from "@/utils/member-lesson";
import { getSessionStatusTone, getSessionTypeTone } from "@/utils/status-tone";
import { fmtDateTime } from "@/utils/time-helper";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    type LayoutChangeEvent,
    FlatList,
    Platform,
    Pressable,
    View,
} from "react-native";
import { SessionResourceSection } from "./SessionResourceSection";
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";

type LessonSessionsViewProps = {
    initialSessionId?: number | null;
    sessions: SessionInstanceResponse[];
};

export function LessonSessionsView({
    initialSessionId,
    sessions,
}: LessonSessionsViewProps) {

    const { t } = useTranslation();
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        initialSessionId ?? sessions[0]?.id ?? null,
    );
    const [containerWidth, setContainerWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const scrollViewRef = useRef<FlatList<SessionInstanceResponse>>(null);
    const itemLayouts = useRef<Record<number, { width: number; x: number }>>(
        {},
    );
    const selectedSession =
        sessions.find((session) => session.id === selectedSessionId) ??
        sessions.find((session) => session.id === initialSessionId) ??
        sessions[0] ??
        null;
    const activeSessionId = selectedSession?.id ?? null;

    useLayoutEffect(() => {
        if (activeSessionId == null || containerWidth === 0) {
            return;
        }

        const layout = itemLayouts.current[activeSessionId];

        if (!layout) {
            return;
        }

        const targetX = Math.max(
            0,
            Math.min(
                layout.x - Math.max((containerWidth - layout.width) / 2, 0),
                Math.max(contentWidth - containerWidth, 0),
            ),
        );

        scrollViewRef.current?.scrollToOffset({
            animated: true,
            offset: targetX,
        });
    }, [activeSessionId, containerWidth, contentWidth]);

    if (sessions.length === 0) {
        return (
            <EmptyState
                title={t("lessonSessions.noSessionsTitle")}
                message={t("lessonSessions.noSessionsMessage")}
            />
        );
    }

    if (!selectedSession) {
        return null;
    }

    return (
        <View className="gap-4">
            <SessionSwitcher
                contentWidth={contentWidth}
                containerWidth={containerWidth}
                onContainerLayout={(event) => {
                    setContainerWidth(event.nativeEvent.layout.width);
                }}
                onContentSizeChange={(width) => {
                    setContentWidth(width);
                }}
                onItemLayout={(sessionId, event) => {
                    itemLayouts.current[sessionId] = event.nativeEvent.layout;
                }}
                selectedSessionId={selectedSession.id}
                sessions={sessions}
                onSelect={setSelectedSessionId}
                scrollViewRef={scrollViewRef}
            />

            <SessionDetailCard session={selectedSession} />

            <View className="flex-row items-center justify-between gap-4">
                <NativeText
                    variant="h3"
                    wrap={false}
                    textStyle={{ fontSize: typography.subtitle.fontSize, fontWeight: "600" as const }}
                >
                    {t("lessonSessions.resourcesTitle")}
                </NativeText>
                {selectedSession.resources.length > 0 ? (
                    <NativeText variant="count" color="mutedForeground" wrap={false}>
                        {String(selectedSession.resources.length ?? "")}
                    </NativeText>
                ) : null}
            </View>

            <SessionResourceSection resources={selectedSession.resources} />
        </View>
    );
}

function SessionSwitcher({
    contentWidth,
    containerWidth,
    onContainerLayout,
    onContentSizeChange,
    onItemLayout,
    selectedSessionId,
    sessions,
    onSelect,
    scrollViewRef,
}: {
    contentWidth: number;
    containerWidth: number;
    onContainerLayout: (event: LayoutChangeEvent) => void;
    onContentSizeChange: (width: number) => void;
    onItemLayout: (sessionId: number, event: LayoutChangeEvent) => void;
    selectedSessionId: number;
    sessions: SessionInstanceResponse[];
    onSelect: (sessionId: number) => void;
    scrollViewRef: RefObject<FlatList<SessionInstanceResponse> | null>;
}) {
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();
    const scrollX = useSharedValue(0);
    const handleScroll = useAnimatedScrollHandler((event) => {
        scrollX.set(event.contentOffset.x);
    });
    const cueStyle = useAnimatedStyle(() => ({
        opacity: contentWidth > containerWidth + 8 &&
            scrollX.get() < contentWidth - containerWidth - 12 ? 1 : 0,
    }));
    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between gap-4">
                <NativeText
                    variant="h3"
                    wrap={false}
                    textStyle={{ fontSize: typography.subtitle.fontSize, fontWeight: "600" as const }}
                >
                    {t("lessonSessions.sessionsTitle")}
                </NativeText>
                <NativeText variant="count" color="mutedForeground" wrap={false}>
                    {String(sessions.length ?? "")}
                </NativeText>
            </View>

            <View className="relative" onLayout={onContainerLayout}>
                <Animated.FlatList
                    ref={scrollViewRef}
                    data={sessions}
                    keyExtractor={(session) => String(session.id)}
                    horizontal
                    renderItem={({ item: session, index }) => {
                        const isSelected = session.id === selectedSessionId;
                        const statusTone = getSessionStatusTone(session.status);

                        return (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t(
                                    "lessonSessions.openSession",
                                    {
                                        title: getSessionTitle(session),
                                    },
                                )}
                                className={
                                    isSelected
                                        ? "min-h-16 min-w-32 rounded-2xl border border-primary bg-primary/10 px-4 py-3"
                                        : "min-h-16 min-w-32 rounded-2xl border border-border bg-card px-4 py-3"
                                }
                                style={({ pressed }) =>
                                    getPressedScaleStyle(pressed, false, 0.992)
                                }
                                onLayout={(event) => {
                                    onItemLayout(session.id, event);
                                }}
                                onPress={() => {
                                    onSelect(session.id);
                                }}
                            >
                                <View className="gap-1.5">
                                    <NativeText
                                        variant="caption"
                                        textStyle={{
                                            color: isSelected
                                                ? uiColors.primary
                                                : uiColors.mutedForeground
                                        }}
                                    >
                                        {session.orderIndex != null
                                            ? t(
                                                "lessonSessions.sessionNumber",
                                                {
                                                    value: session.orderIndex,
                                                },
                                            )
                                            : t(
                                                "lessonSessions.sessionSequence",
                                                {
                                                    value: index + 1,
                                                },
                                            )}
                                    </NativeText>
                                    <NativeText
                                        variant="label"
                                        numberOfLines={2}
                                        textStyle={{
                                            color: isSelected
                                                ? uiColors.primary
                                                : uiColors.foreground
                                        }}
                                    >
                                        {getSessionTitle(session)}
                                    </NativeText>
                                    {session.status ? (
                                        <Badge
                                            label={formatType(session.status)}
                                            className={`px-2 py-1 ${statusTone.className}`}
                                            color={statusTone.color}
                                        />
                                    ) : null}
                                </View>
                            </Pressable>
                        );
                    }}
                    showsHorizontalScrollIndicator={Platform.OS === "android"}
                    ItemSeparatorComponent={() => <View className="w-3" />}
                    contentContainerStyle={{
                        paddingRight: contentWidth > containerWidth ? 28 : 0,
                    }}
                    onContentSizeChange={(width) => {
                        onContentSizeChange(width);
                    }}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                />

                <Animated.View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="absolute bottom-0 right-0 top-0 items-end justify-center"
                    style={cueStyle}
                >
                    <View className="rounded-full bg-background/95 px-2 py-1">
                        <NativeText variant="caption" color="mutedForeground" wrap={false}>
                            {t("lessonSessions.more")}
                        </NativeText>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

function SessionDetailCard({ session }: { session: SessionInstanceResponse }) {
    const { colors: uiColors } = useTheme();
    const { t } = useTranslation();
    const isCompleted = isSessionCompleted(session);
    const score = session.memberSession?.score;
    const memo = session.memberSession?.memo?.trim() || null;
    const statusTone = getSessionStatusTone(session.status);
    const typeTone = getSessionTypeTone(session.typeSnapshot);
    const details = [
        session.durationMinutesSnapshot != null
            ? {
                label: t("lessonSessions.duration"),
                value: t("lessonSessions.minutes", {
                    value: session.durationMinutesSnapshot,
                }),
            }
            : null,
        session.completedAt
            ? {
                label: t("lessonSessions.completed"),
                value: fmtDateTime(session.completedAt),
            }
            : null,
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <View className="overflow-hidden rounded-xl bg-card">
            <View className="gap-3 bg-surface px-4 py-4">
                <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1 gap-2">
                        <NativeText
                            variant="h3"
                            numberOfLines={2}
                            textStyle={{ color: isCompleted ? uiColors.foreground + "b3" : uiColors.foreground }}
                        >
                            {getSessionTitle(session)}
                        </NativeText>
                        <NativeText variant="body">
                            {session.descriptionSnapshot?.trim() ||
                                t("lessonSessions.noDescription")}
                        </NativeText>
                    </View>
                    {session.status ? (
                        <Badge
                            label={formatType(session.status)}
                            className={statusTone.className}
                            color={statusTone.color}
                        />
                    ) : null}
                </View>

                <View className="flex-row flex-wrap gap-2">
                    {session.orderIndex != null ? (
                        <Badge
                            label={t("lessonSessions.sessionNumber", {
                                value: session.orderIndex,
                            })}
                            className="bg-muted"
                            color="mutedForeground"
                        />
                    ) : null}
                    {session.typeSnapshot ? (
                        <Badge
                            label={formatType(session.typeSnapshot)}
                            className={typeTone.className}
                            color={typeTone.color}
                        />
                    ) : null}
                    {isDrillSession(session) ? (
                        <Badge
                            label={
                                score != null
                                    ? t("lessonSessions.score", {
                                        value: score,
                                    })
                                    : t("lessonSessions.scoreEmpty")
                            }
                            className={
                                score != null ? "bg-warning/10" : "bg-muted"
                            }
                            color={
                                score != null ? "warning" : "mutedForeground"
                            }
                        />
                    ) : null}
                </View>

                {details.length > 0 ? (
                    <View className="gap-2 rounded-xl bg-background px-3 py-3">
                        {details.map((detail) => (
                            <DetailRow
                                key={detail.label}
                                label={detail.label}
                                value={detail.value}
                            />
                        ))}
                    </View>
                ) : null}
            </View>

            <View className="px-4 py-4">
                {memo ? (
                    <View className="rounded-xl bg-background px-3 py-3">
                        <NativeText variant="caption" color="mutedForeground" style={{ marginBottom: 4 }}>
                            {t("lessonSessions.coachNote")}
                        </NativeText>
                        <NativeText variant="body">
                            {memo}
                        </NativeText>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {

    return (
        <View className="flex-row items-center justify-between gap-3">
            <NativeText variant="caption" color="mutedForeground" wrap={false} style={{ flexShrink: 0 }}>
                {label}
            </NativeText>
            <NativeText
                variant="caption"
                align="right"
                numberOfLines={1}
                style={{ flex: 1, minWidth: 0 }}
                textStyle={{ fontWeight: "500" as const }}
            >
                {value}
            </NativeText>
        </View>
    );
}

function isSessionCompleted(session: SessionInstanceResponse) {
    return session.status === "COMPLETED" || !!session.completedAt;
}

function isDrillSession(session: SessionInstanceResponse) {
    return session.typeSnapshot === "DRILL";
}
