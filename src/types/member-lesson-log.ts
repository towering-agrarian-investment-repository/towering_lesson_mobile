export type LessonLogStatus = "NOT_WRITTEN" | "AWAITING" | "APPROVED";

export type RelatedReservation = {
	id: number;
	name: string | null;
};

export type MemberLessonLogResponse = {
	id: number | null;
	lessonDate: string;
	reservation: RelatedReservation | null;
	coachName: string | null;
	videoUrl: string | null;
	ratings: number | null;
	comment: string | null;
	status: LessonLogStatus;
	body: string | null;
};

export type MemberLessonLogUpdateRequest = {
	comment: string | null;
	ratings: number | null;
};
