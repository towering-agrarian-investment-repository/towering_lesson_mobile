import { AppText } from "@/design-system/components/AppText";
import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { FormTextInput } from "@/components/ui/form";
import {
    ActionButton,
    cn,
    ErrorState,
    AnimatedPressable,
    ListRow,
    Screen,
    Skeleton,
    triggerSuccessHaptic,
} from "@/design-system";
import { useTheme } from "@/design-system/utils/theme";
import { typography } from "@/design-system/utils/typography";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useRemoveMemberProfileImage, useUpdateMemberProfileImage } from "@/lib/hook/useUploadFile";
import { useGetMemberProfile, useUpdateMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/design-system/components/AppToast";
import {
    getProfileImageMimeType,
    isAllowedExtension,
    isProfileImageContentType,
    PROFILE_IMAGE_EXTENSIONS,
    PROFILE_IMAGE_MAX_SIZE_BYTES,
    type ProfileImageContentType,
} from "@/utils/media";
import { RNHostView } from "@expo/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { usePreventRemove, useRouter } from "expo-router";
import Camera from "lucide-react-native/icons/camera";
import ImageIcon from "lucide-react-native/icons/image";
import Trash2 from "lucide-react-native/icons/trash-2";
import { useEffect, useRef, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Keyboard, Linking, RefreshControl, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { z } from "zod";

const createEditProfileSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().trim().min(1, t("profile.nameRequired")),
        nickname: z.string().trim().max(50, t("profile.nicknameMaxLength")).optional(),
    });

type EditProfileFormValues = z.infer<ReturnType<typeof createEditProfileSchema>>;

function showPermissionSettingsAlert(t: (key: string) => string, message: string) {
    Alert.alert(t("common.permissionTitle"), message, [
        { text: t("common.cancel"), style: "cancel" },
        {
            text: t("common.openSettings"),
            onPress: () => {
                void Linking.openSettings();
            },
        },
    ]);
}

