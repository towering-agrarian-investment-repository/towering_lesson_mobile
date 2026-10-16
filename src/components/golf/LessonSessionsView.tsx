import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { Badge, EmptyState, getPressedScaleStyle } from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import type { SessionInstanceResponse } from "@/types/member-session";
import { formatType } from "@/utils/format-enum";
import { getSessionTitle } from "@/utils/member-lesson";
import { getSessionStatusTone, getSessionTypeTone } from "@/utils/status-tone";
import { fmtDateTime } from "@/utils/time-helper";
import { Host, Text } from "@expo/ui";
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        initialSessionId ?? sessions[0]?.id ?? null,
    );
    const [containerWidth, setContainerWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const [scrollX, setScrollX] = useState(0);
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
                onScroll={(x) => {
                    setScrollX(x);
                }}
                selectedSessionId={selectedSession.id}
                sessions={sessions}
                onSelect={setSelectedSessionId}
                scrollViewRef={scrollViewRef}
                showRightCue={
                    contentWidth > containerWidth + 8 &&
                    scrollX < contentWidth - containerWidth - 12
                }
            />

            <SessionDetailCard session={selectedSession} />

            <View className="flex-row items-center justify-between gap-4">
                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.subtitle.fontSize * uiFontScale,
                            fontWeight: "600" as const,
                        }}
                    >
                        {t("lessonSessions.resourcesTitle")}
                    </Text>
                </Host>
                {selectedSession.resources.length > 0 ? (
                    <Host matchContents ignoreSafeArea="all">
                        <Text
                            textStyle={{
                                ...typography.count, lineHeight: typography.count.lineHeight * uiFontScale,
                                color: uiColors.mutedForeground,
                                fontSize:
                                    typography.count.fontSize * uiFontScale,
                            }}
                        >
                            {String(selectedSession.resources.length ?? "")}
                        </Text>
                    </Host>
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
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    const { t } = useTranslation();
    return (
        <View className="gap-3">
            <View className="flex-row items-center justify-between gap-4">
                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale,
                            color: uiColors.foreground,
                            fontSize: typography.subtitle.fontSize * uiFontScale,
                            fontWeight: "600" as const,
                        }}
                    >
                        {t("lessonSessions.sessionsTitle")}
                    </Text>
                </Host>
                <Host matchContents ignoreSafeArea="all">
                    <Text
                        textStyle={{
                            ...typography.count, lineHeight: typography.count.lineHeight * uiFontScale,
                            color: uiColors.mutedForeground,
                            fontSize: typography.count.fontSize * uiFontScale,
                        }}
                    >
                        {String(sessions.length ?? "")}
                    </Text>
                </Host>
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
                                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                        <Text
                                            textStyle={{
                                                ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                                color: isSelected
                                                    ? uiColors.primary
                                                    : uiColors.mutedForeground,
                                                fontSize:
                                                    typography.caption
                                                        .fontSize * uiFontScale,
                                            }}
                                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
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
                                        </Text>
                                    </Host>
                                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                        <Text
                                            numberOfLines={2}
                                            textStyle={{
                                                ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                                color: isSelected
                                                    ? uiColors.primary
                                                    : uiColors.foreground,
                                                fontSize:
                                                    typography.label.fontSize *
                                                    uiFontScale,
                                            }}
                                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                            {getSessionTitle(session)}
                                        </Text>
                                    </Host>
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
                            <Host matchContents ignoreSafeArea="all">
                                <Text
                                    textStyle={{
                                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                        color: uiColors.mutedForeground,
                                        fontSize:
                                            typography.caption.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {t("lessonSessions.more")}
                                </Text>
                            </Host>
                        </View>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function SessionDetailCard({ session }: { session: SessionInstanceResponse }) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
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
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                numberOfLines={2}
                                textStyle={{
                                    ...typography.h3,
                                    lineHeight: typography.h3.lineHeight * uiFontScale,
                                    color: isCompleted ? uiColors.foreground + "b3" : uiColors.foreground,
                                    fontSize:
                                        typography.h3.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {getSessionTitle(session)}
                            </Text>
                        </Host>
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.body,
                                    lineHeight: typography.body.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.body.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {session.descriptionSnapshot?.trim() ||
                                    t("lessonSessions.noDescription")}
                            </Text>
                        </Host>
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
                        <Host
                            matchContents={{ vertical: true }}
                            ignoreSafeArea="all"
                            style={{ width: "100%", marginBottom: 4 }}
                        >
                            <Text
                                textStyle={{
                                    ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                                    color: uiColors.mutedForeground,
                                    fontSize:
                                        typography.caption.fontSize *
                                        uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {t("lessonSessions.coachNote")}
                            </Text>
                        </Host>
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                            <Text
                                textStyle={{
                                    ...typography.body,
                                    lineHeight: typography.body.lineHeight * uiFontScale,
                                    color: uiColors.foreground,
                                    fontSize:
                                        typography.body.fontSize * uiFontScale,
                                }}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                {memo}
                            </Text>
                        </Host>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    return (
        <View className="flex-row items-center justify-between gap-3">
            <Host
                matchContents
                ignoreSafeArea="all"
                style={{ flexShrink: 0 }}
            >
                <Text
                    textStyle={{
                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                        color: uiColors.mutedForeground,
                        fontSize: typography.caption.fontSize * uiFontScale,
                    }}
                >
                    {label}
                </Text>
            </Host>
            <Host
                matchContents={{ vertical: true }}
                ignoreSafeArea="all"
                style={{ flex: 1, minWidth: 0 }}
            >
                <Text
                    numberOfLines={1}
                    textStyle={{
                        ...typography.caption, lineHeight: typography.caption.lineHeight * uiFontScale,
                        textAlign: "right" as const,
                        fontWeight: "500" as const,
                        color: uiColors.foreground,
                        fontSize: typography.caption.fontSize * uiFontScale,
                    }}
                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "trailing" })] : [fillMaxWidth()]}>
                    {value}
                </Text>
            </Host>
        </View>
    );
}

function isSessionCompleted(session: SessionInstanceResponse) {
    return session.status === "COMPLETED" || !!session.completedAt;
}

function isDrillSession(session: SessionInstanceResponse) {
    return session.typeSnapshot === "DRILL";
}
