import {
    AppText,
    Card,
    getPressedScaleStyle,
    InlineState,
    ListRow,
    useThemeColors,
} from "@/design-system";
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
import { useVideoPlayer, VideoView } from "expo-video";
import { FileText } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, View } from "react-native";

type SessionResourceSectionProps = {
    resources: SessionResourcesFilesResponse[];
};

const VIDEO_BACKGROUND_COLOR = "#000";

function ResourceVideo({ videoUrl }: { videoUrl: string }) {
    const { t } = useTranslation();
    const player = useVideoPlayer(videoUrl, (videoPlayer) => {
        videoPlayer.loop = false;
    });

    const { status } = useEvent(player, "statusChange", {
        status: player.status,
    });

    return (
        <View className="gap-2">
            <View className="overflow-hidden rounded-2xl border border-border bg-black">
                <VideoView
                    player={player}
                    nativeControls
                    fullscreenOptions={{ enable: true }}
                    contentFit="contain"
                    style={{ width: "100%", height: 240, backgroundColor: VIDEO_BACKGROUND_COLOR }}
                />
            </View>

            {status === "error" ? (
                <AppText variant="caption" className="leading-5 text-danger">
                    {t("sessionResources.videoFailedToLoad")}
                </AppText>
            ) : null}
        </View>
    );
}

export function SessionResourceSection({
    resources,
}: SessionResourceSectionProps) {
    const { t } = useTranslation();
    if (resources.length === 0) {
        return (
            <InlineState
                title={t("sessionResources.noResources")}
            />
        );
    }

    return (
        <View className="gap-4">
            {resources.map((resource, index) => (
                <SessionResourceItem
                    key={`resource-${resource.id ?? resource.fileUrl ?? resource.externalUrl ?? resource.originalFileName ?? index}`}
                    resource={resource}
                />
            ))}
        </View>
    );
}

function SessionResourceItem({
    resource,
}: {
    resource: SessionResourcesFilesResponse;
}) {
    const { t } = useTranslation();
    const colors = useThemeColors();
    const url = getResourceUrl(resource);
    const title = resource.originalFileName?.trim()
        || t("sessionResources.resourceFallback", { id: resource.id });
    const resourceTypeLabel = getResourceTypeLabel(resource, t);
    const fileAccentColor = getFileAccentColor(resource, colors);

    if (!url || !isSupportedResource(resource)) {
        return (
            <ListRow
                title={title}
                meta={<BadgePill label={resourceTypeLabel} />}
                leading={
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                        <FileText size={18} color={colors.mutedForeground} />
                    </View>
                }
                className="border-border bg-card px-4 py-3.5"
                titleClassName="font-medium leading-6"
                showChevron={false}
            />
        );
    }

    if (isImageResource(resource)) {
        return (
            <Card className="overflow-hidden p-0">
                <Pressable
                    accessibilityRole="imagebutton"
                    accessibilityLabel={t("sessionResources.openImage", { title })}
                    className="relative overflow-hidden"
                    style={({ pressed }) => getPressedScaleStyle(pressed, false, 0.992)}
                    onPress={() => {
                        void Linking.openURL(url);
                    }}
                >
                    <Image
                        source={{ uri: url }}
                        contentFit="cover"
                        style={{ width: "100%", height: 220 }}
                    />
                    <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 bg-black/45 px-4 py-3">
                        <AppText
                            variant="caption"
                            className="min-w-0 flex-1 font-medium text-white"
                            numberOfLines={1}
                        >
                            {title}
                        </AppText>
                        <AppText
                            variant="caption"
                            className="shrink-0 rounded-full bg-black/55 px-2.5 py-1 font-medium text-white"
                            numberOfLines={1}
                        >
                            {resourceTypeLabel}
                        </AppText>
                    </View>
                </Pressable>
            </Card>
        );
    }

    if (isVideoResource(resource)) {
        return (
            <View className="gap-3">
                <View className="flex-row items-start justify-between gap-3">
                    <AppText
                        variant="label"
                        className="min-w-0 flex-1"
                        numberOfLines={2}
                    >
                        {title}
                    </AppText>
                    <BadgePill label={resourceTypeLabel} />
                </View>
                <ResourceVideo videoUrl={url} />
            </View>
        );
    }

    return (
        <ListRow
            title={title}
            meta={<BadgePill label={resourceTypeLabel} />}
            leading={
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <FileText size={18} color={fileAccentColor} />
                </View>
            }
            className="border-border bg-card px-4 py-3.5"
            titleClassName="font-medium leading-6"
            showChevron={Boolean(url)}
            onPress={() => {
                if (url) {
                    void Linking.openURL(url);
                }
            }}
        />
    );
}

function getResourceUrl(resource: SessionResourcesFilesResponse) {
    return resource.fileUrl?.trim() || resource.externalUrl?.trim() || null;
}

function isSupportedResource(resource: SessionResourcesFilesResponse) {
    return isAllowedExtension(
        resource.originalFileName || resource.fileUrl || resource.externalUrl,
        RESOURCE_FILE_EXTENSIONS,
    );
}

function isImageResource(resource: SessionResourcesFilesResponse) {
    return isAllowedMimeType(resource.mediaType, ["image/jpeg", "image/png", "image/webp"])
        || isAllowedExtension(
            resource.originalFileName || resource.fileUrl || resource.externalUrl,
            RESOURCE_IMAGE_EXTENSIONS,
        );
}

function isVideoResource(resource: SessionResourcesFilesResponse) {
    return isAllowedMimeType(resource.mediaType, ["video/mp4"])
        || isAllowedExtension(
            resource.originalFileName || resource.fileUrl || resource.externalUrl,
            RESOURCE_VIDEO_EXTENSIONS,
        );
}

function getResourceTypeLabel(
    resource: SessionResourcesFilesResponse,
    t: (key: string) => string,
) {
    const extension = getFileExtension(
        resource.originalFileName || resource.fileUrl || resource.externalUrl,
    );

    if (extension) {
        return extension.toUpperCase();
    }

    const mediaType = resource.mediaType?.split("/")[1];

    return mediaType?.toUpperCase() || t("common.file");
}

function getResourceExtension(resource: SessionResourcesFilesResponse) {
    return getFileExtension(
        resource.originalFileName || resource.fileUrl || resource.externalUrl,
    );
}

function getFileAccentColor(
    resource: SessionResourcesFilesResponse,
    colors: ReturnType<typeof useThemeColors>,
) {
    const extension = getResourceExtension(resource);

    if (extension === "pdf") {
        return colors.danger;
    }

    return colors.mutedForeground;
}

function BadgePill({ label }: { label: string }) {
    return (
        <View className="self-start rounded-full bg-muted px-2.5 py-1">
            <AppText
                variant="caption"
                className="font-medium text-muted-foreground"
                numberOfLines={1}
            >
                {label}
            </AppText>
        </View>
    );
}
