import { ProfileHeader } from "@/components/golf/profile/ProfileRows";
import {
    ProfileAppearanceSection,
    ProfileGeneralInfoSection,
    ProfileParentsSection,
    ProfilePersonalRecordSection,
    ProfileSchoolInfoSection,
    ProfileSettingsSection,
} from "@/components/golf/profile/ProfileSections";
import { ProfileSignOutButton } from "@/components/golf/profile/ProfileSignOutButton";
import { ProfileSignOutSheet } from "@/components/golf/profile/ProfileSignOutSheet";
import { ProfileSkeleton } from "@/components/golf/profile/ProfileSkeleton";
import { ProfileUpdateBanner } from "@/components/golf/profile/ProfileUpdateBanner";
import { ProfileVersionFooter } from "@/components/golf/profile/ProfileVersionFooter";
import { ErrorState, ImageViewerModal, Screen, triggerImpactHaptic } from "@/design-system";
import { showAppToast } from "@/design-system/components/AppToast";
import { resolveLanguage, setAppLanguage, type AppLanguage } from "@/i18n";
import { useMemberLessonLogCount } from "@/lib/hook/useLessonLog";
import { usePullToRefresh } from "@/lib/hook/usePullToRefresh";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { signOut } from "@/service/auth";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useIsFocused, useScrollToTop } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, View, type ScrollViewInstance } from "react-native";

export default function ProfileScreen() {
    const { i18n, t } = useTranslation();
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutSheetVisible, setIsSignOutSheetVisible] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const signOutLocked = useRef(false);
    const scrollRef = useRef<ScrollViewInstance>(null);
    useScrollToTop(scrollRef);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

    const isFocused = useIsFocused();
    const [hasVisited, setHasVisited] = useState(false);
    useFocusEffect(
        useCallback(() => {
            setHasVisited(true);
        }, []),
    );

    const { data: memberResponse, isLoading, isError, refetch, isRefetching } = useGetMemberProfile();
    const { data: lessonLogCountResponse, refetch: refetchLessonLogCount } = useMemberLessonLogCount(
        isFocused || hasVisited,
    );
    const { refreshing: isPullRefreshing, onRefresh: handlePullRefresh } = usePullToRefresh(() =>
        Promise.all([refetch({ cancelRefetch: false }), refetchLessonLogCount({ cancelRefetch: false })]),
    );

    const member = memberResponse?.data;

    const handleSignOut = async () => {
        if (signOutLocked.current) return;
        triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Medium);
        signOutLocked.current = true;
        setIsSigningOut(true);

        try {
            await signOut();
            queryClient.clear();
            setIsSignOutSheetVisible(false);
        } catch {
            showAppToast({
                message: t("profile.signOutError"),
                type: "error",
            });
        } finally {
            setIsSigningOut(false);
            signOutLocked.current = false;
        }
    };

    const confirmSignOut = () => {
        if (isSigningOut) {
            return;
        }

        setIsSignOutSheetVisible(true);
    };

    const closeSignOutSheet = () => {
        if (!signOutLocked.current) setIsSignOutSheetVisible(false);
    };

    const handleLanguageChange = async (nextLanguage: AppLanguage) => {
        if (isChangingLanguage) {
            return;
        }

        setIsChangingLanguage(true);

        try {
            await setAppLanguage(nextLanguage);
        } catch {
            showAppToast({
                message: t("common.requestError"),
                type: "error",
            });
        } finally {
            setIsChangingLanguage(false);
        }
    };

    if (isLoading) {
        return (
            <Screen scrollRef={scrollRef} bottomSafeArea={process.env.EXPO_OS === "ios"} contentClassName="gap-6">
                <ProfileSkeleton />
            </Screen>
        );
    }

    if (isError && !memberResponse) {
        return (
            <Screen
                scrollRef={scrollRef}
                contentClassName="grow"
                bottomPadding={16}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
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

    return (
        <>
            <Screen
                scrollRef={scrollRef}
                bottomSafeArea={process.env.EXPO_OS === "ios"}
                refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} />}
            >
                <View className="flex-col">
                    <ProfileHeader
                        name={member?.name}
                        checkinNumber={member?.checkinNumber}
                        imageUrl={member?.profileImage}
                        onImagePress={() => setIsImageViewerVisible(true)}
                    />
                    <ProfileUpdateBanner />
                    <View className="gap-6 pt-6">
                        <View className="gap-6">
                            <ProfilePersonalRecordSection lessonLogCount={lessonLogCountResponse?.data} />

                            <ProfileGeneralInfoSection member={member} />

                            <ProfileSchoolInfoSection member={member} />

                            <ProfileParentsSection parents={member?.parents} />
                        </View>
                        <View>
                            <View className="gap-6">
                                <ProfileSettingsSection
                                    currentLanguage={resolveLanguage(i18n.resolvedLanguage || i18n.language)}
                                    isChangingLanguage={isChangingLanguage}
                                    onChangeLanguage={handleLanguageChange}
                                />

                                <ProfileAppearanceSection />

                                <ProfileSignOutButton isSigningOut={isSigningOut} onPress={confirmSignOut} />
                            </View>

                            <ProfileVersionFooter />
                        </View>
                    </View>
                </View>
            </Screen>

            <ImageViewerModal
                visible={isImageViewerVisible}
                imageUri={member?.profileImage ?? null}
                accessibilityLabel={t("profile.viewProfilePhoto")}
                onClose={() => setIsImageViewerVisible(false)}
            />

            <ProfileSignOutSheet
                isPresented={isSignOutSheetVisible}
                isSigningOut={isSigningOut}
                onDismiss={closeSignOutSheet}
                onConfirm={handleSignOut}
            />
        </>
    );
}
