import { Host, RNHostView } from "@expo/ui";
import { ArrangementView } from "@expo/ui/swift-ui";
import {
    arrangementViewStyle,
    frame,
    splitArrangementLayoutSize,
} from "@expo/ui/swift-ui/modifiers";
import { Platform, View, useWindowDimensions } from "react-native";
import {
    AdaptivePanels as FallbackPanels,
    type AdaptivePanelsProps,
} from "./AdaptivePanels.shared";

export function AdaptivePanels(props: AdaptivePanelsProps) {
    const { width } = useWindowDimensions();
    if (Number.parseFloat(String(Platform.Version)) < 27.1) {
        return <FallbackPanels {...props} />;
    }
    return (
        <Host matchContents={{ vertical: true }} ignoreSafeArea="all" style={{ width: "100%" }}>
            <ArrangementView
                modifiers={[
                    arrangementViewStyle("split", { axes: "both" }),
                    frame({ maxWidth: Infinity }),
                ]}
            >
                <ArrangementView.Primary>
                    <RNHostView
                        matchContents={{ vertical: true }}
                        modifiers={[
                            splitArrangementLayoutSize({
                                minWidth: Math.min(320, width - 32),
                            }),
                            frame({ maxWidth: Infinity }),
                        ]}
                    >
                        <View>{props.primary}</View>
                    </RNHostView>
                </ArrangementView.Primary>
                <ArrangementView.Secondary>
                    <RNHostView
                        matchContents={{ vertical: true }}
                        modifiers={[
                            splitArrangementLayoutSize({
                                minWidth: Math.min(320, width - 32),
                            }),
                            frame({ maxWidth: Infinity }),
                        ]}
                    >
                        <View>{props.secondary}</View>
                    </RNHostView>
                </ArrangementView.Secondary>
            </ArrangementView>
        </Host>
    );
}
