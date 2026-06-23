import { AppText as Text } from "@/design-system";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
 
type Props = {};

function SelectTimePicker({ }: Props) {
    const { t } = useTranslation();

    return (
        <View>
            <Text>{t("common.time")}</Text>
        </View>
    );
}

export default SelectTimePicker;
