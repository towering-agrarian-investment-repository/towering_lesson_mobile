const apiBaseUrl = getRequiredEnvValue("EXPO_PUBLIC_API_BASE_URL", process.env.EXPO_PUBLIC_API_BASE_URL);

export const env = {
    apiBaseUrl,
    authBaseUrl: getRequiredEnvValue("EXPO_PUBLIC_AUTH_BASE_URL", process.env.EXPO_PUBLIC_AUTH_BASE_URL),
    appVersionUrl: process.env.EXPO_PUBLIC_APP_VERSION_URL?.trim() || `${apiBaseUrl}/app/version`,
    // No bundled fallback: crash reporting stays off until a DSN is configured
    // in the EAS environment, so local runs never report into the hosted project.
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || undefined,
    sentryEnvironment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT?.trim() || "local",
} as const;

function getRequiredEnvValue(name: string, rawValue: string | undefined) {
    const value = rawValue?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}
