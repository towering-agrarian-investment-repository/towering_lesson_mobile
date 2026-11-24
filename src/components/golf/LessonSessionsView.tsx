import { AnimatedPressable, Badge, EmptyState } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { cn } from "@/design-system/utils/cn";
import { useTheme } from "@/design-system/utils/theme";
import type { SessionInstanceResponse } from "@/types/member-session";
import { formatType } from "@/utils/format-enum";
import { getSessionTitle } from "@/utils/member-lesson";
import { getSessionStatusTone, getSessionTypeTone } from "@/utils/status-tone";
import { fmtDateTime } from "@/utils/time-helper";
import { Award, Check, CheckCircle2, Clock, MessageSquare } from "lucide-react-native";
import { memo, type RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, type LayoutChangeEvent, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SessionResourceSection } from "./SessionResourceSection";

const sessionKeyExtractor = (session: SessionInstanceResponse) => String(session.id);

function SessionSeparator() {
    return <View className="w-2" />;
}

const SessionPill = memo(function SessionPill({
    session,
    stepNumber,
    isSelected,
    onItemLayout,
    onSelect,
}: {
    session: SessionInstanceResponse;
    stepNumber: number;
    isSelected: boolean;
    onItemLayout: (sessionId: number, event: LayoutChangeEvent) => void;
    onSelect: (sessionId: number) => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const isCompleted = isSessionCompleted(session);

    return (
        <AnimatedPressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={t("lessonSessions.openSession", {
                title: getSessionTitle(session),
            })}
            haptic="selection"
            className={cn(
                "min-h-12 flex-row items-center gap-2 rounded-full border px-3.5 py-2",
                isSelected ? "border-primary bg-primary" : "border-border bg-card",
            )}
            onLayout={(event) => {
                onItemLayout(session.id, event);
            }}
            onPress={() => {
                onSelect(session.id);
            }}
        >
            <View
                className={cn(
                    "h-6 w-6 items-center justify-center rounded-full",
                    isSelected ? "bg-primary-foreground/20" : isCompleted ? "bg-success/15" : "bg-muted",
                )}
            >
                {isCompleted ? (
                    <Check size={13} strokeWidth={2.5} color={isSelected ? colors.primaryForeground : colors.success} />
                ) : (
                    <AppText
                        variant="badge"
                        wrap={false}
                        tabular
                        maxFontSizeMultiplier={1.25}
                        color={isSelected ? "primaryForeground" : "mutedForeground"}
                    >
                        {String(stepNumber)}
                    </AppText>
                )}
            </View>
            <AppText
                variant="subtext"
                wrap={false}
                numberOfLines={1}
                color={isSelected ? "primaryForeground" : "foreground"}
                style={{ maxWidth: 220 }}
                textStyle={{ fontWeight: isSelected ? "600" : "400" }}
            >
                {getSessionTitle(session)}
            </AppText>
        </AnimatedPressable>
    );
});

type LessonSessionsViewProps = {
    initialSessionId?: number | null;
    sessions: SessionInstanceResponse[];
};

export function LessonSessionsView({ initialSessionId, sessions }: LessonSessionsViewProps) {
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        initialSessionId ?? sessions[0]?.id ?? null,
    );
    const [containerWidth, setContainerWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
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
            animated: !reducedMotion,
            offset: targetX,
        });
    }, [activeSessionId, containerWidth, contentWidth, reducedMotion]);

    if (sessions.length === 0) {
        return (
            <EmptyState title={t("lessonSessions.noSessionsTitle")} message={t("lessonSessions.noSessionsMessage")} />
        );
    }

    if (!selectedSession) {
        return null;
    }

    const selectedIndex = sessions.findIndex((session) => session.id === selectedSession.id);

    return (
        <View className="gap-6">
            {sessions.length > 1 ? (
                <SessionSwitcher
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
            ) : null}

            <SessionOverview session={selectedSession} fallbackNumber={selectedIndex + 1} />

            <View className="gap-3">
                <View className="flex-row items-baseline justify-between gap-4">
                    <AppText variant="subtitle" wrap={false} textStyle={{ fontWeight: "700" }}>
                        {t("lessonSessions.resourcesTitle")}
                    </AppText>
                    {selectedSession.resources.length > 0 ? (
                        <AppText
                            variant="caption"
                            color="mutedForeground"
                            wrap={false}
                            tabular
                            textStyle={{ fontWeight: "600" }}
                        >
                            {String(selectedSession.resources.length)}
                        </AppText>
                    ) : null}
                </View>

                <SessionResourceSection key={selectedSession.id} resources={selectedSession.resources} />
            </View>
        </View>
    );
}

