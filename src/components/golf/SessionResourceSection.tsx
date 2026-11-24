import {
    AnimatedPressable,
    AppText,
    Badge,
    CompactEmptyState,
    ImageViewerModal,
    useThemeColors,
} from "@/design-system";
import { showAppToast } from "@/design-system/components/AppToast";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import type { SessionResourcesFilesResponse } from "@/types/member-session";
import {
    getFileExtension,
    isAllowedExtension,
    isAllowedMimeType,
    RESOURCE_FILE_EXTENSIONS,
    RESOURCE_IMAGE_EXTENSIONS,
    RESOURCE_VIDEO_EXTENSIONS,
} from "@/utils/media";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ExternalLink, FileText, Play } from "lucide-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { openExternalUrl } from "@/utils/open-external-url";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

type SessionResourceSectionProps = {
    resources: SessionResourcesFilesResponse[];
};

const VIDEO_BACKGROUND_COLOR = "#000";

function ResourceVideo({ videoUrl }: { videoUrl: string }) {
    const { t } = useTranslation();
    const player = useVideoPlayer(videoUrl, (videoPlayer) => {
        videoPlayer.loop = false;
        videoPlayer.play();
    });

    useFocusEffect(
        useCallback(() => {
            return () => {
                try {
                    player.pause();
                } catch {
                    // Player may already be released on unmount.
                }
            };
        }, [player]),
    );

    const { status } = useEvent(player, "statusChange", {
        status: player.status,
    });

    return (
        <View>
            <VideoView
                player={player}
                nativeControls
                fullscreenOptions={{ enable: true }}
                contentFit="contain"
                style={{
                    width: "100%",
                    height: 220,
                    backgroundColor: VIDEO_BACKGROUND_COLOR,
                }}
            />

            {status === "error" ? (
                <View className="px-4 py-2">
                    <AppText variant="caption" color="danger" textStyle={{ lineHeight: typography.subtext.lineHeight }}>
                        {t("sessionResources.videoFailedToLoad")}
                    </AppText>
                </View>
            ) : null}
        </View>
    );
}

function getResourceKey(resource: SessionResourcesFilesResponse) {
    if (resource.id != null) {
        return `resource-${resource.id}`;
    }
    const url = resource.fileUrl ?? resource.externalUrl;
    if (url) {
        return `resource-${url}`;
    }
    return `resource-${resource.originalFileName ?? "unknown"}`;
}

export function SessionResourceSection({ resources }: SessionResourceSectionProps) {
    const { t } = useTranslation();
    const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<{
        uri: string;
        title: string;
    } | null>(null);

    if (resources.length === 0) {
        return <CompactEmptyState title={t("sessionResources.noResources")} />;
    }

    return (
        <>
            <View className="gap-3">
                {resources.map((resource) => {
                    const key = getResourceKey(resource);
                    return (
                        <SessionResourceItem
                            key={key}
                            resource={resource}
                            playRequested={activeVideoKey === key}
                            onRequestPlay={() => setActiveVideoKey(key)}
                            onPreviewImage={(uri, title) => setPreviewImage({ uri, title })}
                        />
                    );
                })}
            </View>
            <ImageViewerModal
                visible={Boolean(previewImage)}
                imageUri={previewImage?.uri ?? null}
                title={previewImage?.title}
                onClose={() => setPreviewImage(null)}
            />
        </>
    );
}

