import { cn } from "../utils/cn";
import { ReactElement, ReactNode } from "react";
import {
    Keyboard,
    RefreshControlProps,
    ScrollView,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import {
    KeyboardAwareScrollView,
    KeyboardAvoidingView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
    children?: ReactNode;
    className?: string;
    contentClassName?: string;
    footer?: ReactNode;
    headerShown?: boolean;
    horizontalPadding?: boolean;
    keyboardAware?: boolean;
    scroll?: boolean;
    refreshControl?: ReactElement<RefreshControlProps>;
};

export function Screen({
    children,
    className,
    contentClassName,
    footer,
    headerShown = true,
    horizontalPadding = true,
    keyboardAware = false,
    scroll = true,
    refreshControl,
}: ScreenProps) {
    const insets = useSafeAreaInsets();
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

    const screenContent = (
        scroll ? (
            keyboardAware ? (
                <KeyboardAwareScrollView
                    className="flex-1 bg-background"
                    contentContainerStyle={scrollContentContainerStyle}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={process.env.EXPO_OS === "ios" ? "interactive" : "on-drag"}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    refreshControl={refreshControl}
                    contentInsetAdjustmentBehavior={
                        headerShown ? "automatic" : "never"
                    }
                    bottomOffset={20}
                >
                    <View className={cn("flex-1", contentClassName)}>{children}</View>
                </KeyboardAwareScrollView>
            ) : (
                <ScrollView
                    className="flex-1 bg-background"
                    contentContainerStyle={scrollContentContainerStyle}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={process.env.EXPO_OS === "ios" ? "interactive" : "on-drag"}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    refreshControl={refreshControl}
                    contentInsetAdjustmentBehavior={
                        headerShown ? "automatic" : "never"
                    }
                >
                    <View className={cn("flex-1", contentClassName)}>{children}</View>
                </ScrollView>
            )
        ) : (
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
                    enabled={keyboardAware}
            >
                <View
                    className={cn("flex-1", contentClassName)}
                    style={fixedContentStyle}
                >
                    {children}
                </View>
            </KeyboardAvoidingView>
        )
    );

    const dismissibleScreenContent = keyboardAware ? (
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
            {screenContent}
        </TouchableWithoutFeedback>
    ) : (
        screenContent
    );

    return (
        <View className={cn("flex-1 bg-background", className)}>
            {dismissibleScreenContent}

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
