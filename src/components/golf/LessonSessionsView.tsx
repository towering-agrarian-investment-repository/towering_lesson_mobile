import {
    AppText,
    Badge,
    EmptyState,
    getPressedScaleStyle,
} from "@/design-system";
import type { SessionInstanceResponse } from "@/types/member-session";
import { formatType } from "@/utils/format-enum";
import { getSessionTitle } from "@/utils/member-lesson";
import {
    getSessionStatusTone,
    getSessionTypeTone,
} from "@/utils/status-tone";
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
    const [scrollX, setScrollX] = useState(0);
    const scrollViewRef = useRef<FlatList<SessionInstanceResponse>>(null);
    const itemLayouts = useRef<Record<number, { width: number; x: number }>>({});
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
                onScroll={(x) => {
                    setScrollX(x);
                }}
                selectedSessionId={selectedSession.id}
                sessions={sessions}
                onSelect={setSelectedSessionId}
                scrollViewRef={scrollViewRef}
                showRightCue={contentWidth > containerWidth + 8 && scrollX < contentWidth - containerWidth - 12}
            />

            <SessionDetailCard session={selectedSession} />

            <View className="flex-row items-center justify-between gap-4">
                <AppText variant="h3" className="text-lg font-semibold">
                    {t("lessonSessions.resourcesTitle")}
                </AppText>
                {selectedSession.resources.length > 0 ? (
                    <AppText variant="count">{selectedSession.resources.length}</AppText>
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
    onScroll,
    selectedSessionId,
    sessions,
    onSelect,
    scrollViewRef,
    showRightCue,
}: {
    contentWidth: number;
    containerWidth: number;
    onContainerLayout: (event: LayoutChangeEvent) => void;
    onContentSizeChange: (width: number) => void;
    onItemLayout: (sessionId: number, event: LayoutChangeEvent) => void;
    onScroll: (x: number) => void;
    selectedSessionId: number;
    sessions: SessionInstanceResponse[];
    onSelect: (sessionId: number) => void;
    scrollViewRef: RefObject<FlatList<SessionInstanceResponse> | null>;
    showRightCue: boolean;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between gap-4">
                <AppText variant="h3" className="text-lg font-semibold">
                    {t("lessonSessions.sessionsTitle")}
                </AppText>
                <AppText variant="count">{sessions.length}</AppText>
            </View>

            <View className="relative" onLayout={onContainerLayout}>
                <FlatList
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
                                accessibilityLabel={t("lessonSessions.openSession", {
                                    title: getSessionTitle(session),
                                })}
                                className={
                                    isSelected
                                        ? "min-h-16 min-w-32 rounded-2xl border border-primary bg-primary/10 px-4 py-3"
                                        : "min-h-16 min-w-32 rounded-2xl border border-border bg-card px-4 py-3"
                                }
                                style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.992)}
                                onLayout={(event) => {
                                    onItemLayout(session.id, event);
                                }}
                                onPress={() => {
                                    onSelect(session.id);
                                }}
                            >
                                <View className="gap-1.5">
                                    <AppText
                                        variant="caption"
                                        className={isSelected ? "text-primary" : "text-muted-foreground"}
                                    >
                                        {session.orderIndex != null
                                            ? t("lessonSessions.sessionNumber", {
                                                value: session.orderIndex,
                                            })
                                            : t("lessonSessions.sessionSequence", {
                                                value: index + 1,
                                            })}
                                    </AppText>
                                    <AppText
                                        variant="label"
                                        className={isSelected ? "text-primary" : "text-foreground"}
                                        numberOfLines={2}
                                    >
                                        {getSessionTitle(session)}
                                    </AppText>
                                    {session.status ? (
                                        <Badge
                                            label={formatType(session.status)}
                                            className={`px-2 py-1 ${statusTone.className}`}
                                            textClassName={statusTone.textClassName}
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
                    onScroll={(event) => {
                        onScroll(event.nativeEvent.contentOffset.x);
                    }}
                    scrollEventThrottle={16}
                />

                {showRightCue ? (
                    <View
                        pointerEvents="none"
                        className="absolute bottom-0 right-0 top-0 items-end justify-center"
                    >
                        <View className="rounded-full bg-background/95 px-2 py-1">
                            <AppText variant="caption" className="text-muted-foreground">
                                {t("lessonSessions.more")}
                            </AppText>
                        </View>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function SessionDetailCard({
    session,
}: {
    session: SessionInstanceResponse;
}) {
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
            ? { label: t("lessonSessions.completed"), value: fmtDateTime(session.completedAt) }
            : null,
    ].filter(Boolean) as { label: string; value: string }[];

    return (
        <View className="overflow-hidden rounded-xl bg-card">
            <View className="gap-3 bg-surface px-4 py-4">
                <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1 gap-2">
                        <AppText
                            variant="h3"
                            className={isCompleted ? "text-xl font-semibold leading-7 text-foreground/70" : "text-xl font-semibold leading-7"}
                            numberOfLines={2}
                        >
                            {getSessionTitle(session)}
                        </AppText>
                        <AppText variant="body" className="leading-6 text-foreground">
                            {session.descriptionSnapshot?.trim() || t("lessonSessions.noDescription")}
                        </AppText>
                    </View>
                    {session.status ? (
                        <Badge
                            label={formatType(session.status)}
                            className={statusTone.className}
                            textClassName={statusTone.textClassName}
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
                            textClassName="text-muted-foreground"
                        />
                    ) : null}
                    {session.typeSnapshot ? (
                        <Badge
                            label={formatType(session.typeSnapshot)}
                            className={typeTone.className}
                            textClassName={typeTone.textClassName}
                        />
                    ) : null}
                    {isDrillSession(session) ? (
                        <Badge
                            label={
                                score != null
                                    ? t("lessonSessions.score", { value: score })
                                    : t("lessonSessions.scoreEmpty")
                            }
                            className={score != null ? "bg-warning/10" : "bg-muted"}
                            textClassName={score != null ? "text-warning" : "text-muted-foreground"}
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
                        <AppText variant="caption" className="mb-1 text-muted-foreground">
                            {t("lessonSessions.coachNote")}
                        </AppText>
                        <AppText variant="body" className="leading-6 text-foreground">
                            {memo}
                        </AppText>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <View className="flex-row items-center justify-between gap-3">
            <AppText variant="caption" className="shrink-0 text-muted-foreground">
                {label}
            </AppText>
            <AppText
                variant="caption"
                className="min-w-0 flex-1 text-right font-medium text-foreground"
                numberOfLines={1}
            >
                {value}
            </AppText>
        </View>
    );
}

function isSessionCompleted(session: SessionInstanceResponse) {
    return session.status === "COMPLETED" || !!session.completedAt;
}

function isDrillSession(session: SessionInstanceResponse) {
    return session.typeSnapshot === "DRILL";
}
