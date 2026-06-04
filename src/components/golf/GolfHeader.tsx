import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

function GolfHeader() {
    return (
        <View style={style.container}>
            <Image
                source={require('../../../assets/images/happygolf_toolbar_logo.png')}
                style={{
                    width: 150,
                    height: 50,
                }}
                contentFit="contain"
            />
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
        display: "flex"
    }
})

export default GolfHeader
