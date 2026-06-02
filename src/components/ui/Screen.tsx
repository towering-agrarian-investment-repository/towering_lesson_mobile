import { cn } from "@/utils/cn";
import { ReactElement, ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    RefreshControlProps,
    ScrollView,
    View,
} from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

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
    edges?: Edge[];
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
    edges = headerShown ? ["left", "right"] : ["top", "left", "right"],
}: ScreenProps) {
    const horizontalPaddingClassName = horizontalPadding ? "px-6" : "";
    const baseContentClassName = cn(
        "flex-grow pt-4 pb-6",
        horizontalPaddingClassName,
    );

    return (
        <SafeAreaView className={cn("flex-1 bg-white", className)} edges={edges}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={
                    keyboardAware && Platform.OS === "ios" ? "padding" : undefined
                }
            >
                {scroll ? (
                    <ScrollView
                        className={cn("flex-1 bg-white", scrollClassName)}
                        contentContainerClassName={cn(
                            baseContentClassName,
                            contentClassName,
                        )}
                        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                        bounces={bounces}
                        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                        refreshControl={refreshControl}
                    >
                        {children}
                    </ScrollView>
                ) : (
                    <View
                        className={cn("flex-1 bg-white", baseContentClassName, contentClassName)}
                    >
                        {children}
                    </View>
                )}
                {footer}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
