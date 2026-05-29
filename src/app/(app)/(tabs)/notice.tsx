import { globalStyles } from '@/styles/global'
import { ScrollView, Text } from 'react-native'

type Props = {}

function NoticeScreen({ }: Props) {
    return (
        <ScrollView style={globalStyles.container}>
            <Text>
                Heyyyy
            </Text>
        </ScrollView>
    )
}

export default NoticeScreen