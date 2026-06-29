import { cn } from "../utils/cn";
import { ReactElement, ReactNode } from "react";
import {
    KeyboardAvoidingView,
    RefreshControlProps,
    ScrollView,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotionView } from "./MotionView";

type ScreenProps = {
    children?: ReactNode;
    className?: string;
    contentClassName?: string;
    scrollClassName?: string;
    footer?: ReactNode;
    headerShown?: boolean;
    horizontalPadding?: boolean;
    keyboardAware?: boolean;
    scroll?: boolean;
    refreshControl?: ReactElement<RefreshControlProps>;
    bounces?: boolean;
    showsVerticalScrollIndicator?: boolean;
    keyboardShouldPersistTaps?: "always" | "handled" | "never";
};

export function Screen({
    children,
    className,
    contentClassName,
    scrollClassName,
    footer,
    headerShown = true,
    horizontalPadding = true,
    keyboardAware = false,
    scroll = true,
    refreshControl,
    bounces = false,
    showsVerticalScrollIndicator = false,
    keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
    const insets = useSafeAreaInsets();
    const resolvedKeyboardShouldPersistTaps = keyboardAware
        ? "always"
        : keyboardShouldPersistTaps;

    const paddingTop = headerShown ? 16 : insets.top + 16;
    const paddingHorizontal = horizontalPadding ? 24 : 0;

    const scrollContentContainerStyle = {
        flexGrow: 1,
        paddingTop,
        paddingBottom: 24,
        paddingHorizontal,
    } as const;

    const fixedContentStyle = {
        flex: 1,
        paddingTop,
        paddingBottom: 24,
        paddingHorizontal,
    } as const;

    return (
        <View className={cn("flex-1 bg-background", className)}>
            {scroll ? (
                keyboardAware ? (
                    <KeyboardAwareScrollView
                        className={cn("flex-1 bg-background", scrollClassName)}
                        contentContainerStyle={scrollContentContainerStyle}
                        keyboardShouldPersistTaps={resolvedKeyboardShouldPersistTaps}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                        contentInsetAdjustmentBehavior="automatic"
                        enableOnAndroid
                        extraScrollHeight={20}
                    >
                        <MotionView className={cn("flex-1", contentClassName)}>
                            {children}
                        </MotionView>
                    </KeyboardAwareScrollView>
                ) : (
                    <ScrollView
                        className={cn("flex-1 bg-background", scrollClassName)}
                        contentContainerStyle={scrollContentContainerStyle}
                        keyboardShouldPersistTaps={resolvedKeyboardShouldPersistTaps}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                        contentInsetAdjustmentBehavior="automatic"
                    >
                        <MotionView className={cn("flex-1", contentClassName)}>
                            {children}
                        </MotionView>
                    </ScrollView>
                )
            ) : (
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={
                        keyboardAware && process.env.EXPO_OS === "ios"
                            ? "padding"
                            : undefined
                    }
                >
                    <View
                        className={cn("flex-1", contentClassName)}
                        style={fixedContentStyle}
                    >
                        <MotionView className="flex-1">
                            {children}
                        </MotionView>
                    </View>
                </KeyboardAvoidingView>
            )}

            {footer ? (
                <View
                    style={{
                        paddingBottom: insets.bottom,
                    }}
                >
                    {footer}
                </View>
            ) : null}
        </View>
    );
}
