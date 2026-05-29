import { globalStyles } from '@/styles/global'
import { ScrollView, Text } from 'react-native'

type Props = {}

function reservation({ }: Props) {
    return (
        <ScrollView style={globalStyles.container}>
            <Text style={globalStyles.title}>
                Reservation
            </Text>
        </ScrollView>
    )
}

export default reservation