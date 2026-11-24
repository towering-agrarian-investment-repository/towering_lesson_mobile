import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { Linking } from "react-native";

export async function openExternalUrl(url: string, colors: { primary: string; card: string }): Promise<void> {
    if (/^https?:\/\//i.test(url)) {
        try {
            await openBrowserAsync(url, {
                presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
                controlsColor: colors.primary,
                dismissButtonStyle: "close",
                toolbarColor: colors.card,
                showTitle: true,
                enableBarCollapsing: true,
                createTask: false,
            });
            return;
        } catch {
            // Use the system URL handler when the browser cannot be presented.
        }
    }

    await Linking.openURL(url);
}
