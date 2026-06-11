import { ActionSheet, AppText as Text, Button, CircleLoader, ErrorState, Screen, useThemeColors } from "@/design-system";
import {
    FormDateInput,
    FormNumberInput,
    FormTextInput,
} from "@/components/ui/form";
import { FormFieldShell } from "@/components/ui/form/FormFieldShell";
import { useUploadMemberUser } from "@/lib/hook/useUploadFile";
import {
    useGetMemberProfile,
    useUpdateMemberProfile,
} from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { type UploadFormFile } from "@/service/user";
import { GenderEnum } from "@/types/member.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera, ChevronRight, ImageIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Pressable,
    View,
} from "react-native";
import { z } from "zod";

const editProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required."),
    phoneNumber: z.string().trim().min(4, "Phone number is required."),
    username: z.string().trim().min(1, "Username is required."),
    gender: z.enum(["", "MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z
        .string()
        .trim()
        .refine(
            (value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value),
            "Date of birth must be in YYYY-MM-DD format.",
        ),
    address: z.string().trim(),
    memo: z.string().trim(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

const GENDER_OPTIONS: {
    label: string;
    value: GenderEnum;
}[] = [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
        { label: "Other", value: "OTHER" },
    ];

function normalizeOptionalText(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export default function EditProfileScreen() {
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
    const [isGenderSheetVisible, setIsGenderSheetVisible] = useState(false);

    const member = memberResponse?.data;

    const form = useForm<EditProfileFormValues>({
        defaultValues: {
            name: "",
            phoneNumber: "",
            username: "",
            gender: "",
            dateOfBirth: "",
            address: "",
            memo: "",
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
            phoneNumber: member.phoneNumber ?? "",
            username: member.username ?? "",
            gender: member.gender ?? "",
            dateOfBirth: member.dateOfBirth ?? "",
            address: member.address ?? "",
            memo: member.memo ?? "",
        });
    }, [form, member]);

    const onSubmit = (values: EditProfileFormValues) => {
        updateProfile(
            {
                name: values.name.trim(),
                phoneNumber: normalizeOptionalText(values.phoneNumber),
                username: values.username.trim(),
                gender: values.gender || null,
                dateOfBirth: normalizeOptionalText(values.dateOfBirth),
                address: normalizeOptionalText(values.address),
                memo: normalizeOptionalText(values.memo),
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
        const file = createFileFromAsset(asset);

        uploadProfileImage(
            {
                id: memberId,
                file,
            },
            {
                onSuccess: () => {
                    showAppToast({
                        message: "Profile image updated.",
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
                message: "Photo library permission is required to upload a profile image.",
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
                        : "Could not prepare the selected image.",
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
                message: "Camera permission is required to take a profile image.",
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
                        : "Could not prepare the captured image.",
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
        return <CircleLoader fullScreen label="Loading your profile..." />;
    }

    if (isError || !member) {
        return (
            <ErrorState
                title="Could not load profile"
                message={
                    error instanceof Error
                        ? error.message
                        : "Please try again."
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
                        title={isSubmitting ? "Saving..." : "Save Changes"}
                        loading={isSubmitting}
                        className="rounded-xl"
                        onPress={form.handleSubmit(onSubmit)}
                    />
                </View>
            }
        >
            <ActionSheet
                visible={isPhotoSourceSheetVisible}
                title="Change profile photo"
                description="Take a new photo or choose one from your library."
                onClose={closePhotoSourceSheet}
                closeDelayMs={250}
                options={[
                    {
                        key: "camera",
                        title: "Take Photo",
                        description: "Use your camera",
                        icon: <Camera size={22} color={colors.foreground} />,
                        disabled: isUploadingImage,
                        onPress: () => {
                            void handleTakeProfileImage();
                        },
                    },
                    {
                        key: "library",
                        title: "Choose from Library",
                        description: "Select an existing photo",
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
                        title={isUploadingImage ? "Uploading..." : "Change Photo"}
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
                        Basic Information
                    </Text>

                    <FormTextInput
                        control={form.control}
                        name="name"
                        label="Full Name"
                        placeholder="Jane Member"
                    />

                    <FormTextInput
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
                    />
                </View>

                <View className="gap-6">
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

                    <FormDateInput
                        control={form.control}
                        name="dateOfBirth"
                        label="Date of Birth"
                        placeholder="Select date of birth"
                    />

                    <FormTextInput
                        control={form.control}
                        name="address"
                        label="Address"
                        placeholder="Bangkok"
                    />

                    <FormTextInput
                        control={form.control}
                        name="memo"
                        label="Memo"
                        placeholder="Prefers evening lessons"
                        multiline
                        numberOfLines={4}
                    />
                </View>
            </View>
        </Screen>
    );
}

function createFileFromAsset(asset: ImagePicker.ImagePickerAsset): UploadFormFile {
    const rawName =
        asset.fileName ?? asset.uri.split("/").pop() ?? "profile-image.jpg";
    const extension = rawName.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType =
        asset.mimeType ??
        (extension === "jpg" ? "image/jpeg" : `image/${extension}`);

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

