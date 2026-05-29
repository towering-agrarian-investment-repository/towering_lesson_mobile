import { getMemberProfile } from "@/service/user";
import { MemberResponse } from "@/types/member.type";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "../api-response/api-response";

export function useGetMemberProfile() {
    return useQuery<ApiResponse<MemberResponse>>({
        queryKey: ["member", "profile"],
        queryFn: getMemberProfile,
    });
}