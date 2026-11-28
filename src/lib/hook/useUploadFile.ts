import { removeMemberProfileImage, updateMemberProfileImage } from "@/service/user";
import { type ProfileImageContentType } from "@/utils/media";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { responseError } from "../api-response/api-response";
import type { ApiResponse } from "../api-response/api-response";
import type { MemberSelfResponse } from "@/types/member.type";

export function useRemoveMemberProfileImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (memberId: number) => removeMemberProfileImage(memberId),
        onSuccess: (_, memberId) => {
            queryClient.setQueryData<ApiResponse<MemberSelfResponse>>(["member", "profile"], (previous) =>
                previous?.data.id === memberId
                    ? {
                          ...previous,
                          data: { ...previous.data, profileImage: null },
                      }
                    : previous,
            );
            void queryClient.invalidateQueries({
                queryKey: ["member", "profile"],
            });
        },
        onError: (err: unknown) => {
            responseError(err);
        },
    });
}

export function useUpdateMemberProfileImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            memberId,
            imageUri,
            contentType,
        }: {
            memberId: number;
            imageUri: string;
            contentType: ProfileImageContentType;
        }) => updateMemberProfileImage(memberId, imageUri, contentType),
        onSuccess: async ({ data }, { memberId }) => {
            const queryKey = ["member", "profile"];
            await queryClient.cancelQueries({ queryKey, exact: true });
            queryClient.setQueryData<ApiResponse<MemberSelfResponse>>(queryKey, (previous) =>
                previous?.data.id === memberId
                    ? { ...previous, data: { ...previous.data, profileImage: data.profileImage } }
                    : previous,
            );
        },
        onError: (err: unknown) => {
            responseError(err);
        },
    });
}
