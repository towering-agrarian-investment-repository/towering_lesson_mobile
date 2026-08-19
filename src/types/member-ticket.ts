export type TicketPauseResponse = {
	id: number;
	reason: string | null;
	pauseStartDate: string;
	pauseEndDate: string;
	pausedAt: string;
	cancelledAt: string | null;
	status: string;
};

export type TicketListItemResponse = {
	id: number;
	transactionId: number;
	coachName: string | null;
	name: string;
	type: string;
	originalPrice: number;
	discountAmount: number;
	price: number;
	period: number | null;
	totalCount: number | null;
	isUnlimited: boolean;
	onlyOnePerDay: boolean;
	usedCount: number;
	remainingCount: number;
	startDate: string | null;
	endDate: string | null;
	status: string;
	pauses: TicketPauseResponse[];
	reservationCount: number;
	bayReservationCount: number;
};
