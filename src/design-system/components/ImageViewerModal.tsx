import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import X from "lucide-react-native/icons/x";
import { useTranslation } from "react-i18next";
import { Modal, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "../utils/theme";
import { AnimatedPressable } from "./AnimatedPressable";
import { AppText } from "./AppText";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 700;
const SPRING_CONFIG = { damping: 24, stiffness: 260, mass: 0.9 };

export type ImageViewerModalProps = {
    visible: boolean;
    imageUri: string | null;
    title?: string;
    accessibilityLabel?: string;
    onClose: () => void;
};

export function ImageViewerModal({ visible, imageUri, title, accessibilityLabel, onClose }: ImageViewerModalProps) {
    if (!visible || !imageUri) {
        return null;
    }

    return (
        <ImageViewerContent
            key={imageUri}
            imageUri={imageUri}
            title={title}
            accessibilityLabel={accessibilityLabel}
            onClose={onClose}
        />
    );
}

function ImageViewerContent({
    imageUri,
    title,
    accessibilityLabel,
    onClose,
}: {
    imageUri: string;
    title?: string;
    accessibilityLabel?: string;
    onClose: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();
    const { width, height } = useWindowDimensions();

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const chromeOpacity = useSharedValue(1);

    const closeTargetLabel = title || accessibilityLabel || t("profile.viewProfilePhoto");

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            const nextScale = Math.min(MAX_SCALE, Math.max(0.85, savedScale.get() * event.scale));
            scale.set(nextScale);
        })
        .onEnd(() => {
            const current = scale.get();
            if (current <= MIN_SCALE + 0.02) {
                scale.set(reducedMotion ? 1 : withSpring(1, SPRING_CONFIG));
                savedScale.set(1);
                translateX.set(reducedMotion ? 0 : withSpring(0, SPRING_CONFIG));
                translateY.set(reducedMotion ? 0 : withSpring(0, SPRING_CONFIG));
                savedTranslateX.set(0);
                savedTranslateY.set(0);
            } else {
                const clamped = Math.min(MAX_SCALE, current);
                savedScale.set(clamped);
                const maxX = ((clamped - 1) * width) / 2;
                const maxY = ((clamped - 1) * height) / 2;
                const clampedX = Math.max(-maxX, Math.min(maxX, translateX.get()));
                const clampedY = Math.max(-maxY, Math.min(maxY, translateY.get()));
                translateX.set(reducedMotion ? clampedX : withSpring(clampedX, SPRING_CONFIG));
                translateY.set(reducedMotion ? clampedY : withSpring(clampedY, SPRING_CONFIG));
                savedTranslateX.set(clampedX);
                savedTranslateY.set(clampedY);
            }
        });

    const panGesture = Gesture.Pan()
        .maxPointers(2)
        .onUpdate((event) => {
            const currentScale = scale.get();
            if (currentScale > 1.02) {
                const maxX = ((currentScale - 1) * width) / 2;
                const maxY = ((currentScale - 1) * height) / 2;
                translateX.set(Math.max(-maxX, Math.min(maxX, savedTranslateX.get() + event.translationX)));
                translateY.set(Math.max(-maxY, Math.min(maxY, savedTranslateY.get() + event.translationY)));
            } else {
                translateY.set(event.translationY);
                translateX.set(event.translationX * 0.25);
            }
        })
        .onEnd((event) => {
            const currentScale = scale.get();
            if (currentScale > 1.02) {
                savedTranslateX.set(translateX.get());
                savedTranslateY.set(translateY.get());
                return;
            }

            const shouldDismiss =
                Math.abs(translateY.get()) > DISMISS_DISTANCE || Math.abs(event.velocityY) > DISMISS_VELOCITY;

            if (shouldDismiss) {
                const direction = translateY.get() >= 0 ? 1 : -1;
                if (reducedMotion) {
                    scheduleOnRN(onClose);
                } else {
                    translateY.set(
                        withTiming(direction * Math.max(height * 0.45, 320), { duration: 180 }, (finished) => {
                            if (finished) {
                                scheduleOnRN(onClose);
                            }
                        }),
                    );
                }
            } else {
                translateX.set(reducedMotion ? 0 : withSpring(0, SPRING_CONFIG));
                translateY.set(reducedMotion ? 0 : withSpring(0, SPRING_CONFIG));
                savedTranslateX.set(0);
                savedTranslateY.set(0);
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onEnd((event) => {
            if (scale.get() > 1.05) {
                scale.set(reducedMotion ? 1 : withSpring(1, SPRING_CONFIG));
                savedScale.set(1);
                translateX.set(reducedMotion ? 0 : withSpring(0, SPRING_CONFIG));
                translateY.set(reducedMotion ? 0 : withSpring(0, SPRING_CONFIG));
                savedTranslateX.set(0);
                savedTranslateY.set(0);
            } else {
                const target = DOUBLE_TAP_SCALE;
                const maxX = ((target - 1) * width) / 2;
                const maxY = ((target - 1) * height) / 2;
                const nextX = Math.max(-maxX, Math.min(maxX, (width / 2 - event.x) * (target - 1)));
                const nextY = Math.max(-maxY, Math.min(maxY, (height / 2 - event.y) * (target - 1)));
                scale.set(reducedMotion ? target : withSpring(target, SPRING_CONFIG));
                savedScale.set(target);
                translateX.set(reducedMotion ? nextX : withSpring(nextX, SPRING_CONFIG));
                translateY.set(reducedMotion ? nextY : withSpring(nextY, SPRING_CONFIG));
                savedTranslateX.set(nextX);
                savedTranslateY.set(nextY);
            }
        });

    const singleTapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .onEnd(() => {
            const nextOpacity = chromeOpacity.get() > 0.5 ? 0 : 1;
            chromeOpacity.set(reducedMotion ? nextOpacity : withTiming(nextOpacity, { duration: 160 }));
        });

    const composedGesture = Gesture.Simultaneous(
        pinchGesture,
        panGesture,
        Gesture.Exclusive(doubleTapGesture, singleTapGesture),
    );

    const backdropAnimatedStyle = useAnimatedStyle(() => {
        const dragOpacity =
            scale.get() <= 1.02 ? interpolate(Math.abs(translateY.get()), [0, 240], [1, 0.2], Extrapolation.CLAMP) : 1;
        return { opacity: dragOpacity };
    });

    const imageAnimatedStyle = useAnimatedStyle(() => {
        const dragScale =
            scale.get() <= 1.02 ? interpolate(Math.abs(translateY.get()), [0, 240], [1, 0.88], Extrapolation.CLAMP) : 1;
        return {
            transform: [
                { translateX: translateX.get() },
                { translateY: translateY.get() },
                { scale: scale.get() * dragScale },
            ],
        };
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const dragFade =
            scale.get() <= 1.02 ? interpolate(Math.abs(translateY.get()), [0, 80], [1, 0], Extrapolation.CLAMP) : 1;
        return { opacity: chromeOpacity.get() * dragFade };
    });

    return (
        <Modal
            visible
            transparent
            animationType={reducedMotion ? "none" : "fade"}
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="light" />
                <View className="flex-1">
                    <Animated.View
                        pointerEvents="none"
                        className="absolute inset-0 bg-media-background"
                        style={backdropAnimatedStyle}
                    />

                    <GestureDetector gesture={composedGesture}>
                        <Animated.View className="flex-1 items-center justify-center" style={imageAnimatedStyle}>
                            <Image
                                source={{ uri: imageUri }}
                                cachePolicy="memory-disk"
                                recyclingKey={imageUri}
                                contentFit="contain"
                                transition={reducedMotion ? 0 : 150}
                                style={{ width, height }}
                                accessibilityLabel={closeTargetLabel}
                            />
                        </Animated.View>
                    </GestureDetector>

                    <Animated.View
                        pointerEvents="box-none"
                        className="absolute inset-x-0 top-0 flex-row items-center justify-between gap-3"
                        style={[
                            headerAnimatedStyle,
                            {
                                paddingTop: insets.top + 8,
                                paddingLeft: Math.max(insets.left, 16),
                                paddingRight: Math.max(insets.right, 16),
                            },
                        ]}
                    >
                        {title ? (
                            <View className="min-w-0 flex-1 rounded-full bg-scrim px-3.5 py-2">
                                <AppText
                                    variant="subtext"
                                    color="mediaForeground"
                                    numberOfLines={1}
                                    textStyle={{ fontWeight: "600" }}
                                >
                                    {title}
                                </AppText>
                            </View>
                        ) : (
                            <View className="flex-1" />
                        )}

                        <AnimatedPressable
                            accessibilityRole="button"
                            accessibilityLabel={t("common.closeTitle", {
                                title: closeTargetLabel,
                            })}
                            haptic="selection"
                            className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-scrim-control"
                            onPress={onClose}
                        >
                            <X size={24} color={colors.mediaForeground} />
                        </AnimatedPressable>
                    </Animated.View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}
