import { View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import {
    AppText,
    Badge,
    Button,
    Card,
    Container,
    Divider,
    Input,
    Row,
    Stack,
} from "@/design-system";

export default function DesignSystemDemoScreen() {
    return (
        <Screen scroll contentClassName="gap-6">
            <Container className="px-0">
                <Stack className="gap-2">
                    <AppText variant="h1">Welcome</AppText>
                    <AppText variant="muted">
                        Build once, ship cleanly to Android and iOS.
                    </AppText>
                </Stack>
            </Container>

            <Card className="gap-4">
                <Badge label="Design System Ready" variant="success" />

                <Input label="Email" placeholder="you@example.com" />
                <Input label="Password" placeholder="Password" secureTextEntry />

                <Divider />

                <Row className="gap-3">
                    <Button title="Sign in" className="flex-1" />
                    <Button title="Secondary" variant="secondary" className="flex-1" />
                </Row>

                <Button title="Delete" variant="danger" />
            </Card>

            <Card className="gap-3">
                <AppText variant="h3">Semantic Tokens</AppText>

                <View className="flex-row flex-wrap gap-2">
                    <Badge label="Default" />
                    <Badge label="Success" variant="success" />
                    <Badge label="Warning" variant="warning" />
                    <Badge label="Danger" variant="danger" />
                </View>
            </Card>
        </Screen>
    );
}
