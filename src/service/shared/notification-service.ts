import { ApiResponse, CursorPageResponse } from "@/lib/api-response/api-response";
import { apiClient } from "@/lib/client/api-client";

export type NotificationType =
	| "BOOKING_CONFIRMED"
	| "BOOKING_CANCELLED"
	| "TEE_TIME_REMINDER"
	| "PAYMENT_SUCCESS"
	| "PAYMENT_FAILED"
	| "TOURNAMENT_INVITATION"
	| "ADMIN_APPROVED";

export type NotificationReferenceType =
	| "BOOKING"
	| "BOOKING_LESSON"
	| "BOOKING_BAY"
	| "LESSON_LOG"
	| "PAYMENT"
	| "TOURNAMENT"
	| "USER"
	| "COURSE";

export interface NotificationResponse {
	id: number;
	title: string;
	message: string;
	type: NotificationType;
	referenceId: string | null;
	referenceType: NotificationReferenceType | null;
	isRead: boolean;
	sentPush: boolean;
	pushSentAt: string | null;
	readAt: string | null;
	createdAt: string;
}

export type NotificationListParams = {
	cursor?: string;
	limit?: number;
	isRead?: boolean;
};

export const NOTIFICATION_CURSOR_PAGE_SIZE = 20;

export const getNotifications = async ({
	cursor,
	limit = NOTIFICATION_CURSOR_PAGE_SIZE,
	isRead,
}: NotificationListParams, signal?: AbortSignal): Promise<
	ApiResponse<CursorPageResponse<NotificationResponse>>
> => {
	const params = new URLSearchParams();

	params.set("limit", String(limit));

	if (isRead !== undefined) {
		params.set("isRead", String(isRead));
	}

	if (cursor) {
		params.set("cursor", cursor);
	}

	return apiClient(`/notification/mobile?${params.toString()}`, {
		method: "GET",
		signal,
	});
};

export const getUnreadNotificationCount = async (): Promise<ApiResponse<number>> => {
	return apiClient("/notification/unread-count", {
		method: "GET",
	});
};

export const markNotificationAsRead = async (
	notificationId: number,
): Promise<ApiResponse<void>> => {
	return apiClient(`/notification/${notificationId}/read`, {
		method: "PUT",
	});
};

export const markAllNotificationsAsRead = async (): Promise<ApiResponse<void>> => {
	return apiClient("/notification/read-all", {
		method: "PUT",
	});
};

export const deleteNotification = async (
	notificationId: number,
): Promise<ApiResponse<void>> => {
	return apiClient(`/notification/${notificationId}`, {
		method: "DELETE",
	});
};

export const deleteAllNotifications = async (): Promise<ApiResponse<void>> => {
	return apiClient("/notification/all", {
		method: "DELETE",
	});
};
