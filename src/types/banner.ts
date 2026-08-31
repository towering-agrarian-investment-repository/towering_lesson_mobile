export type PublishedBanner = {
    id: number;
    branchId: number;
    title: string;
    imageS3Key: string | null;
    imageExternalUrl: string | null;
    imageUrl: string | null;
    targetUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
};
