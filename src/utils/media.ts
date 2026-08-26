const JPEG_EXTENSIONS = ["jpg", "jpeg"] as const;
const IMAGE_EXTENSIONS = [...JPEG_EXTENSIONS, "png", "webp"] as const;
const VIDEO_EXTENSIONS = ["mp4"] as const;
const DOCUMENT_EXTENSIONS = ["pdf"] as const;

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_MIME_TYPES = ["video/mp4"] as const;
export const PROFILE_IMAGE_EXTENSIONS = new Set(IMAGE_EXTENSIONS);
export const PROFILE_IMAGE_MIME_TYPES = new Set(IMAGE_MIME_TYPES);

export const HOMEWORK_SUBMISSION_EXTENSIONS = new Set([
    ...IMAGE_EXTENSIONS,
    ...VIDEO_EXTENSIONS,
]);
export const HOMEWORK_SUBMISSION_MIME_TYPES = [
    ...IMAGE_MIME_TYPES,
    ...VIDEO_MIME_TYPES,
];

export const RESOURCE_IMAGE_EXTENSIONS = new Set(IMAGE_EXTENSIONS);
export const RESOURCE_VIDEO_EXTENSIONS = new Set(VIDEO_EXTENSIONS);
export const RESOURCE_FILE_EXTENSIONS = new Set([
    ...IMAGE_EXTENSIONS,
    ...VIDEO_EXTENSIONS,
    ...DOCUMENT_EXTENSIONS,
]);

export function getFileExtension(value?: string | null) {
    if (!value) {
        return null;
    }

    const normalized = value.split("?")[0].split("#")[0];

    return normalized.split(".").pop()?.toLowerCase() || null;
}

export function isAllowedExtension(
    value: string | null | undefined,
    allowedExtensions: Set<string>,
) {
    const extension = getFileExtension(value);

    return extension ? allowedExtensions.has(extension) : false;
}

export function isAllowedMimeType(
    value: string | null | undefined,
    allowedMimeTypes: readonly string[],
) {
    return value ? allowedMimeTypes.includes(value.toLowerCase()) : false;
}

export function getProfileImageMimeType(extension: string) {
    if (extension === "jpg" || extension === "jpeg") {
        return "image/jpeg";
    }

    if (extension === "png") {
        return "image/png";
    }

    if (extension === "webp") {
        return "image/webp";
    }

    return null;
}
