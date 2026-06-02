import { ApiResponse, responseError, responseStatus } from "@/lib/api-response/api-response";
import { getMemberProfile, updateMemberProfile } from "@/service/user";
import {
    MemberMobileProfileUpdateRequest,
    MemberResponse,
} from "@/types/member.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetMemberProfile() {
    return useQuery<ApiResponse<MemberResponse>>({
        queryKey: ["member", "profile"],
        queryFn: getMemberProfile,
    });
}

export function useUpdateMemberProfile() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberResponse>,
        unknown,
        MemberMobileProfileUpdateRequest
    >({
        mutationFn: updateMemberProfile,
        onSuccess: (res) => {
            responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
        },
        onError: (error) => {
            responseError({ error });
        },
    });
}
