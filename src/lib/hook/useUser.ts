import { ApiResponse, responseError, responseStatus } from "@/lib/api-response/api-response";
import { getMemberProfile, updateMemberProfile } from "@/service/user";
import {
    UpdateMyProfileRequest,
    MemberSelfResponse,
} from "@/types/member.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetMemberProfile() {
    return useQuery<ApiResponse<MemberSelfResponse>>({
        queryKey: ["member", "profile"],
        queryFn: ({ signal }) => getMemberProfile(signal),
        staleTime: 5 * 60_000,
    });
}

export function useUpdateMemberProfile() {
    const queryClient = useQueryClient();

    return useMutation<
        ApiResponse<MemberSelfResponse>,
        unknown,
        UpdateMyProfileRequest
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
