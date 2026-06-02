import { CircleLoader } from "@/components/ui/CircleLoader";
import { Screen } from "@/components/ui/Screen";
import {
    FormDateInput,
    FormNumberInput,
    FormSelect,
    FormTextInput,
} from "@/components/ui/form";
import { ErrorState } from "@/components/ui/StateCard";
import {
    useGetMemberProfile,
    useUpdateMemberProfile,
} from "@/lib/hook/useUser";
import { GenderEnum } from "@/types/member.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Pressable,
    Text,
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
    const router = useRouter();
    const {
        data: memberResponse,
        isLoading,
        isError,
        error,
    } = useGetMemberProfile();
    const {
        mutateAsync: updateProfile,
        isPending: isSubmitting,
    } = useUpdateMemberProfile();

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

    const onSubmit = async (values: EditProfileFormValues) => {
        await updateProfile({
            name: values.name.trim(),
            phoneNumber: normalizeOptionalText(values.phoneNumber),
            username: values.username.trim(),
            gender: values.gender || null,
            dateOfBirth: normalizeOptionalText(values.dateOfBirth),
            address: normalizeOptionalText(values.address),
            memo: normalizeOptionalText(values.memo),
        });

        router.back();
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
                <View className="border-t border-gray-100 bg-white px-6 pb-8 pt-4">
                    <Pressable
                        className={`items-center justify-center rounded-2xl px-4 py-4 ${isSubmitting ? "bg-green-300" : "bg-green-500"
                            }`}
                        onPress={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        <Text
                            className="w-full text-center text-base font-bold text-white"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Text>
                    </Pressable>
                </View>
            }
        >
            <View className="gap-8">
                <View className="gap-6">
                    <Text className="text-lg font-semibold text-gray-950">
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
                    <Text className="text-lg font-semibold text-gray-950">
                        Personal Details
                    </Text>

                    <FormSelect
                        control={form.control}
                        name="gender"
                        label="Gender"
                        options={GENDER_OPTIONS}
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
