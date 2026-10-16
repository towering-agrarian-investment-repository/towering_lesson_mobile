import {
    getNativeButtonStyle,
} from "@/design-system/utils/native-button-styles";
import { FormTextInput } from "@/components/ui/form";
import {
    CircleLoader,
    ErrorState,
    ListRow,
    Screen,
    triggerNotificationHaptic,
    useThemeColors,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import {
    useRemoveMemberProfileImage,
    useUpdateMemberProfileImage,
} from "@/lib/hook/useUploadFile";
import {
    useGetMemberProfile,
    useUpdateMemberProfile,
} from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import {
    getProfileImageMimeType,
    isAllowedExtension,
    isProfileImageContentType,
    PROFILE_IMAGE_EXTENSIONS,
    PROFILE_IMAGE_MAX_SIZE_BYTES,
    type ProfileImageContentType,
} from "@/utils/media";
import { BottomSheet, Button, Host, RNHostView, Row, Text, Spacer } from "@expo/ui";
import {
    defaultMinSize,
    fillMaxWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, ImageIcon, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { z } from "zod";
const createEditProfileSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().trim().min(1, t("profile.nameRequired")),
        nickname: z.string().trim().max(50).optional(),
    });

type EditProfileFormValues = z.infer<
    ReturnType<typeof createEditProfileSchema>
>;

