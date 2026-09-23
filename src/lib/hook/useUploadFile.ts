import {
    updateMemberProfileImage,
} from "@/service/user";
import { type ProfileImageContentType } from "@/utils/media";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { responseError } from "../api-response/api-response";


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
        onSuccess: (res) => {
            queryClient.setQueryData(["member", "profile"], res);
            void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
        onError: (err: unknown) => {
            responseError(err);
        },
    });
}
