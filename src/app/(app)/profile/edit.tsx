import { ActionSheet, AppText as Text, Button, CircleLoader, ErrorState, Screen, triggerNotificationHaptic, useThemeColors } from "@/design-system";
import {
    FormTextInput,
} from "@/components/ui/form";
import { useUploadMemberUser } from "@/lib/hook/useUploadFile";
import {
    useGetMemberProfile,
    useUpdateMemberProfile,
} from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { type UploadFormFile } from "@/service/user";
import {
    getProfileImageMimeType,
    isAllowedExtension,
    isAllowedMimeType,
    PROFILE_IMAGE_EXTENSIONS,
    PROFILE_IMAGE_MIME_TYPES,
} from "@/utils/media";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, ImageIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod";
const createEditProfileSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().trim().min(1, t("profile.nameRequired")),
        nickname: z.string().trim().max(50).optional(),
    });

type EditProfileFormValues = z.infer<ReturnType<typeof createEditProfileSchema>>;

export default function EditProfileScreen() {
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
    const {
        mutate: updateProfile,
        isPending: isSubmitting,
    } = useUpdateMemberProfile();
    const {
        mutate: uploadProfileImage,
        isPending: isUploadingImage,
    } = useUploadMemberUser();
    const [isPhotoSourceSheetVisible, setIsPhotoSourceSheetVisible] =
        useState(false);

    const member = memberResponse?.data;
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
        if (!member) {
            return;
        }

        form.reset({
            name: member.name ?? "",
            nickname: member.nickname ?? "",
        });
    }, [form, member]);

    const onSubmit = (values: EditProfileFormValues) => {
        if (!member) {
            return;
        }

        updateProfile(
            {
                name: values.name.trim(),
                nickname: values.nickname?.trim() || null,
            },
            {
                onSuccess: () => {
                    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
                    router.back();
                },
            },
        );
    };

    const handleInvalidSubmit = (errors: FieldErrors<EditProfileFormValues>) => {
        form.setFocus(errors.name ? "name" : "nickname");
    };

    const uploadSelectedProfileImage = (
        memberId: number,
        asset: ImagePicker.ImagePickerAsset,
    ) => {
        const file = createFileFromAsset(asset, t);

        uploadProfileImage(
            {
                id: memberId,
                file,
            },
            {
                onSuccess: () => {
                    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
                    showAppToast({
                        message: t("profile.profileImageUpdated"),
                        type: "success",
                    });
                },
            },
        );
    };

    const handlePickProfileImageFromLibrary = async () => {
        if (!member?.id || isUploadingImage) {
            return;
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
        if (!member?.id || isUploadingImage) {
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
        if (!member?.id || isUploadingImage) {
            return;
        }

        setIsPhotoSourceSheetVisible(true);
    };

    const closePhotoSourceSheet = () => {
        setIsPhotoSourceSheetVisible(false);
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
            keyboardAware
            footer={
                <View className="border-t border-border bg-background px-6 pb-8 pt-4">
                    <Button
                        title={isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
                        loading={isSubmitting}
                        disabled={
                            isSubmitting
                            || isUploadingImage
                            || !form.formState.isDirty
                            || !form.formState.isValid
                        }
                        className="rounded-xl"
                        onPress={form.handleSubmit(onSubmit, handleInvalidSubmit)}
                    />
                </View>
            }
        >
            <ActionSheet
                visible={isPhotoSourceSheetVisible}
                title={t("profile.changeProfilePhoto")}
                description={t("profile.changeProfilePhotoDescription")}
                onClose={closePhotoSourceSheet}
                closeDelayMs={250}
                options={[
                    {
                        key: "camera",
                        title: t("profile.takePhoto"),
                        description: t("profile.useCamera"),
                        icon: <Camera size={22} color={colors.foreground} />,
                        disabled: isUploadingImage,
                        onPress: () => {
                            void handleTakeProfileImage();
                        },
                    },
                    {
                        key: "library",
                        title: t("profile.chooseFromLibrary"),
                        description: t("profile.selectExistingPhoto"),
                        icon: <ImageIcon size={22} color={colors.foreground} />,
                        disabled: isUploadingImage,
                        onPress: () => {
                            void handlePickProfileImageFromLibrary();
                        },
                    },
                ]}
            />

            <View className="gap-8">
                <View className="items-center gap-4">
                    <ProfileImagePreview
                        name={member.name}
                        imageUrl={member.profileImage}
                    />

                    <Button
                        title={isUploadingImage ? t("profile.uploading") : t("profile.changePhoto")}
                        variant="secondary"
                        loading={isUploadingImage}
                        disabled={isUploadingImage || isSubmitting}
                        onPress={() => {
                            handleChangeProfileImage();
                        }}
                    />
                </View>

                <View className="gap-6">
                    <Text className="text-lg font-semibold text-foreground">
                        {t("profile.basicInformation")}
                    </Text>

                    <FormTextInput
                        control={form.control}
                        name="name"
                        label={t("profile.fullName")}
                        placeholder={t("profile.fullNamePlaceholder")}
                        autoComplete="name"
                        textContentType="name"
                    />

                    <FormTextInput
                        control={form.control}
                        name="nickname"
                        label={t("profile.nickname", { defaultValue: "Nickname" })}
                        placeholder={t("profile.nicknamePlaceholder", { defaultValue: "Enter a nickname" })}
                        autoComplete="nickname"
                        textContentType="nickname"
                    />

                </View>
            </View>
        </Screen>
    );
}

function createFileFromAsset(
    asset: ImagePicker.ImagePickerAsset,
    t: (key: string) => string,
): UploadFormFile {
    const rawName =
        asset.fileName ?? asset.uri.split("/").pop() ?? "profile-image.jpg";
    const extension = rawName.split(".").pop()?.toLowerCase() ?? "jpg";
    const hasSupportedExtension = isAllowedExtension(rawName, PROFILE_IMAGE_EXTENSIONS);
    const hasSupportedMimeType = isAllowedMimeType(asset.mimeType, [...PROFILE_IMAGE_MIME_TYPES]);

    if (!hasSupportedExtension && !hasSupportedMimeType) {
        throw new Error(t("profile.onlyImageTypesSupported"));
    }

    const mimeType =
        asset.mimeType?.toLowerCase()
        ?? getProfileImageMimeType(extension)
        ?? "image/jpeg";

    return {
        uri: asset.uri,
        name: rawName,
        type: mimeType,
    };
}

function ProfileImagePreview({
    name,
    imageUrl,
}: {
    name?: string | null;
    imageUrl?: string | null;
}) {
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
            <Text variant="h1" className="text-primary-foreground">
                {name?.charAt(0).toUpperCase() || "?"}
            </Text>
        </View>
    );
}

