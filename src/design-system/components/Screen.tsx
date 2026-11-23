import type { ReactElement, ReactNode } from "react";
import {
    ScrollView,
    View,
    type RefreshControlProps,
    type ScrollViewProps,
} from "react-native";
import {
    KeyboardAvoidingView,
    KeyboardAwareScrollView,
    KeyboardStickyView,
    KeyboardToolbar,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../utils/cn";

export const SCREEN_MAX_WIDTH = 430;
export const SCREEN_HORIZONTAL_PADDING = 16;

type ScreenProps = {
    children?: ReactNode;
    className?: string;
    contentClassName?: string;
    footer?: ReactNode;
    /** Disable when the parent navigator already insets the entire screen, as Android native tabs do. */
    footerSafeArea?: boolean;
    /** Adds bottom safe-area inset to content padding when no footer is present. Opt out inside Android native tabs. */
    bottomSafeArea?: boolean;
    bottomPadding?: number;
    headerShown?: boolean;
    horizontalPadding?: boolean;
    keyboardAware?: boolean;
    keyboardDismissMode?: ScrollViewProps["keyboardDismissMode"];
    keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
    scroll?: boolean;
    refreshControl?: ReactElement<RefreshControlProps>;
    contentInsetAdjustmentBehavior?: ScrollViewProps["contentInsetAdjustmentBehavior"];
};

export function Screen({
    children,
    className,
    contentClassName,
    footer,
    footerSafeArea = true,
    bottomSafeArea,
    bottomPadding = 24,
    headerShown = true,
    horizontalPadding = true,
    keyboardAware = false,
    keyboardDismissMode = "on-drag",
    keyboardShouldPersistTaps = "handled",
    scroll = true,
    refreshControl,
    contentInsetAdjustmentBehavior = "automatic",
}: ScreenProps) {
    const insets = useSafeAreaInsets();
    const edgePadding = horizontalPadding ? SCREEN_HORIZONTAL_PADDING : 0;
    const automaticTopInset = scroll && process.env.EXPO_OS === "ios" && contentInsetAdjustmentBehavior !== "never";
    const resolvedBottomSafeArea = bottomSafeArea ?? !footer;
    const bodyStyle = {
        width: "100%",
        maxWidth: SCREEN_MAX_WIDTH,
        alignSelf: "center",
        paddingTop: headerShown || automaticTopInset ? 16 : insets.top + 16,
        paddingBottom: bottomPadding + (resolvedBottomSafeArea ? insets.bottom : 0),
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
        keyboardShouldPersistTaps,
        keyboardDismissMode,
        showsVerticalScrollIndicator: false,
        refreshControl,
        contentInsetAdjustmentBehavior,
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

    const footerNode = footer ? (
        <View
            className="border-t border-border bg-background"
            style={{
                paddingBottom: footerSafeArea ? insets.bottom : 0,
            }}
        >
            <View
                style={{
                    width: "100%",
                    maxWidth: SCREEN_MAX_WIDTH,
                    alignSelf: "center",
                    paddingVertical: 16,
                    paddingLeft: Math.max(SCREEN_HORIZONTAL_PADDING, insets.left),
                    paddingRight: Math.max(SCREEN_HORIZONTAL_PADDING, insets.right),
                }}
            >
                {footer}
            </View>
        </View>
    ) : null;

    return (
        <RootContainer
            className={cn("flex-1 bg-background", className)}
            {...(needsKeyboardAvoidance
                ? { automaticOffset: true, behavior: "padding" as const }
                : {})}
        >
            {screenContent}
            {footerNode ? (
                keyboardAware && scroll ? (
                    <KeyboardStickyView
                        offset={{
                            closed: 0,
                            opened: footerSafeArea ? insets.bottom : 0,
                        }}
                    >
                        {footerNode}
                    </KeyboardStickyView>
                ) : (
                    footerNode
                )
            ) : null}
            {keyboardAware ? <KeyboardToolbar /> : null}
        </RootContainer>
    );
}