export default function EditProfileScreen() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { data: memberResponse, isLoading, refetch, isRefetching } = useGetMemberProfile();
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        refetch({ cancelRefetch: false }),
    );
    const { mutate: updateProfile, isPending: isSubmitting } = useUpdateMemberProfile();
    const { mutate: uploadProfileImage, isPending: isUploadingImage } = useUpdateMemberProfileImage();
    const { mutate: removeProfileImage, isPending: isRemovingImage } = useRemoveMemberProfileImage();
    const removalLock = useRef(false);
    const pickingImage = useRef(false);
    const submitting = useRef(false);
    const initializedMemberId = useRef<number | null>(null);
    const [isPickingImage, setIsPickingImage] = useState(false);
    const isUpdatingImage = isPickingImage || isUploadingImage || isRemovingImage;
    const [isPhotoSourceSheetVisible, setIsPhotoSourceSheetVisible] = useState(false);
    const [isConfirmingRemovePhoto, setIsConfirmingRemovePhoto] = useState(false);

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
        mode: "onTouched",
    });
    const isSaveDisabled = isSubmitting || isUpdatingImage || !form.formState.isDirty;

    const [isSaved, setIsSaved] = useState(false);
    const [isDiscardSheetVisible, setIsDiscardSheetVisible] = useState(false);
    const discardNavigation = useRef<(() => void) | null>(null);
    usePreventRemove(form.formState.isDirty && !isSubmitting && !isUpdatingImage && !isSaved, ({ repeat }) => {
        if (discardNavigation.current) return;
        discardNavigation.current = repeat;
        Keyboard.dismiss();
        setIsDiscardSheetVisible(true);
    });

    const closeDiscardSheet = () => {
        discardNavigation.current = null;
        setIsDiscardSheetVisible(false);
    };

    const confirmDiscard = () => {
        const repeat = discardNavigation.current;
        if (!repeat) return;

        closeDiscardSheet();
        form.reset();
        repeat();
    };

    useEffect(() => {
        if (isSaved) {
            router.dismissTo("/(app)/(tabs)/profile");
        }
    }, [isSaved, router]);

    useEffect(() => {
        if (!memberId || initializedMemberId.current === memberId) {
            return;
        }

        initializedMemberId.current = memberId;
        form.reset({
            name: memberName ?? "",
            nickname: memberNickname ?? "",
        });
    }, [form, memberId, memberName, memberNickname]);

    const onSubmit = (values: EditProfileFormValues) => {
        if (!member || submitting.current || isSubmitting || isUpdatingImage) {
            return;
        }

        submitting.current = true;
        updateProfile(
            {
                name: values.name.trim(),
                nickname: values.nickname?.trim() || null,
            },
            {
                onSuccess: () => {
                    triggerSuccessHaptic();
                    setIsSaved(true);
                },
                onSettled: () => {
                    submitting.current = false;
                },
            },
        );
    };

    const handleInvalidSubmit = (errors: FieldErrors<EditProfileFormValues>) => {
        form.setFocus(errors.name ? "name" : "nickname");
    };

    const submitEditProfile = () => {
        if (isSaveDisabled || submitting.current) {
            return;
        }

        void form.handleSubmit(onSubmit, handleInvalidSubmit)();
    };

    const uploadSelectedProfileImage = (memberId: number, asset: ImagePicker.ImagePickerAsset) => {
        const image = createProfileImageFromAsset(asset, t);

        uploadProfileImage(
            {
                memberId,
                imageUri: image.uri,
                contentType: image.contentType,
            },
            {
                onSuccess: () => {
                    triggerSuccessHaptic();
                    showAppToast({
                        message: t("profile.profileImageUpdated"),
                        type: "success",
                    });
                },
            },
        );
    };

    const handlePickProfileImageFromLibrary = async () => {
        if (!member?.id || pickingImage.current || isUpdatingImage || isSubmitting) {
            return;
        }

        pickingImage.current = true;
        setIsPickingImage(true);
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showPermissionSettingsAlert(t, t("profile.photosPermission"));
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

            uploadSelectedProfileImage(member.id, result.assets[0]);
        } catch (uploadError) {
            showAppToast({
                message:
                    uploadError instanceof ProfileImageValidationError
                        ? uploadError.message
                        : t("profile.prepareSelectedImageFailed"),
                type: "error",
            });
        } finally {
            pickingImage.current = false;
            setIsPickingImage(false);
        }
    };

    const handleTakeProfileImage = async () => {
        if (!member?.id || pickingImage.current || isUpdatingImage || isSubmitting) {
            return;
        }

        pickingImage.current = true;
        setIsPickingImage(true);
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();

            if (!permission.granted) {
                showPermissionSettingsAlert(t, t("profile.cameraPermission"));
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

            uploadSelectedProfileImage(member.id, result.assets[0]);
        } catch (uploadError) {
            showAppToast({
                message:
                    uploadError instanceof ProfileImageValidationError
                        ? uploadError.message
                        : t("profile.prepareCapturedImageFailed"),
                type: "error",
            });
        } finally {
            pickingImage.current = false;
            setIsPickingImage(false);
        }
    };

    const handleChangeProfileImage = () => {
        if (!member?.id || isUpdatingImage || isSubmitting) {
            return;
        }

        setIsConfirmingRemovePhoto(false);
        setIsPhotoSourceSheetVisible(true);
    };

    const closePhotoSourceSheet = () => {
        if (pickingImage.current || removalLock.current || isUpdatingImage) return;
        setIsPhotoSourceSheetVisible(false);
        setIsConfirmingRemovePhoto(false);
    };

    const handleRemoveProfileImage = () => {
        if (!member?.profileImage || isUpdatingImage || isSubmitting || removalLock.current) {
            return;
        }

        removalLock.current = true;
        removeProfileImage(member.id, {
            onSuccess: () => {
                setIsConfirmingRemovePhoto(false);
                setIsPhotoSourceSheetVisible(false);
                triggerSuccessHaptic();
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
        return (
            <Screen contentClassName="gap-6">
                <View className="items-center gap-3 py-2">
                    <Skeleton className="h-28 w-28 rounded-full" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                </View>
                <View className="gap-4">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </View>
            </Screen>
        );
    }

    if (!member) {
        return (
            <Screen
                contentClassName="grow"
                bottomPadding={16}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <ErrorState
                    title={t("home.couldNotLoadProfile")}
                    message={t("home.checkConnection")}
                    actionLabel={isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")}
                    actionPending={isRefetching || isPullRefreshing}
                    onAction={handlePullRefresh}
                />
            </Screen>
        );
    }

    const photoActionLabel = isRemovingImage
        ? t("profile.removingPhoto")
        : isUploadingImage
          ? t("profile.uploading")
          : t("profile.changePhoto");
    const isPhotoActionDisabled = isUpdatingImage || isSubmitting;

    return (
        <>
            <PendingBottomSheet
                isPresented={isDiscardSheetVisible}
                onDismiss={closeDiscardSheet}
                dismissDisabled={false}
                containerColor={colors.card}
                contentColor={colors.foreground}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <RNHostView matchContents={{ vertical: true }}>
                    <View className="gap-5">
                        <View className="gap-2">
                            <AppText variant="h3" color="danger">
                                {t("common.unsavedChangesTitle")}
                            </AppText>
                            <AppText variant="body" color="mutedForeground">
                                {t("common.unsavedChangesMessage")}
                            </AppText>
                        </View>
                        <View className="gap-3">
                            <ActionButton
                                label={t("common.discardChanges")}
                                tone="danger"
                                haptic="impact"
                                onPress={confirmDiscard}
                            />
                            <ActionButton label={t("common.cancel")} appearance="text" onPress={closeDiscardSheet} />
                        </View>
                    </View>
                </RNHostView>
            </PendingBottomSheet>

            <PendingBottomSheet
                isPresented={isPhotoSourceSheetVisible}
                onDismiss={closePhotoSourceSheet}
                dismissDisabled={isUpdatingImage}
                containerColor={colors.card}
                contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
            >
                <RNHostView matchContents={{ vertical: true }}>
                    {isConfirmingRemovePhoto ? (
                        <View className="gap-5">
                            <View className="gap-2">
                                <AppText variant="h3" color="danger">
                                    {t("profile.removePhoto")}
                                </AppText>
                                <AppText variant="body" color="mutedForeground">
                                    {t("profile.removePhotoConfirmMessage")}
                                </AppText>
                            </View>
                            <View className="gap-3">
                                <ActionButton
                                    label={isRemovingImage ? t("profile.removingPhoto") : t("profile.removePhoto")}
                                    tone="danger"
                                    disabled={isRemovingImage}
                                    loading={isRemovingImage}
                                    haptic="impact"
                                    onPress={handleRemoveProfileImage}
                                />
                                <ActionButton
                                    label={t("common.cancel")}
                                    appearance="text"
                                    disabled={isRemovingImage}
                                    onPress={closePhotoSourceSheet}
                                />
                            </View>
                        </View>
                    ) : (
                        <View className="gap-4">
                            <View className="gap-1">
                                <AppText variant="h3">{t("profile.changeProfilePhoto")}</AppText>
                                <AppText variant="body" color="mutedForeground">
                                    {t("profile.changeProfilePhotoDescription")}
                                </AppText>
                            </View>
                            <View className="gap-3">
                                <ListRow
                                    title={t("profile.takePhoto")}
                                    subtitle={t("profile.useCamera")}
                                    titleStyle={{ fontWeight: "600" }}
                                    leading={
                                        <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                            <Camera size={22} color={colors.foreground} />
                                        </View>
                                    }
                                    showChevron={false}
                                    className="bg-surface"
                                    disabled={isUpdatingImage || isSubmitting}
                                    onPress={() => {
                                        void handleTakeProfileImage();
                                    }}
                                />
                                <ListRow
                                    title={t("profile.chooseFromLibrary")}
                                    subtitle={t("profile.selectExistingPhoto")}
                                    titleStyle={{ fontWeight: "600" }}
                                    leading={
                                        <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                            <ImageIcon size={22} color={colors.foreground} />
                                        </View>
                                    }
                                    showChevron={false}
                                    className="bg-surface"
                                    disabled={isUpdatingImage || isSubmitting}
                                    onPress={() => {
                                        void handlePickProfileImageFromLibrary();
                                    }}
                                />
                                {member.profileImage ? (
                                    <ListRow
                                        title={isRemovingImage ? t("profile.removingPhoto") : t("profile.removePhoto")}
                                        titleStyle={{ fontWeight: "600" }}
                                        leading={
                                            <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                                                <Trash2 size={22} color={colors.danger} />
                                            </View>
                                        }
                                        trailing={
                                            isRemovingImage ? (
                                                <ActivityIndicator size="small" color={colors.danger} />
                                            ) : undefined
                                        }
                                        showChevron={false}
                                        className="bg-surface"
                                        disabled={isUpdatingImage || isSubmitting}
                                        onPress={() => {
                                            setIsConfirmingRemovePhoto(true);
                                        }}
                                    />
                                ) : null}
                            </View>
                            <ActionButton
                                label={t("common.cancel")}
                                appearance="text"
                                disabled={isUpdatingImage}
                                onPress={closePhotoSourceSheet}
                            />
                        </View>
                    )}
                </RNHostView>
            </PendingBottomSheet>

            <Screen
                keyboardAware
                keyboardScrollMode="layout"
                footer={
                    <ActionButton
                        label={isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
                        disabled={isSaveDisabled}
                        keepBackgroundWhenDisabled
                        loading={isSubmitting}
                        haptic="selection"
                        onPress={submitEditProfile}
                    />
                }
            >
                <View className="gap-6">
                    <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={photoActionLabel}
                        accessibilityState={{
                            disabled: isPhotoActionDisabled,
                            busy: isUpdatingImage,
                        }}
                        disabled={isPhotoActionDisabled}
                        hitSlop={8}
                        className={cn("items-center gap-2.5 self-center", isSubmitting && "opacity-60")}
                        onPress={handleChangeProfileImage}
                    >
                        <View className="h-24 w-24">
                            <View className="h-24 w-24 overflow-hidden rounded-full bg-muted">
                                <ProfileImagePreview name={member.name} imageUrl={member.profileImage} />

                                {isUpdatingImage ? (
                                    <View className="absolute inset-0 items-center justify-center bg-scrim">
                                        <ActivityIndicator color={colors.primaryForeground} />
                                    </View>
                                ) : null}
                            </View>

                            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary">
                                <Camera size={15} color={colors.primaryForeground} />
                            </View>
                        </View>

                        <AppText variant="subtext" color="primary" wrap={false}>
                            {photoActionLabel}
                        </AppText>
                    </AnimatedPressable>

                    <View className="gap-5">
                        <AppText
                            variant="body"
                            textStyle={{
                                lineHeight: typography.h3.lineHeight,
                                fontSize: typography.subtitle.fontSize,
                                fontWeight: "600" as const,
                            }}
                        >
                            {t("profile.basicInformation")}
                        </AppText>

                        <FormTextInput
                            control={form.control}
                            name="name"
                            label={t("profile.fullName")}
                            placeholder={t("profile.fullNamePlaceholder")}
                            autoCapitalize="words"
                            autoComplete="name"
                            returnKeyType="next"
                            onSubmitEditing={() => form.setFocus("nickname")}
                            editable={!isSubmitting && !isUpdatingImage}
                        />

                        <FormTextInput
                            control={form.control}
                            name="nickname"
                            label={t("profile.nickname")}
                            placeholder={t("profile.nicknamePlaceholder")}
                            autoCapitalize="words"
                            autoComplete="nickname"
                            returnKeyType="done"
                            maxLength={50}
                            showCharacterCount
                            onSubmitEditing={submitEditProfile}
                            editable={!isSubmitting && !isUpdatingImage}
                        />
                    </View>
                </View>
            </Screen>
        </>
    );
}

class ProfileImageValidationError extends Error {}

function createProfileImageFromAsset(
    asset: ImagePicker.ImagePickerAsset,
    t: (key: string) => string,
): { uri: string; contentType: ProfileImageContentType } {
    if (typeof asset.fileSize === "number" && asset.fileSize > PROFILE_IMAGE_MAX_SIZE_BYTES) {
        throw new ProfileImageValidationError(t("profile.profileImageTooLarge"));
    }

    const rawName = asset.fileName ?? asset.uri.split("/").pop() ?? "profile-image.jpg";
    const extension = rawName.split(".").pop()?.toLowerCase() ?? "jpg";
    const hasSupportedExtension = isAllowedExtension(rawName, PROFILE_IMAGE_EXTENSIONS);
    const normalizedMimeType = asset.mimeType?.toLowerCase();
    const hasSupportedMimeType = isProfileImageContentType(normalizedMimeType);

    if ((normalizedMimeType && !hasSupportedMimeType) || (!normalizedMimeType && !hasSupportedExtension)) {
        throw new ProfileImageValidationError(t("profile.onlyImageTypesSupported"));
    }

    const contentType = hasSupportedMimeType ? normalizedMimeType : getProfileImageMimeType(extension);

    if (!contentType) {
        throw new ProfileImageValidationError(t("profile.onlyImageTypesSupported"));
    }

    return {
        uri: asset.uri,
        contentType,
    };
}

function ProfileImagePreview({ name, imageUrl }: { name?: string | null; imageUrl?: string | null }) {
    const reducedMotion = useReducedMotion();
    const [failedUrl, setFailedUrl] = useState<string | null>(null);

    if (imageUrl && failedUrl !== imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                cachePolicy="memory-disk"
                recyclingKey={imageUrl}
                transition={reducedMotion ? 0 : 150}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                onError={() => setFailedUrl(imageUrl)}
            />
        );
    }

    return (
        <View className="h-full w-full items-center justify-center bg-primary">
            <AppText variant="h1" color="primaryForeground" wrap={false}>
                {name?.charAt(0).toUpperCase() || "?"}
            </AppText>
        </View>
    );
}
