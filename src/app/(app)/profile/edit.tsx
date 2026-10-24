import { PendingBottomSheet } from "@/design-system/components/PendingBottomSheet";
import { FormTextInput } from "@/components/ui/form";
import {
  CircleLoader,
  cn,
  ErrorState,
  getPressedScaleStyle,
  ListRow,
  Screen,
  triggerNotificationHaptic,
} from "@/design-system";
import { NativeText } from "@/design-system/components/NativeText";
import { getNativeButtonStyle } from "@/design-system/utils/native-button-styles";
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
import {
  Button,
  Host,
  RNHostView,
  Row,
  Spacer,
  Text,
} from "@expo/ui";
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
import { ActivityIndicator, Pressable, View } from "react-native";
import { z } from "zod";

const isIOS = process.env.EXPO_OS === "ios";
const buttonSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
  : [fillMaxWidth(), defaultMinSize({ minHeight: 48 })];
const buttonInnerSize = isIOS
  ? [frame({ maxWidth: Infinity, minHeight: 48 })]
  : [fillMaxWidth()];

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
    colors,
    resolvedScheme: uiScheme,
    fontScale: uiFontScale,
  } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const {
    data: memberResponse,
    isLoading,
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
  const pickingImage = useRef(false);
  const submitting = useRef(false);
  const initializedMemberId = useRef<number | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const isUpdatingImage = isPickingImage || isUploadingImage || isRemovingImage;
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
  const isSaveDisabled =
    isSubmitting || isUpdatingImage || !form.formState.isDirty;

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
          triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
          router.dismissTo("/(app)/(tabs)/profile");
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
    if (
      !member?.id ||
      pickingImage.current ||
      isUpdatingImage ||
      isSubmitting
    ) {
      return;
    }

    pickingImage.current = true;
    setIsPickingImage(true);
    try {
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
    if (
      !member?.id ||
      pickingImage.current ||
      isUpdatingImage ||
      isSubmitting
    ) {
      return;
    }

    pickingImage.current = true;
    setIsPickingImage(true);
    try {
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

    setIsPhotoSourceSheetVisible(true);
  };

  const closePhotoSourceSheet = () => {
    if (pickingImage.current || removalLock.current || isUpdatingImage) return;
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
    removeProfileImage(member.id, {
      onSuccess: () => {
        setIsPhotoSourceSheetVisible(false);
        triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
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

  if (!member) {
    return (
      <ErrorState
        title={t("home.couldNotLoadProfile")}
        message={t("home.checkConnection")}
        actionLabel={
          isRefetching ? t("common.refreshing") : t("common.refreshTryAgain")
        }
        actionPending={isRefetching}
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  const photoActionLabel = isRemovingImage
    ? t("profile.removingPhoto")
    : isUploadingImage
      ? t("profile.uploading")
      : t("profile.changePhoto");
  const isPhotoActionDisabled = isUpdatingImage || isSubmitting;

  return (
    <Screen
      keyboardAware
      footer={
        <View className="pb-8 pt-4">
          <Host
            matchContents={{ vertical: true }}
            ignoreSafeArea="all"
            colorScheme={uiScheme}
            seedColor={colors.primary}
            style={{ width: "100%" }}
            accessibilityLabel={
              isSubmitting ? t("profile.saving") : t("profile.saveChanges")
            }
            accessibilityState={{
              disabled: isSaveDisabled,
              busy: isSubmitting,
            }}
          >
            <Button
              modifiers={buttonSize}
              variant="text"
              disabled={isSaveDisabled}
              onPress={() => {
                void form.handleSubmit(onSubmit, handleInvalidSubmit)();
              }}
              style={getNativeButtonStyle(colors, "filled")}
            >
              <Row modifiers={buttonInnerSize} spacing={8} alignment="center">
                <Spacer flexible />
                {isSubmitting ? (
                  <RNHostView matchContents>
                    <ActivityIndicator color={colors.primaryForeground} />
                  </RNHostView>
                ) : null}
                <Text
                  textStyle={{
                    textAlign: "center",
                    ...typography.label,
                    lineHeight: typography.label.lineHeight * uiFontScale,
                    fontWeight: "600",
                    color: colors.primaryForeground,
                    fontSize: typography.label.fontSize * uiFontScale,
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
      <PendingBottomSheet
        isPresented={isPhotoSourceSheetVisible}
        onDismiss={closePhotoSourceSheet}
        dismissDisabled={isUpdatingImage}
        containerColor={colors.card}
        contentPadding={{ top: 20, bottom: 32, left: 24, right: 24 }}
      >
        <RNHostView matchContents={{ vertical: true }}>
          <View className="gap-4">
            <View className="gap-1">
              <NativeText variant="h3">
                {t("profile.changeProfilePhoto")}
              </NativeText>
              <NativeText variant="muted" color="mutedForeground">
                {t("profile.changeProfilePhotoDescription")}
              </NativeText>
            </View>
            <View className="gap-3">
              <ListRow
                title={t("profile.takePhoto")}
                subtitle={t("profile.useCamera")}
                titleStyle={{ fontWeight: "500" }}
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
                titleStyle={{ fontWeight: "500" }}
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
                  title={t("profile.removePhoto")}
                  titleStyle={{ fontWeight: "500" }}
                  leading={
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
                      <Trash2 size={22} color={colors.danger} />
                    </View>
                  }
                  showChevron={false}
                  className="bg-surface"
                  disabled={isUpdatingImage || isSubmitting}
                  onPress={handleRemoveProfileImage}
                />
              ) : null}
            </View>
            <Host
              matchContents={{ vertical: true }}
              ignoreSafeArea="all"
              colorScheme={uiScheme}
              style={{ width: "100%" }}
            >
              <Button
                variant="text"
                disabled={isUpdatingImage}
                onPress={closePhotoSourceSheet}
                style={getNativeButtonStyle(colors, "text")}
                modifiers={buttonSize}
              >
                <Text
                  modifiers={buttonInnerSize}
                  textStyle={{
                    ...typography.label,
                    lineHeight: typography.label.lineHeight * uiFontScale,
                    fontSize: typography.label.fontSize * uiFontScale,
                    color: colors.foreground,
                    textAlign: "center",
                  }}
                >
                  {t("common.cancel")}
                </Text>
              </Button>
            </Host>
          </View>
        </RNHostView>
      </PendingBottomSheet>

      <View className="gap-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={photoActionLabel}
          accessibilityState={{
            disabled: isPhotoActionDisabled,
            busy: isUpdatingImage,
          }}
          disabled={isPhotoActionDisabled}
          hitSlop={8}
          className={cn(
            "items-center gap-2.5 self-center",
            isSubmitting && "opacity-60",
          )}
          style={({ pressed }) =>
            getPressedScaleStyle(pressed, isPhotoActionDisabled, 0.97)
          }
          onPress={handleChangeProfileImage}
        >
          <View className="h-24 w-24">
            <View className="h-24 w-24 overflow-hidden rounded-full bg-muted">
              <ProfileImagePreview
                name={member.name}
                imageUrl={member.profileImage}
              />

              {isUpdatingImage ? (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <ActivityIndicator color={colors.primaryForeground} />
                </View>
              ) : null}
            </View>

            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary">
              <Camera size={15} color={colors.primaryForeground} />
            </View>
          </View>

          <NativeText variant="meta" color="primary" wrap={false}>
            {photoActionLabel}
          </NativeText>
        </Pressable>

        <View className="gap-5">
          <NativeText
            variant="body"
            textStyle={{
              lineHeight: typography.h3.lineHeight,
              fontSize: typography.subtitle.fontSize,
              fontWeight: "600" as const,
            }}
          >
            {t("profile.basicInformation")}
          </NativeText>

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

class ProfileImageValidationError extends Error {}

function createProfileImageFromAsset(
  asset: ImagePicker.ImagePickerAsset,
  t: (key: string) => string,
): { uri: string; contentType: ProfileImageContentType } {
  if (
    typeof asset.fileSize === "number" &&
    asset.fileSize > PROFILE_IMAGE_MAX_SIZE_BYTES
  ) {
    throw new ProfileImageValidationError(t("profile.profileImageTooLarge"));
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
    throw new ProfileImageValidationError(t("profile.onlyImageTypesSupported"));
  }

  const contentType = hasSupportedMimeType
    ? normalizedMimeType
    : getProfileImageMimeType(extension);

  if (!contentType) {
    throw new ProfileImageValidationError(t("profile.onlyImageTypesSupported"));
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
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    );
  }

  return (
    <View className="h-full w-full items-center justify-center bg-primary">
      <NativeText variant="h1" color="primaryForeground" wrap={false}>
        {name?.charAt(0).toUpperCase() || "?"}
      </NativeText>
    </View>
  );
}
