import { ActionButton, ListRow } from "@/design-system";
import { AppText } from "@/design-system/components/AppText";
import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { useTheme } from "@/design-system/utils/theme";
import { RNHostView } from "@expo/ui";
import { FolderOpen, Image as ImageIcon, Video } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function HomeworkSourceSheet({
    isPresented,
    isSubmitting,
    isPicking,
    isDraftEditingDisabled,
    onDismiss,
    onPickFromLibrary,
    onRecordVideo,
    onPickFile,
}: {
    isPresented: boolean;
    isSubmitting: boolean;
    isPicking: boolean;
    isDraftEditingDisabled: boolean;
    onDismiss: () => void;
    onPickFromLibrary: () => Promise<void>;
    onRecordVideo: () => Promise<void>;
    onPickFile: () => Promise<void>;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <PendingBottomSheet
            isPresented={isPresented}
            onDismiss={onDismiss}
            dismissDisabled={isSubmitting || isPicking}
            containerColor={colors.card}
            contentColor={colors.foreground}
            contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
        >
            <RNHostView matchContents={{ vertical: true }}>
                <View className="gap-4">
                    <View className="gap-1">
                        <AppText variant="h3">{t("homework.chooseFile")}</AppText>
                        <AppText variant="body" color="mutedForeground">
                            {t("homework.uploadHint")}
                        </AppText>
                    </View>
                    <View className="gap-3">
                        <ListRow
                            title={t("homework.fromLibrary")}
                            titleStyle={{ fontWeight: "600" }}
                            leading={
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <ImageIcon size={22} color={colors.foreground} />
                                </View>
                            }
                            showChevron={false}
                            className="bg-surface"
                            disabled={isDraftEditingDisabled || isPicking}
                            onPress={() => {
                                void onPickFromLibrary();
                            }}
                        />
                        <ListRow
                            title={t("homework.recordVideo")}
                            titleStyle={{ fontWeight: "600" }}
                            leading={
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <Video size={22} color={colors.foreground} />
                                </View>
                            }
                            showChevron={false}
                            className="bg-surface"
                            disabled={isDraftEditingDisabled || isPicking}
                            onPress={() => {
                                void onRecordVideo();
                            }}
                        />
                        <ListRow
                            title={t("homework.browseFiles")}
                            titleStyle={{ fontWeight: "600" }}
                            leading={
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                    <FolderOpen size={22} color={colors.foreground} />
                                </View>
                            }
                            showChevron={false}
                            className="bg-surface"
                            disabled={isDraftEditingDisabled || isPicking}
                            onPress={() => {
                                void onPickFile();
                            }}
                        />
                    </View>
                    <ActionButton
                        label={t("common.cancel")}
                        appearance="text"
                        disabled={isPicking}
                        onPress={onDismiss}
                    />
                </View>
            </RNHostView>
        </PendingBottomSheet>
    );
}
