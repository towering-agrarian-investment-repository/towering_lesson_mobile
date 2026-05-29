import { authClient } from "@/lib/auth-client";
import { Href, router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function LoginScreen() {
    const { data: session, isPending } = authClient.useSession();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const isFormValid = username.trim().length > 0 && password.length > 0;

    useEffect(() => {
        if (!isPending && session) {
            router.replace("/(app)/(tabs)" as Href);
        }
    }, [isPending, session]);

    async function handleLogin() {
        setErrorMessage("");

        if (!isFormValid) {
            setErrorMessage("Please enter your username and password.");
            return;
        }

        try {
            setIsLoggingIn(true);

            const { error } = await authClient.signIn.username({
                username: username.trim(),
                password,
            });

            if (error) {
                setErrorMessage(error.message || "Invalid username or password.");
                return;
            }

            router.replace("/(app)/(tabs)" as Href);
        } catch {
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setIsLoggingIn(false);
        }
    }

    if (isPending) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Login to your golf lesson account</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoggingIn}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isLoggingIn}
                        />
                    </View>

                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}

                    <Pressable
                        style={[
                            styles.loginButton,
                            (!isFormValid || isLoggingIn) && styles.loginButtonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={!isFormValid || isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F5F7FA",
        justifyContent: "center",
        padding: 24,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
    },
    header: {
        marginBottom: 28,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: 16,
        backgroundColor: "#FFFFFF",
    },
    errorText: {
        color: "#DC2626",
        fontSize: 14,
        textAlign: "center",
    },
    loginButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: "#16A34A",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    loginButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});