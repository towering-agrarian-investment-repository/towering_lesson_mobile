import { useGetMemberProfile } from "@/lib/hook/useUser";
import { router } from "expo-router";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function ProfileScreen() {
    const {
        data: memberResponse,
        isLoading,
        isError,
        error,
    } = useGetMemberProfile();

    const member = memberResponse?.data;

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#32bbfa" />
                <Text className="mt-3 text-base text-gray-500">
                    Loading your profile...
                </Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View className="flex-1 items-center justify-center bg-white px-6">
                <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                    Could not load profile
                </Text>
                <Text className="text-base leading-6 text-gray-500 text-center">
                    {error instanceof Error ? error.message : "Please try again."}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-white"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Avatar + Name ── */}
            <View className="mx-6 pt-10 pb-8 bg-white flex-row items-center gap-5">
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
                        className="mt-1 text-base text-gray-500 leading-6"
                        numberOfLines={1}
                    >
                        @{member?.username}
                    </Text>

                    <View
                        className={`self-start mt-3 px-3.5 py-1 rounded-full ${member?.isActive ? "bg-green-100" : "bg-red-100"
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

            {/* ── Personal Record ── */}
            <SectionTitle title="Personal Record" />
            <LinkRow label="Lesson Log" onPress={() => router.push("/lesson-log")} />

            {/* ── General Info ── */}
            <SectionTitle title="General Info" />
            <InfoRow label="Check-in No." value={member?.checkinNumber} />
            <InfoRow label="Phone" value={member?.phoneNumber} />
            <InfoRow label="Gender" value={member?.gender} />
            <InfoRow label="Date of Birth" value={member?.dateOfBirth} />
            <InfoRow label="Address" value={member?.address} />
            {member?.memo && <InfoRow label="Memo" value={member.memo} />}

            {/* ── Grade ── */}
            {member?.grade && (
                <>
                    <SectionTitle title="School Info" />
                    <InfoRow label="School" value={member.grade.schoolName} />
                    <InfoRow label="School Code" value={member.grade.schoolCode} />
                    <InfoRow label="Grade" value={member.grade.name} />
                </>
            )}

            {/* ── Parents ── */}
            {member?.parents && member.parents.length > 0 && (
                <>
                    <SectionTitle title="Parents / Guardians" />

                    {member.parents.map((parent, index) => (
                        <View
                            key={parent.id}
                            className={`flex-row items-center mx-6 py-4 ${index < member.parents.length - 1
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
                onPress={() => {
                    /* handle logout */
                }}
                className="mx-6 mt-4 px-4 py-4 rounded-2xl bg-red-50 border border-red-100 active:bg-red-100"
            >
                <Text className="text-base font-semibold text-red-600 leading-6">
                    Log Out
                </Text>
            </Pressable>
        </ScrollView>
    );
}

// ── Helpers ──

function SectionTitle({ title }: { title: string }) {
    return (
        <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase mx-6 mt-8 mb-2 leading-4">
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
        <View className="flex-row justify-between items-start mx-6 py-4 border-b border-gray-100">
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
            className="mx-6 mt-3 px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100 flex-row items-center justify-between active:bg-gray-100"
        >
            <Text className="text-base font-semibold text-gray-900 leading-6">
                {label}
            </Text>

            <Text className="text-gray-400 text-2xl leading-6">›</Text>
        </Pressable>
    );
}