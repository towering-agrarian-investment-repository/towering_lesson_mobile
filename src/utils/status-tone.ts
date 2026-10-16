type Tone = {
    className: string;
    color: "mutedForeground" | "primary" | "success" | "warning" | "danger";
};

const neutral: Tone = { className: "bg-muted", color: "mutedForeground" };
const primary: Tone = { className: "bg-primary/10", color: "primary" };
const success: Tone = { className: "bg-success/10", color: "success" };
const warning: Tone = { className: "bg-warning/10", color: "warning" };
const danger: Tone = { className: "bg-danger/10", color: "danger" };

export function getLessonStatusTone(status?: string | null): Tone {
    return (
        (
            {
                SCHEDULED: warning,
                IN_PROGRESS: primary,
                COMPLETED: success,
                CANCELLED: danger,
            } as Record<string, Tone>
        )[status ?? ""] ?? neutral
    );
}

export function getSessionStatusTone(status?: string | null): Tone {
    return (
        (
            {
                PENDING: primary,
                IN_PROGRESS: warning,
                COMPLETED: success,
                CANCELLED: danger,
            } as Record<string, Tone>
        )[status ?? ""] ?? neutral
    );
}

export function getSessionTypeTone(type?: string | null): Tone {
    return (
        ({ DRILL: primary, NON_DRILL: warning } as Record<string, Tone>)[
            type ?? ""
        ] ?? neutral
    );
}

export function getHomeworkSubmissionTone(status?: string | null): Tone {
    return (
        (
            {
                SUBMITTED: primary,
                REVIEWED: success,
                RETURNED: warning,
            } as Record<string, Tone>
        )[status ?? ""] ?? neutral
    );
}

export function getHomeworkReviewTone(status?: string | null): Tone {
    return (
        ({ PENDING: warning, CONFIRMED: success } as Record<string, Tone>)[
            status ?? ""
        ] ?? neutral
    );
}
