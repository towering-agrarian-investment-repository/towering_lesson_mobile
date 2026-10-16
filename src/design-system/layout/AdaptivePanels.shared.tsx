import type { ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";

export type AdaptivePanelsProps = {
    primary: ReactNode;
    secondary: ReactNode;
};

/** Uses the space assigned by the parent, including split-screen windows. */
export function AdaptivePanels({ primary, secondary }: AdaptivePanelsProps) {
    const [width, setWidth] = useState(0);
    const horizontal = width >= 720;
    return (
        <View
            onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
            style={{ flexDirection: horizontal ? "row" : "column", gap: 24 }}
        >
            <View style={{ flex: horizontal ? 1 : undefined, minWidth: 0 }}>
                {primary}
            </View>
            <View style={{ flex: horizontal ? 1 : undefined, minWidth: 0 }}>
                {secondary}
            </View>
        </View>
    );
}