function SessionSwitcher({
    onContainerLayout,
    onContentSizeChange,
    onItemLayout,
    selectedSessionId,
    sessions,
    onSelect,
    scrollViewRef,
}: {
    onContainerLayout: (event: LayoutChangeEvent) => void;
    onContentSizeChange: (width: number) => void;
    onItemLayout: (sessionId: number, event: LayoutChangeEvent) => void;
    selectedSessionId: number;
    sessions: SessionInstanceResponse[];
    onSelect: (sessionId: number) => void;
    scrollViewRef: RefObject<FlatList<SessionInstanceResponse> | null>;
}) {
    const renderSessionItem = useCallback(
        ({ item, index }: { item: SessionInstanceResponse; index: number }) => (
            <SessionPill
                session={item}
                stepNumber={item.orderIndex ?? index + 1}
                isSelected={item.id === selectedSessionId}
                onItemLayout={onItemLayout}
                onSelect={onSelect}
            />
        ),
        [onItemLayout, onSelect, selectedSessionId],
    );

    return (
        <View onLayout={onContainerLayout}>
            <FlatList
                ref={scrollViewRef}
                data={sessions}
                keyExtractor={sessionKeyExtractor}
                horizontal
                renderItem={renderSessionItem}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={SessionSeparator}
                onContentSizeChange={(width) => {
                    onContentSizeChange(width);
                }}
            />
        </View>
    );
}

function SessionOverview({ session, fallbackNumber }: { session: SessionInstanceResponse; fallbackNumber: number }) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const score = session.memberSession?.score;
    const memo = session.memberSession?.memo?.trim() || null;
    const description = session.descriptionSnapshot?.trim() || null;
    const statusTone = getSessionStatusTone(session.status);
    const typeTone = getSessionTypeTone(session.typeSnapshot);
    const stepLabel =
        session.orderIndex != null
            ? t("lessonSessions.sessionNumber", { value: session.orderIndex })
            : t("lessonSessions.sessionSequence", { value: fallbackNumber });
    const hasMetaStrip =
        session.durationMinutesSnapshot != null || isDrillSession(session) || Boolean(session.completedAt);

    return (
        <View className="gap-3">
            <View className="gap-2">
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <View className="flex-row items-center gap-2">
                        <AppText
                            variant="caption"
                            color="mutedForeground"
                            wrap={false}
                            tabular
                            textStyle={{ fontWeight: "600" }}
                        >
                            {stepLabel}
                        </AppText>
                        {session.typeSnapshot ? (
                            <Badge
                                label={formatType(session.typeSnapshot, t)}
                                size="sm"
                                className={typeTone.className}
                                color={typeTone.color}
                            />
                        ) : null}
                    </View>

                    {session.status ? (
                        <Badge
                            label={formatType(session.status, t)}
                            className={statusTone.className}
                            color={statusTone.color}
                        />
                    ) : null}
                </View>

                <AppText variant="h2">{getSessionTitle(session)}</AppText>
            </View>

            {hasMetaStrip ? (
                <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2 border-y border-border/70 py-2.5">
                    {session.durationMinutesSnapshot != null ? (
                        <View className="flex-row items-center gap-1.5">
                            <Clock size={15} color={colors.mutedForeground} strokeWidth={2} />
                            <AppText
                                variant="subtext"
                                color="foreground"
                                wrap={false}
                                tabular
                                textStyle={{ fontWeight: "600" }}
                            >
                                {t("lessonSessions.minutes", {
                                    value: session.durationMinutesSnapshot,
                                })}
                            </AppText>
                        </View>
                    ) : null}

                    {isDrillSession(session) ? (
                        <View className="flex-row items-center gap-1.5">
                            <Award
                                size={15}
                                color={score != null ? colors.warning : colors.mutedForeground}
                                strokeWidth={2}
                            />
                            <AppText
                                variant="subtext"
                                color={score != null ? "warning" : "mutedForeground"}
                                wrap={false}
                                tabular
                                textStyle={{ fontWeight: "600" }}
                            >
                                {score != null
                                    ? t("lessonSessions.score", {
                                          value: score,
                                      })
                                    : t("lessonSessions.scoreEmpty")}
                            </AppText>
                        </View>
                    ) : null}

                    {session.completedAt ? (
                        <View className="flex-row items-center gap-1.5">
                            <CheckCircle2 size={15} color={colors.success} strokeWidth={2} />
                            <AppText variant="subtext" color="mutedForeground" wrap={false} tabular>
                                {fmtDateTime(session.completedAt)}
                            </AppText>
                        </View>
                    ) : null}
                </View>
            ) : null}

            {description ? (
                <AppText variant="body" color="mutedForeground">
                    {description}
                </AppText>
            ) : (
                <AppText variant="subtext" color="mutedForeground">
                    {t("lessonSessions.noDescription")}
                </AppText>
            )}

            {memo ? (
                <View className="mt-1 gap-2 rounded-2xl border border-border bg-surface p-4">
                    <View className="flex-row items-center gap-2">
                        <MessageSquare size={15} color={colors.primary} strokeWidth={2} />
                        <AppText variant="caption" color="primary" wrap={false} textStyle={{ fontWeight: "600" }}>
                            {t("lessonSessions.coachNote")}
                        </AppText>
                    </View>
                    <AppText variant="body">{memo}</AppText>
                </View>
            ) : null}
        </View>
    );
}

function isSessionCompleted(session: SessionInstanceResponse) {
    return session.status === "COMPLETED" || !!session.completedAt;
}

function isDrillSession(session: SessionInstanceResponse) {
    return session.typeSnapshot === "DRILL";
}
