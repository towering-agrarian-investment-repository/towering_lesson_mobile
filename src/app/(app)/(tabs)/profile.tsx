import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import { ErrorState } from "@/components/ui/StateCard";
import { useGetMemberProfile } from "@/lib/hook/useUser";
import { showAppToast } from "@/lib/toast/toast";
import { signOut } from "@/service/auth";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";

export default function ProfileScreen() {
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const {
        data: memberResponse,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
    } = useGetMemberProfile();

    const member = memberResponse?.data;

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    };

    const confirmSignOut = () => {
        if (isSigningOut) {
            return;
        }

        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: () => {
                        void handleSignOut();
                    },
                },
            ],
        );
    };

    const handleSignOut = async () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);

        try {
            await signOut();
            queryClient.clear();
        } catch (error) {
            showAppToast({
                message:
                    error instanceof Error
                        ? error.message
                        : "Could not sign out. Please try again.",
                type: "error",
            });
        } finally {
            setIsSigningOut(false);
        }
    };

    if (isLoading) {
        return <CircleLoader fullScreen label="Loading your profile..." />;
    }

    if (isError) {
        return (
            <ErrorState
                title="Could not load profile"
                message={error instanceof Error ? error.message : "Please try again."}
                actionLabel={isRefetching ? "Refreshing..." : "Try Again"}
                onAction={() => {
                    void refetch();
                }}
            />
        );
    }

    return (
        <Screen
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        void handleRefresh();
                    }}
                />
            }
        >
            {/* ── Avatar + Name ── */}
            <View className="flex-row items-center gap-5">
                {member?.profileImage ? (
                    <Image
                        source={{ uri: member.profileImage }}
                        className="w-28 h-28 rounded-full"
                    />
                ) : (
                    <View className="w-28 h-28 rounded-full bg-[#32bbfa] items-center justify-center">
                        <Text className="text-white text-5xl font-bold">
                            {member?.name?.charAt(0).toUpperCase() || "?"}
                        </Text>
                    </View>
                )}

                <View className="flex-1">
                    <Text
                        className="text-2xl font-bold text-gray-950 leading-8"
                        numberOfLines={2}
                    >
                        {member?.name}
                    </Text>

                    <Text
                        className="text-base text-gray-500 leading-6"
                        numberOfLines={1}
                    >
                        @{member?.username}
                    </Text>

                    <View
                        className={`self-start rounded-full px-3.5 py-1 ${member?.isActive ? "bg-green-100" : "bg-red-100"
                            }`}
                    >
                        <Text
                            className={`text-sm font-semibold ${member?.isActive ? "text-green-700" : "text-red-600"
                                }`}
                        >
                            {member?.isActive ? "Active" : "Inactive"}
                        </Text>
                    </View>
                </View>
            </View>

            <SectionTitle title="Personal Record" />
            <LinkRow label="Lesson Log" onPress={() => router.push("/lesson-log")} />

            <SectionTitle title="General Info" />
            <InfoRow label="Check-in No." value={member?.checkinNumber} />
            <InfoRow label="Phone" value={member?.phoneNumber} />
            <InfoRow label="Gender" value={member?.gender} />
            <InfoRow label="Date of Birth" value={member?.dateOfBirth} />
            <InfoRow label="Address" value={member?.address} />
            {member?.memo && <InfoRow label="Memo" value={member.memo} />}

            {member?.grade && (
                <>
                    <SectionTitle title="School Info" />
                    <InfoRow label="School" value={member.grade.schoolName} />
                    <InfoRow label="School Code" value={member.grade.schoolCode} />
                    <InfoRow label="Grade" value={member.grade.name} />
                </>
            )}

            {member?.parents && member.parents.length > 0 && (
                <>
                    <SectionTitle title="Parents / Guardians" />

                    {member.parents.map((parent, index) => (
                        <View
                            key={parent.id}
                            className={`flex-row items-center py-4 ${index < member.parents.length - 1
                                ? "border-b border-gray-100"
                                : ""
                                }`}
                        >
                            {parent.profileImage ? (
                                <Image
                                    source={{ uri: parent.profileImage }}
                                    className="w-12 h-12 rounded-full"
                                />
                            ) : (
                                <View className="w-12 h-12 rounded-full bg-[#242444] items-center justify-center">
                                    <Text className="text-white text-lg font-bold">
                                        {parent.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-1 ml-4">
                                <View className="flex-row items-center gap-2">
                                    <Text
                                        className="text-base font-semibold text-gray-950 leading-6"
                                        numberOfLines={1}
                                    >
                                        {parent.name}
                                    </Text>

                                    <View
                                        className={`px-2.5 py-0.5 rounded-full ${parent.isActive
                                            ? "bg-green-100"
                                            : "bg-red-100"
                                            }`}
                                    >
                                        <Text
                                            className={`text-xs font-semibold ${parent.isActive
                                                ? "text-green-700"
                                                : "text-red-600"
                                                }`}
                                        >
                                            {parent.isActive ? "Active" : "Inactive"}
                                        </Text>
                                    </View>
                                </View>

                                {parent.phoneNumber && (
                                    <Text className="text-sm text-gray-500 mt-1 leading-5">
                                        {parent.phoneNumber}
                                    </Text>
                                )}

                                <Text className="text-sm text-gray-400 mt-0.5 leading-5">
                                    {parent.childrenCount} child
                                    {parent.childrenCount !== 1 ? "ren" : ""}
                                </Text>
                            </View>
                        </View>
                    ))}
                </>
            )}

            {/* ── Settings ── */}
            <SectionTitle title="Settings" />

            <LinkRow
                label="Edit Personal Information"
                onPress={() => router.push("/profile/edit")}
            />

            <LinkRow
                label="Change Password"
                onPress={() => router.push("/profile/change-password")}
            />

            {/* Logout */}
            <Pressable
                onPress={confirmSignOut}
                disabled={isSigningOut}
                className={`mt-4 rounded-2xl border px-4 py-4 ${
                    isSigningOut
                        ? "border-red-100 bg-red-100"
                        : "border-red-100 bg-red-50 active:bg-red-100"
                }`}
            >
                <Text className="text-base font-semibold text-red-600 leading-6">
                    {isSigningOut ? "Logging Out..." : "Log Out"}
                </Text>
            </Pressable>
        </Screen>
    );
}

// ── Helpers ──

function SectionTitle({ title }: { title: string }) {
    return (
        <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-8 mb-2 leading-4">
            {title}
        </Text>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    if (!value) return null;

    return (
        <View className="flex-row justify-between items-start py-4 border-b border-gray-100">
            <Text className="text-base text-gray-500 leading-6">{label}</Text>

            <Text className="text-base font-medium text-gray-950 leading-6 flex-1 text-right ml-4">
                {value}
            </Text>
        </View>
    );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            className="mt-3 px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 flex-row items-center justify-between active:bg-gray-100"
        >
            <Text className="text-base font-semibold text-gray-900 leading-6">
                {label}
            </Text>

            <Text className="text-gray-400 text-2xl leading-6">›</Text>
        </Pressable>
    );
}
