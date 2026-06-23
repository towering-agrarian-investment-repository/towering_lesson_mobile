import { ActionSheet, AppText as Text, Button, CircleLoader, ErrorState, Screen, useThemeColors } from "@/design-system";
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
    getFileExtension,
    getProfileImageMimeType,
    isAllowedExtension,
    isAllowedMimeType,
    PROFILE_IMAGE_EXTENSIONS,
    PROFILE_IMAGE_MIME_TYPES,
} from "@/utils/media";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, ImageIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod";
const createEditProfileSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().trim().min(1, t("profile.nameRequired")),
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
        error,
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
        },
        resolver: zodResolver(editProfileSchema),
        mode: "onSubmit",
    });

    useEffect(() => {
        if (!member) {
            return;
        }

        form.reset({
            name: member.name ?? "",
        });
    }, [form, member]);

    const onSubmit = (values: EditProfileFormValues) => {
        if (!member) {
            return;
        }

        updateProfile(
            {
                name: values.name.trim(),
            },
            {
                onSuccess: () => {
                    router.back();
                },
            },
        );
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
                message={
                    error instanceof Error
                        ? error.message
                        : t("common.refreshTryAgain")
                }
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
                        className="rounded-xl"
                        onPress={form.handleSubmit(onSubmit)}
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
                        disabled={isUploadingImage}
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
                    />

                    {/* <FormTextInput
                        control={form.control}
                        name="username"
                        label="Username"
                        placeholder="jane.member"
                        autoCapitalize="none"
                    />

                    <FormNumberInput
                        control={form.control}
                        name="phoneNumber"
                        label="Phone Number"
                        placeholder="+66812345678"
                        numericMode="phone-pad"
                    /> */}
                </View>

                {/* <View className="gap-6">
                    <Text className="text-lg font-semibold text-foreground">
                        Personal Details
                    </Text>

                    <Controller
                        control={form.control}
                        name="gender"
                        render={({ field: { onChange, value }, fieldState }) => {
                            const selectedValue =
                                typeof value === "string" && value.length > 0 ? value : "";
                            const selectedLabel =
                                GENDER_OPTIONS.find((option) => option.value === selectedValue)
                                    ?.label ?? "Select an option";

                            return (
                                <>
                                    <ActionSheet
                                        visible={isGenderSheetVisible}
                                        title="Gender"
                                        description="Choose the gender value for this member profile."
                                        onClose={() => {
                                            setIsGenderSheetVisible(false);
                                        }}
                                        options={[
                                            {
                                                key: "clear",
                                                title: "Clear selection",
                                                selected: selectedValue === "",
                                                onPress: () => {
                                                    onChange("");
                                                },
                                            },
                                            ...GENDER_OPTIONS.map((option) => ({
                                                key: option.value,
                                                title: option.label,
                                                selected: option.value === selectedValue,
                                                onPress: () => {
                                                    onChange(option.value);
                                                },
                                            })),
                                        ]}
                                    />

                                    <FormFieldShell
                                        label="Gender"
                                        errorMessage={fieldState.error?.message}
                                    >
                                        <View className="mt-2">
                                            <Pressable
                                                className={`flex-row items-center border-b px-0 pb-3 pt-2 ${
                                                    fieldState.error
                                                        ? "border-danger"
                                                        : "border-border"
                                                }`}
                                                accessibilityRole="button"
                                                accessibilityLabel="Select gender"
                                                onPress={() => {
                                                    setIsGenderSheetVisible(true);
                                                }}
                                            >
                                                <Text
                                                    className={`flex-1 text-base ${
                                                        selectedValue
                                                            ? "text-foreground"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {selectedLabel}
                                                </Text>

                                                <ChevronRight
                                                    size={20}
                                                    color={colors.mutedForeground}
                                                    strokeWidth={2.25}
                                                />
                                            </Pressable>
                                        </View>
                                    </FormFieldShell>
                                </>
                            );
                        }}
                    />

                </View> */}
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

