import type { ReactNode } from "react";
import { useState } from "react";
import { View } from "react-native";

const PANEL_GAP = 24;

export type AdaptivePanelsProps = {
    primary: ReactNode;
    secondary: ReactNode;
};

/** Uses the space assigned by the parent, including split-screen windows. */
export function AdaptivePanels({ primary, secondary }: AdaptivePanelsProps) {
    const [width, setWidth] = useState(0);
    const horizontal = width >= 720;
    const panelWidth = horizontal ? (width - PANEL_GAP) / 2 : "100%";
    return (
        <View
            onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
            style={{ width: "100%", flexDirection: horizontal ? "row" : "column", gap: PANEL_GAP }}
        >
            <View style={{ width: panelWidth, minWidth: 0 }}>
                {primary}
            </View>
            <View style={{ width: panelWidth, minWidth: 0 }}>
                {secondary}
            </View>
        </View>
    );
}
