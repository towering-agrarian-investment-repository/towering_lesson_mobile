import type { ReactNode } from "react";
import Animated, {
    FadeInDown,
    LinearTransition,
} from "react-native-reanimated";
import { cn } from "../utils/cn";

type MotionViewProps = {
    children: ReactNode;
    className?: string;
    delayMs?: number;
};

export function MotionView({
    children,
    className,
    delayMs = 0,
}: MotionViewProps) {
    return (
        <Animated.View
            entering={FadeInDown.duration(220).delay(delayMs)}
            layout={LinearTransition.duration(180)}
            className={cn(className)}
        >
            {children}
        </Animated.View>
    );
}
