import { AppText } from "./AppText";
import { cn } from "../utils/cn";

type InlineStateTone = "neutral" | "danger";

type InlineStateProps = {
    title: string;
    message?: string;
    tone?: InlineStateTone;
    className?: string;
};

export function InlineState({
    title,
    message,
    tone = "neutral",
    className,
}: InlineStateProps) {
    return (
        <AppText
            selectable
            variant="meta"
            className={cn(
                "px-1 py-2 text-center leading-6",
                tone === "danger" ? "text-danger" : "text-muted-foreground",
                className,
            )}
        >
            {message ? `${title}. ${message}` : title}
        </AppText>
    );
}
