import { cn } from "@/utils/cn";
import { ReactElement, ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    RefreshControlProps,
    ScrollView,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
    children: ReactNode;
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

    const paddingTop = headerShown ? 16 : insets.top + 16;
    const paddingHorizontal = horizontalPadding ? 24 : 0;

    const scrollContentContainerStyle = {
        flexGrow: 1,
        paddingTop,
        paddingBottom: footer ? 24 : 24,
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
                        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                        contentInsetAdjustmentBehavior="automatic"
                        enableOnAndroid
                        extraScrollHeight={20}
                    >
                        <View className={cn("flex-1", contentClassName)}>
                            {children}
                        </View>
                    </KeyboardAwareScrollView>
                ) : (
                    <ScrollView
                        className={cn("flex-1 bg-background", scrollClassName)}
                        contentContainerStyle={scrollContentContainerStyle}
                        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                        contentInsetAdjustmentBehavior="automatic"
                    >
                        <View className={cn("flex-1", contentClassName)}>
                            {children}
                        </View>
                    </ScrollView>
                )
            ) : (
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={
                        keyboardAware && Platform.OS === "ios"
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