export default function EditProfileScreen() {
    const {
        colors: uiColors,
        resolvedScheme: uiScheme,
        fontScale: uiFontScale,
    } = useTheme();
    const { t } = useTranslation();
    const colors = useThemeColors();
    const router = useRouter();
    const {
        data: memberResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useGetMemberProfile();
    const { mutate: updateProfile, isPending: isSubmitting } =
        useUpdateMemberProfile();
    const { mutate: uploadProfileImage, isPending: isUploadingImage } =
        useUpdateMemberProfileImage();
    const { mutate: removeProfileImage, isPending: isRemovingImage } =
        useRemoveMemberProfileImage();
    const removalLock = useRef(false);
    const isUpdatingImage = isUploadingImage || isRemovingImage;
    const [isPhotoSourceSheetVisible, setIsPhotoSourceSheetVisible] =
        useState(false);

    const member = memberResponse?.data;
    const memberId = member?.id;
    const memberName = member?.name;
    const memberNickname = member?.nickname;
    const editProfileSchema = createEditProfileSchema(t);

    const form = useForm<EditProfileFormValues>({
        defaultValues: {
            name: "",
            nickname: "",
        },
        resolver: zodResolver(editProfileSchema),
        mode: "onChange",
    });

    useEffect(() => {
        if (!memberId) {
            return;
        }

        form.reset({
            name: memberName ?? "",
            nickname: memberNickname ?? "",
        });
    }, [form, memberId, memberName, memberNickname]);

    const onSubmit = (values: EditProfileFormValues) => {
        if (!member || isSubmitting || isUpdatingImage) {
            return;
        }

        updateProfile(
            {
                name: values.name.trim(),
                nickname: values.nickname?.trim() || null,
            },
            {
                onSuccess: () => {
                    triggerNotificationHaptic(
                        Haptics.NotificationFeedbackType.Success,
                    );
                    router.dismissTo("/(app)/(tabs)/profile");
                },
            },
        );
    };

    const handleInvalidSubmit = (
        errors: FieldErrors<EditProfileFormValues>,
    ) => {
        form.setFocus(errors.name ? "name" : "nickname");
    };

    const uploadSelectedProfileImage = (
        memberId: number,
        asset: ImagePicker.ImagePickerAsset,
    ) => {
        const image = createProfileImageFromAsset(asset, t);

        uploadProfileImage(
            {
                memberId,
                imageUri: image.uri,
                contentType: image.contentType,
            },
            {
                onSuccess: () => {
                    triggerNotificationHaptic(
                        Haptics.NotificationFeedbackType.Success,
                    );
                    showAppToast({
                        message: t("profile.profileImageUpdated"),
                        type: "success",
                    });
                },
            },
        );
    };

    const handlePickProfileImageFromLibrary = async () => {
        if (!member?.id || isUpdatingImage || isSubmitting) {
            return;
        }

        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            showAppToast({
                message: t("profile.photoLibraryPermission"),
                type: "error",
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });
        setIsPhotoSourceSheetVisible(false);

        if (result.canceled || !result.assets[0]) {
            return;
        }

        try {
            uploadSelectedProfileImage(member.id, result.assets[0]);
        } catch (uploadError) {
            showAppToast({
                message:
                    uploadError instanceof Error
                        ? uploadError.message
                        : t("profile.prepareSelectedImageFailed"),
                type: "error",
            });
        }
    };

    const handleTakeProfileImage = async () => {
        if (!member?.id || isUpdatingImage || isSubmitting) {
            return;
        }

        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
            showAppToast({
                message: t("profile.cameraPermission"),
                type: "error",
            });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });
        setIsPhotoSourceSheetVisible(false);

        if (result.canceled || !result.assets[0]) {
            return;
        }

        try {
            uploadSelectedProfileImage(member.id, result.assets[0]);
        } catch (uploadError) {
            showAppToast({
                message:
                    uploadError instanceof Error
                        ? uploadError.message
                        : t("profile.prepareCapturedImageFailed"),
                type: "error",
            });
        }
    };

    const handleChangeProfileImage = () => {
        if (!member?.id || isUpdatingImage || isSubmitting) {
            return;
        }

        setIsPhotoSourceSheetVisible(true);
    };

    const closePhotoSourceSheet = () => {
        setIsPhotoSourceSheetVisible(false);
    };

    const handleRemoveProfileImage = () => {
        if (
            !member?.profileImage ||
            isUpdatingImage ||
            isSubmitting ||
            removalLock.current
        ) {
            return;
        }

        removalLock.current = true;
        setIsPhotoSourceSheetVisible(false);
        removeProfileImage(member.id, {
            onSuccess: () => {
                triggerNotificationHaptic(
                    Haptics.NotificationFeedbackType.Success,
                );
                showAppToast({
                    message: t("profile.profileImageRemoved"),
                    type: "success",
                });
            },
            onSettled: () => {
                removalLock.current = false;
            },
        });
    };

    if (isLoading) {
        return <CircleLoader fullScreen label={t("home.loadingProfile")} />;
    }

    if (isError || !member) {
        return (
            <ErrorState
                title={t("home.couldNotLoadProfile")}
                message={t("home.checkConnection")}
                actionLabel={
                    isRefetching
                        ? t("common.refreshing")
                        : t("common.refreshTryAgain")
                }
                onAction={() => {
                    void refetch();
                }}
            />
        );
    }

    return (
        <Screen
            maxWidth={640}
            keyboardAware
            footer={
                <View className="pb-8 pt-4">
                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        style={{ width: "100%" }}
                        accessibilityLabel={
                            isSubmitting
                                ? t("profile.saving")
                                : t("profile.saveChanges")
                        }
                        accessibilityState={{
                            disabled:
                                isSubmitting ||
                                isUpdatingImage ||
                                !form.formState.isDirty ||
                                isSubmitting,
                            busy: isSubmitting,
                        }}
                    >
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
                            disabled={
                                isSubmitting ||
                                isUpdatingImage ||
                                !form.formState.isDirty ||
                                isSubmitting
                            }
                            onPress={form.handleSubmit(
                                onSubmit,
                                handleInvalidSubmit,
                            )}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "filled",
                                    isSubmitting ||
                                    isUpdatingImage ||
                                    !form.formState.isDirty ||
                                    isSubmitting,
                                    uiColors.primary,
                                ), ...{ borderRadius: 12 }
                            }}
                        >
                            <Row
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                spacing={8}
                                alignment="center"
                            >
                                <Spacer flexible />
                                {isSubmitting ? (
                                    <RNHostView matchContents>
                                        <ActivityIndicator
                                            color={uiColors.primaryForeground}
                                        />
                                    </RNHostView>
                                ) : null}
                                <Text
                                    textStyle={{
                                        textAlign: "center",
                                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                        fontWeight: "600",
                                        color: uiColors.primaryForeground,
                                        fontSize:
                                            typography.label.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {isSubmitting
                                        ? t("profile.saving")
                                        : t("profile.saveChanges")}
                                </Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                    </Host>
                </View>
            }
        >
            <BottomSheet
                isPresented={isPhotoSourceSheetVisible}
                onDismiss={closePhotoSourceSheet}
                containerColor={colors.card}
                contentColor={colors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <RNHostView matchContents={{ vertical: true }}>
                    <View className="gap-4">
                        <View className="gap-1">
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text textStyle={{ ...typography.h3, lineHeight: typography.h3.lineHeight * uiFontScale, color: colors.foreground, fontSize: typography.h3.fontSize * uiFontScale }} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {t("profile.changeProfilePhoto")}
                                </Text>
                            </Host>
                            <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                                <Text textStyle={{ ...typography.muted, lineHeight: typography.muted.lineHeight * uiFontScale, color: colors.mutedForeground, fontSize: typography.muted.fontSize * uiFontScale }} modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                                    {t("profile.changeProfilePhotoDescription")}
                                </Text>
                            </Host>
                        </View>
                        <View className="gap-3">
                            <ListRow
                                title={t("profile.takePhoto")}
                                subtitle={t("profile.useCamera")}
                                titleStyle={{ fontWeight: "500" }}
                                leading={<View className="h-11 w-11 items-center justify-center rounded-full bg-muted"><Camera size={22} color={colors.foreground} /></View>}
                                showChevron={false}
                                className="bg-surface"
                                disabled={isUpdatingImage || isSubmitting}
                                onPress={() => { void handleTakeProfileImage(); }}
                            />
                            <ListRow
                                title={t("profile.chooseFromLibrary")}
                                subtitle={t("profile.selectExistingPhoto")}
                                titleStyle={{ fontWeight: "500" }}
                                leading={<View className="h-11 w-11 items-center justify-center rounded-full bg-muted"><ImageIcon size={22} color={colors.foreground} /></View>}
                                showChevron={false}
                                className="bg-surface"
                                disabled={isUpdatingImage || isSubmitting}
                                onPress={() => { void handlePickProfileImageFromLibrary(); }}
                            />
                            {member.profileImage ? (
                                <ListRow
                                    title={t("profile.removePhoto")}
                                    titleStyle={{ fontWeight: "500" }}
                                    leading={<View className="h-11 w-11 items-center justify-center rounded-full bg-muted"><Trash2 size={22} color={colors.danger} /></View>}
                                    showChevron={false}
                                    className="bg-surface"
                                    disabled={isUpdatingImage || isSubmitting}
                                    onPress={handleRemoveProfileImage}
                                />
                            ) : null}
                        </View>
                        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" colorScheme={uiScheme} style={{ width: "100%" }}>
                            <Button
                                variant="text"
                                onPress={closePhotoSourceSheet}
                                style={getNativeButtonStyle(colors, "text")}
                                modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })]}
                            >
                                <Text
                                    modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, minHeight: 48 })] : [fillMaxWidth()]}
                                    textStyle={{ ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale, fontSize: typography.label.fontSize * uiFontScale, color: colors.foreground, textAlign: "center" }}
                                >
                                    {t("common.cancel")}
                                </Text>
                            </Button>
                        </Host>
                    </View>
                </RNHostView>
            </BottomSheet>

            <View className="gap-8">
                <View className="w-full items-center gap-4">
                    <ProfileImagePreview
                        name={member.name}
                        imageUrl={member.profileImage}
                    />

                    <Host
                        matchContents={{ vertical: true }}
                        ignoreSafeArea="all"
                        colorScheme={uiScheme}
                        seedColor={uiColors.primary}
                        style={{ width: "100%" }}
                        accessibilityLabel={
                            isRemovingImage
                                ? t("profile.removingPhoto")
                                : isUploadingImage
                                    ? t("profile.uploading")
                                    : t("profile.changePhoto")
                        }
                        accessibilityState={{
                            disabled:
                                isUpdatingImage ||
                                isSubmitting ||
                                isUpdatingImage,
                            busy: isUpdatingImage,
                        }}
                    >
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
                            disabled={
                                isUpdatingImage ||
                                isSubmitting ||
                                isUpdatingImage
                            }
                            onPress={() => {
                                handleChangeProfileImage();
                            }}
                            style={{
                                ...getNativeButtonStyle(
                                    uiColors,
                                    "outlined",
                                    isUpdatingImage ||
                                    isSubmitting ||
                                    isUpdatingImage,
                                    uiColors.primary,
                                ), ...{ borderRadius: 12 }
                            }}
                        >
                            <Row
                                modifiers={
                                    process.env.EXPO_OS === "ios"
                                        ? [frame({ maxWidth: Infinity, minHeight: 48 })]
                                        : [fillMaxWidth()]
                                }
                                spacing={8}
                                alignment="center"
                            >
                                <Spacer flexible />
                                {isUpdatingImage ? (
                                    <RNHostView matchContents>
                                        <ActivityIndicator
                                            color={uiColors.foreground}
                                        />
                                    </RNHostView>
                                ) : null}
                                <Text
                                    textStyle={{
                                        textAlign: "center",
                                        ...typography.label, lineHeight: typography.label.lineHeight * uiFontScale,
                                        fontWeight: "600",
                                        color: uiColors.foreground,
                                        fontSize:
                                            typography.label.fontSize *
                                            uiFontScale,
                                    }}
                                >
                                    {isRemovingImage
                                        ? t("profile.removingPhoto")
                                        : isUploadingImage
                                            ? t("profile.uploading")
                                            : t("profile.changePhoto")}
                                </Text>
                                <Spacer flexible />
                            </Row>
                        </Button>
                    </Host>
                </View>

                <View className="gap-6">
                    <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
                        <Text
                            textStyle={{
                                ...typography.body, lineHeight: typography.h3.lineHeight * uiFontScale,
                                fontSize: typography.subtitle.fontSize * uiFontScale,
                                fontWeight: "600" as const,
                                color: uiColors.foreground,
                            }}
                            modifiers={process.env.EXPO_OS === "ios" ? [frame({ maxWidth: Infinity, alignment: "leading" })] : [fillMaxWidth()]}>
                            {t("profile.basicInformation")}
                        </Text>
                    </Host>

                    <FormTextInput
                        control={form.control}
                        name="name"
                        label={t("profile.fullName")}
                        placeholder={t("profile.fullNamePlaceholder")}
                        autoComplete="name"
                    />

                    <FormTextInput
                        control={form.control}
                        name="nickname"
                        label={t("profile.nickname", {
                            defaultValue: "Nickname",
                        })}
                        placeholder={t("profile.nicknamePlaceholder", {
                            defaultValue: "Enter a nickname",
                        })}
                        autoComplete="nickname"
                    />
                </View>
            </View>
        </Screen>
    );
}

