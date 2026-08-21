import { cn } from "../utils/cn";
import { ReactElement, ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Keyboard,
    RefreshControlProps,
    ScrollView,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    keyboardAware = true,
    scroll = true,
    refreshControl,
    bounces = false,
    showsVerticalScrollIndicator = false,
    keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
    const insets = useSafeAreaInsets();
    const resolvedKeyboardShouldPersistTaps = keyboardShouldPersistTaps;

    const paddingTop = headerShown ? 16 : insets.top + 16;
    const paddingHorizontal = horizontalPadding ? 20 : 0;

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
            <TouchableWithoutFeedback
                accessible={false}
                onPress={Keyboard.dismiss}
            >
                {scroll ? (
                    keyboardAware ? (
                        <KeyboardAwareScrollView
                        className={cn("flex-1 bg-background", scrollClassName)}
                        contentContainerStyle={scrollContentContainerStyle}
                        keyboardShouldPersistTaps={resolvedKeyboardShouldPersistTaps}
                        keyboardDismissMode={process.env.EXPO_OS === "ios" ? "interactive" : "on-drag"}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                        contentInsetAdjustmentBehavior="automatic"
                        enableOnAndroid
                        extraScrollHeight={20}
                        >
                            <View className={cn("flex-1", contentClassName)}>{children}</View>
                        </KeyboardAwareScrollView>
                    ) : (
                        <ScrollView
                        className={cn("flex-1 bg-background", scrollClassName)}
                        contentContainerStyle={scrollContentContainerStyle}
                        keyboardShouldPersistTaps={resolvedKeyboardShouldPersistTaps}
                        keyboardDismissMode={process.env.EXPO_OS === "ios" ? "interactive" : "on-drag"}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                        contentInsetAdjustmentBehavior="automatic"
                        >
                            <View className={cn("flex-1", contentClassName)}>{children}</View>
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
                            {children}
                        </View>
                    </KeyboardAvoidingView>
                )}
            </TouchableWithoutFeedback>

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
