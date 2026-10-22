import { SHARE_CARD_EXPORT_HEIGHT, SHARE_CARD_EXPORT_WIDTH } from "@/components/golf/monthly-share-card-layout";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import type { TFunction } from "i18next";
import { useCallback, useRef, useState, type ComponentRef, type MutableRefObject, type RefObject } from "react";
import { Alert, Image, Linking, type View } from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";

export type ShareCardAction = "share" | "save";

type Params = {
    cardRef: RefObject<ComponentRef<typeof View> | null>;
    /** Set by the card's onReadyChange; checked again right before capture. */
    captureReadyRef: MutableRefObject<boolean>;
    canExport: boolean;
    t: TFunction;
};

export function useShareCardExport({ cardRef, captureReadyRef, canExport, t }: Params) {
    const [pendingAction, setPendingAction] = useState<ShareCardAction | null>(null);
    const busyRef = useRef(false);

    const exportCard = useCallback(async (action: ShareCardAction) => {
        if (busyRef.current || !canExport || !cardRef.current) return;

        busyRef.current = true;
        setPendingAction(action);
        let uri: string | undefined;
        let handedToShareSheet = false;
        try {
            if (action === "share" && !await Sharing.isAvailableAsync()) {
                Alert.alert(t("shareCard.share"), t("shareCard.shareUnavailable"));
                return;
            }
            // Let the loaded artwork/avatar commit before snapshotting only this canvas.
            await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            if (!captureReadyRef.current || !cardRef.current) {
                throw new Error("The card changed while preparing the capture. Please retry.");
            }
            uri = await captureRef(cardRef.current, {
                format: "png",
                quality: 1,
                width: SHARE_CARD_EXPORT_WIDTH,
                height: SHARE_CARD_EXPORT_HEIGHT,
                result: "tmpfile",
            });
            const size = await Image.getSize(uri);
            if (size.width !== SHARE_CARD_EXPORT_WIDTH || size.height !== SHARE_CARD_EXPORT_HEIGHT) {
                throw new Error(`Unexpected share-card dimensions: ${size.width} × ${size.height}`);
            }
            if (action === "share") {
                await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: t("shareCard.share") });
                handedToShareSheet = true;
                return;
            }
            // Saving a generated card only needs add/write access. Requesting full
            // library access can be denied even though the platform permits saves.
            const permission = await MediaLibrary.requestPermissionsAsync(true);
            if (!permission.granted) {
                const actions = permission.canAskAgain
                    ? [{ text: t("activity.ok") }]
                    : [
                        { text: t("common.cancel"), style: "cancel" as const },
                        { text: t("activity.openSettings"), onPress: () => void Linking.openSettings() },
                    ];
                Alert.alert(t("activity.permissionTitle"), t("activity.permissionMessage"), actions);
                return;
            }
            await MediaLibrary.Asset.create(uri);
            Alert.alert(t("activity.savedTitle"), t("activity.savedMessage"));
        } catch (error) {
            if (__DEV__) console.error("Failed to export activity card", error);
            Alert.alert(
                t(action === "share" ? "shareCard.share" : "activity.couldNotSaveTitle"),
                t(action === "share" ? "shareCard.shareFailed" : "activity.couldNotSaveMessage"),
            );
        } finally {
            busyRef.current = false;
            setPendingAction(null);
            // Android may resolve the chooser before the receiving app reads the file.
            // View-shot clears retained temporary captures when the app restarts.
            if (uri && !handedToShareSheet) releaseCapture(uri);
        }
    }, [cardRef, captureReadyRef, canExport, t]);

    return { pendingAction, isBusy: pendingAction !== null, exportCard };
}