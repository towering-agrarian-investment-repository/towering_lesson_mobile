export const env = {
    apiBaseUrl: getRequiredEnvValue(
        "EXPO_PUBLIC_API_BASE_URL",
        process.env.EXPO_PUBLIC_API_BASE_URL,
    ),
    authBaseUrl: getRequiredEnvValue(
        "EXPO_PUBLIC_AUTH_BASE_URL",
        process.env.EXPO_PUBLIC_AUTH_BASE_URL,
    ),
} as const;

function getRequiredEnvValue(name: string, rawValue: string | undefined) {
    const value = rawValue?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}
