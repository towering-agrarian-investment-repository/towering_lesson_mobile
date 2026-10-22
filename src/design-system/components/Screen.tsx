import type { ReactElement, ReactNode } from "react";
import {
    Keyboard,
    ScrollView,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
    type RefreshControlProps,
} from "react-native";
import {
    KeyboardAvoidingView,
    KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../utils/cn";

type ScreenProps = {
    children?: ReactNode;
    className?: string;
    contentClassName?: string;
    footer?: ReactNode;
    /** Disable when a bottom tab bar already handles the safe area. */
    footerSafeArea?: boolean;
    bottomPadding?: number;
    headerShown?: boolean;
    horizontalPadding?: boolean;
    keyboardAware?: boolean;
    scroll?: boolean;
    refreshControl?: ReactElement<RefreshControlProps>;
    maxWidth?: number;
};

export function Screen({
    children,
    className,
    contentClassName,
    footer,
    footerSafeArea = true,
    bottomPadding = 24,
    headerShown = true,
    horizontalPadding = true,
    keyboardAware = false,
    scroll = true,
    refreshControl,
    maxWidth = 1280,
}: ScreenProps) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const edgePadding = horizontalPadding ? (width >= 768 ? 24 : 16) : 0;
    const bodyStyle = {
        width: "100%",
        maxWidth,
        alignSelf: "center",
        paddingTop: headerShown ? 16 : insets.top + 16,
        paddingBottom: bottomPadding,
        paddingLeft: Math.max(edgePadding, insets.left),
        paddingRight: Math.max(edgePadding, insets.right),
    } as const;
    const content = (
        <View className={scroll ? "grow" : "flex-1"} style={bodyStyle}>
            <View className={cn(scroll ? "grow" : "flex-1", contentClassName)}>
                {children}
            </View>
        </View>
    );
    const scrollProps = {
        className: "flex-1 bg-background",
        contentContainerStyle: { flexGrow: 1 },
        keyboardShouldPersistTaps: "handled",
        keyboardDismissMode:
            process.env.EXPO_OS === "ios" ? "interactive" : "on-drag",
        showsVerticalScrollIndicator: false,
        refreshControl,
        contentInsetAdjustmentBehavior: headerShown ? "automatic" : "never",
    } as const;
    const screenContent = scroll ? (
        keyboardAware ? (
            <KeyboardAwareScrollView {...scrollProps} bottomOffset={20}>
                {content}
            </KeyboardAwareScrollView>
        ) : (
            <ScrollView {...scrollProps}>{content}</ScrollView>
        )
    ) : (
        content
    );
    // Disabled KeyboardAvoidingView instances still install animation hooks and
    // measure their native position. Scrolling forms already handle the keyboard
    // in KeyboardAwareScrollView; other screens only need a plain View.
    const needsKeyboardAvoidance = keyboardAware && !scroll;
    const RootContainer = needsKeyboardAvoidance ? KeyboardAvoidingView : View;

    return (
        <RootContainer
            className={cn("flex-1 bg-background", className)}
            {...(needsKeyboardAvoidance
                ? { automaticOffset: true, behavior: "padding" as const }
                : {})}
        >
            {keyboardAware ? (
                <TouchableWithoutFeedback
                    accessible={false}
                    onPress={Keyboard.dismiss}
                >
                    {screenContent}
                </TouchableWithoutFeedback>
            ) : (
                screenContent
            )}
            {footer ? (
                <View
                    className="border-t border-border bg-background"
                    style={{
                        paddingBottom: footerSafeArea ? insets.bottom : 0,
                    }}
                >
                    <View
                        style={{
                            width: "100%",
                            maxWidth: Math.min(maxWidth, 640),
                            alignSelf: "center",
                            paddingLeft: Math.max(edgePadding, insets.left),
                            paddingRight: Math.max(edgePadding, insets.right),
                        }}
                    >
                        {footer}
                    </View>
                </View>
            ) : null}
        </RootContainer>
    );
}
