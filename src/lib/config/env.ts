const apiBaseUrl = getRequiredEnvValue(
        "EXPO_PUBLIC_API_BASE_URL",
        process.env.EXPO_PUBLIC_API_BASE_URL,
    );

export const env = {
    apiBaseUrl,
    authBaseUrl: getRequiredEnvValue(
        "EXPO_PUBLIC_AUTH_BASE_URL",
        process.env.EXPO_PUBLIC_AUTH_BASE_URL,
    ),
    appVersionUrl:
        process.env.EXPO_PUBLIC_APP_VERSION_URL?.trim() ||
        `${apiBaseUrl}/app/version`,
} as const;

function getRequiredEnvValue(name: string, rawValue: string | undefined) {
    const value = rawValue?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}