function createProfileImageFromAsset(
    asset: ImagePicker.ImagePickerAsset,
    t: (key: string) => string,
): { uri: string; contentType: ProfileImageContentType } {
    if (
        typeof asset.fileSize === "number" &&
        asset.fileSize > PROFILE_IMAGE_MAX_SIZE_BYTES
    ) {
        throw new Error(t("profile.profileImageTooLarge"));
    }

    const rawName =
        asset.fileName ?? asset.uri.split("/").pop() ?? "profile-image.jpg";
    const extension = rawName.split(".").pop()?.toLowerCase() ?? "jpg";
    const hasSupportedExtension = isAllowedExtension(
        rawName,
        PROFILE_IMAGE_EXTENSIONS,
    );
    const normalizedMimeType = asset.mimeType?.toLowerCase();
    const hasSupportedMimeType = isProfileImageContentType(normalizedMimeType);

    if (
        (normalizedMimeType && !hasSupportedMimeType) ||
        (!normalizedMimeType && !hasSupportedExtension)
    ) {
        throw new Error(t("profile.onlyImageTypesSupported"));
    }

    const contentType = hasSupportedMimeType
        ? normalizedMimeType
        : getProfileImageMimeType(extension);

    if (!contentType) {
        throw new Error(t("profile.onlyImageTypesSupported"));
    }

    return {
        uri: asset.uri,
        contentType,
    };
}

function ProfileImagePreview({
    name,
    imageUrl,
}: {
    name?: string | null;
    imageUrl?: string | null;
}) {
    const { colors: uiColors, fontScale: uiFontScale } = useTheme();
    if (imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                style={{
                    width: 112,
                    height: 112,
                    borderRadius: 999,
                }}
                contentFit="cover"
            />
        );
    }

    return (
        <View className="h-28 w-28 items-center justify-center rounded-full bg-primary">
            <Host matchContents ignoreSafeArea="all">
                <Text
                    textStyle={{
                        ...typography.h1, lineHeight: typography.h1.lineHeight * uiFontScale,
                        color: uiColors.primaryForeground,
                        fontSize: typography.h1.fontSize * uiFontScale,
                    }}
                >
                    {name?.charAt(0).toUpperCase() || "?"}
                </Text>
            </Host>
        </View>
    );
}
