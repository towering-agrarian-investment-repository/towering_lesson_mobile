type ToneClasses = {
    className: string;
    textClassName: string;
};

const DEFAULT_TONE: ToneClasses = {
    className: "bg-muted",
    textClassName: "text-muted-foreground",
};

export const LESSON_STATUS_STYLES: Record<string, string> = {
    SCHEDULED: "bg-amber-50 text-amber-700",
    IN_PROGRESS: "bg-sky-50 text-sky-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-rose-50 text-rose-700",
};

export const SESSION_STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-rose-50 text-rose-700",
};

export const SESSION_TYPE_STYLES: Record<string, string> = {
    DRILL: "bg-indigo-50 text-indigo-700",
    NON_DRILL: "bg-amber-50 text-amber-700",
};

export const HOMEWORK_SUBMISSION_STATUS_STYLES: Record<string, string> = {
    SUBMITTED: "bg-blue-100 text-blue-700",
    REVIEWED: "bg-green-100 text-green-700",
    RETURNED: "bg-purple-100 text-purple-700",
};

export const HOMEWORK_REVIEW_STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-emerald-100 text-emerald-700",
};

export function getLessonStatusTone(status?: string | null) {
    return getToneClasses(status, LESSON_STATUS_STYLES);
}

export function getSessionStatusTone(status?: string | null) {
    return getToneClasses(status, SESSION_STATUS_STYLES);
}

export function getSessionTypeTone(type?: string | null) {
    return getToneClasses(type, SESSION_TYPE_STYLES);
}

export function getHomeworkSubmissionTone(status?: string | null) {
    return getToneClasses(status, HOMEWORK_SUBMISSION_STATUS_STYLES);
}

export function getHomeworkReviewTone(status?: string | null) {
    return getToneClasses(status, HOMEWORK_REVIEW_STATUS_STYLES);
}

function getToneClasses(
    value: string | null | undefined,
    styles: Record<string, string>,
): ToneClasses {
    if (!value) {
        return DEFAULT_TONE;
    }

    const style = styles[value];

    if (!style) {
        return DEFAULT_TONE;
    }

    const [className, textClassName] = style.split(" ");

    if (!className || !textClassName) {
        return DEFAULT_TONE;
    }

    return { className, textClassName };
}
