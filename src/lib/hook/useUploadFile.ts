import {
    uploadMemberUserProfileImage,
    type UploadFormFile,
} from "@/service/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { responseError } from "../api-response/api-response";


export function useUploadMemberUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: number; file: UploadFormFile }) =>
            uploadMemberUserProfileImage(id, file),
        onSuccess: (res, _variables) => {
            // responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
        onError: (err: unknown) => {
            responseError({
                error: err,
                errorMessage: "Could not upload profile image.",
            });
        },
    });
}
