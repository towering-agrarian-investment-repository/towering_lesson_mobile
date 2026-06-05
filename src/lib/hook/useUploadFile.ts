import { uploadMemberUserProfileImage } from "@/service/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { responseError } from "../api-response/api-response";


export function useUploadMemberUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: number; file: File }) =>
            uploadMemberUserProfileImage(id, file),
        onSuccess: (res, _variables) => {
            // responseStatus({ res });
            queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
        onError: (err: any) => {
            responseError({ errorMessage: err?.status?.message || "Upload failed" });
        },
    });
}