function SessionResourceItem({
    resource,
    playRequested,
    onRequestPlay,
    onPreviewImage,
}: {
    resource: SessionResourcesFilesResponse;
    playRequested: boolean;
    onRequestPlay: () => void;
    onPreviewImage: (uri: string, title: string) => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const reducedMotion = useReducedMotion();
    const url = getResourceUrl(resource);
    const title = resource.originalFileName?.trim() || t("sessionResources.resourceFallback", { id: resource.id });
    const resourceTypeLabel = getResourceTypeLabel(resource, t);
    const fileAccentColor = getFileAccentColor(resource, colors);

    const openUrl = () => {
        if (!url) return;
        void openExternalUrl(url, colors).catch(() => {
            showAppToast({
                message: t("common.unableToOpenLink"),
                type: "error",
            });
        });
    };

    if (!url || !isSupportedResource(resource)) {
        return (
            <View className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileText size={18} color={colors.mutedForeground} strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="label" numberOfLines={2}>
                        {title}
                    </AppText>
                </View>
                <View className="shrink-0">
                    <Badge label={resourceTypeLabel} size="sm" />
                </View>
            </View>
        );
    }

    if (isImageResource(resource)) {
        return (
            <AnimatedPressable
                accessibilityRole="imagebutton"
                accessibilityLabel={t("sessionResources.openImage", {
                    title,
                })}
                haptic="selection"
                className="overflow-hidden rounded-2xl border border-border bg-card"
                onPress={() => onPreviewImage(url, title)}
            >
                <Image
                    source={{ uri: url }}
                    cachePolicy="memory-disk"
                    recyclingKey={url}
                    contentFit="cover"
                    transition={reducedMotion ? 0 : 150}
                    className="bg-muted"
                    style={{ width: "100%", height: 220 }}
                />
                <View className="flex-row items-center justify-between gap-3 px-4 py-3">
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="subtext" numberOfLines={2} textStyle={{ fontWeight: "600" }}>
                            {title}
                        </AppText>
                    </View>
                    <View className="shrink-0">
                        <Badge label={resourceTypeLabel} size="sm" />
                    </View>
                </View>
            </AnimatedPressable>
        );
    }

    if (isVideoResource(resource)) {
        return (
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
                {playRequested ? (
                    <ResourceVideo videoUrl={url} />
                ) : (
                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={t("common.playVideo")}
                        haptic="selection"
                        onPress={onRequestPlay}
                        className="items-center justify-center bg-media-background"
                        style={{ height: 220 }}
                    >
                        <View className="h-14 w-14 items-center justify-center rounded-full bg-scrim-control">
                            <Play size={26} color={colors.mediaForeground} fill={colors.mediaForeground} />
                        </View>
                    </AnimatedPressable>
                )}
                <View className="flex-row items-center justify-between gap-3 px-4 py-3">
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="subtext" numberOfLines={2} textStyle={{ fontWeight: "600" }}>
                            {title}
                        </AppText>
                    </View>
                    <View className="shrink-0">
                        <Badge label={resourceTypeLabel} size="sm" />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={title}
            haptic="selection"
            className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 active:bg-surface"
            onPress={openUrl}
        >
            <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <FileText size={18} color={fileAccentColor} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }} className="gap-1">
                <AppText variant="label" numberOfLines={2}>
                    {title}
                </AppText>
                <AppText variant="caption" color="mutedForeground">
                    {resourceTypeLabel}
                </AppText>
            </View>
            <View className="shrink-0">
                <ExternalLink size={16} color={colors.mutedForeground} strokeWidth={2} />
            </View>
        </AnimatedPressable>
    );
}

function getResourceUrl(resource: SessionResourcesFilesResponse) {
    return resource.fileUrl?.trim() || resource.externalUrl?.trim() || null;
}

function isSupportedResource(resource: SessionResourcesFilesResponse) {
    return (
        isAllowedExtension(
            resource.originalFileName || resource.fileUrl || resource.externalUrl,
            RESOURCE_FILE_EXTENSIONS,
        ) ||
        isImageResource(resource) ||
        isVideoResource(resource) ||
        isAllowedMimeType(resource.mediaType, ["application/pdf"])
    );
}

function isImageResource(resource: SessionResourcesFilesResponse) {
    return (
        isAllowedMimeType(resource.mediaType, ["image/jpeg", "image/png", "image/webp"]) ||
        isAllowedExtension(
            resource.originalFileName || resource.fileUrl || resource.externalUrl,
            RESOURCE_IMAGE_EXTENSIONS,
        )
    );
}

function isVideoResource(resource: SessionResourcesFilesResponse) {
    return (
        isAllowedMimeType(resource.mediaType, ["video/mp4"]) ||
        isAllowedExtension(
            resource.originalFileName || resource.fileUrl || resource.externalUrl,
            RESOURCE_VIDEO_EXTENSIONS,
        )
    );
}

function getResourceTypeLabel(resource: SessionResourcesFilesResponse, t: (key: string) => string) {
    const extension = getFileExtension(resource.originalFileName || resource.fileUrl || resource.externalUrl);

    if (extension) {
        return extension.toUpperCase();
    }

    const mediaType = resource.mediaType?.split("/")[1];

    return mediaType?.toUpperCase() || t("common.file");
}

function getResourceExtension(resource: SessionResourcesFilesResponse) {
    return getFileExtension(resource.originalFileName || resource.fileUrl || resource.externalUrl);
}

function getFileAccentColor(resource: SessionResourcesFilesResponse, colors: ReturnType<typeof useThemeColors>) {
    const extension = getResourceExtension(resource);

    if (extension === "pdf") {
        return colors.danger;
    }

    return colors.mutedForeground;
}
