import { Image, StyleSheet, View } from 'react-native'

type Props = {}

function GolfHeader({ }: Props) {
    return (
        <View style={style.container}>
            <Image
                source={require('../../../assets/images/happy-logo.jpg')}
                style={{
                    width: 400,
                    height: 80,
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