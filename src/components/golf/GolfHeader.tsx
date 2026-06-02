import { Image, StyleSheet, View } from 'react-native'

function GolfHeader() {
    return (
        <View style={style.container}>
            <Image
                source={require('../../../assets/golf/drawable-xxxhdpi/happygolf_toolbar_logo.png')}
                style={{
                    width: 260,
                    height: 52,
                    resizeMode: "contain",
                }}
            />
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        paddingTop: 20,
    }
})

export default GolfHeader
