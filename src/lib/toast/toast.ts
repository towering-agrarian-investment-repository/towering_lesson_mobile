type ToastType = "success" | "error" | "warning" | "info";

type ToastPosition = "top" | "bottom";

type ToastOptions = {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: ToastPosition;
};

type ToastHandler = (options: ToastOptions) => void;

let toastHandler: ToastHandler | null = null;

export function registerToastHandler(handler: ToastHandler | null) {
    toastHandler = handler;
}

export function showAppToast({
    message,
    type = "info",
    duration = 3000,
    position = "bottom",
}: ToastOptions) {
    const normalizedMessage = message.trim();

    if (!normalizedMessage) return;

    if (!toastHandler) {
        console.warn(`Toast not ready: ${normalizedMessage}`);
        return;
    }

    toastHandler({
        message: normalizedMessage,
        type,
        duration,
        position,
    });
}
