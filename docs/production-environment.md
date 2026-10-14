# Production environment

This app uses the same EAS project for staging and production. Each build
profile in `eas.json` explicitly selects its EAS environment and update channel:

| Build profile | EAS environment | Update channel | Backend |
| --- | --- | --- | --- |
| development | development | development | Local backend |
| preview | preview | preview | Staging |
| production | production | production | Production |

## Configure Expo variables

Open the project's **Settings > Environment variables** in the Expo dashboard.
Keep the existing staging URL entries assigned to `preview`. The development
build profile sets local API, auth, app-version, and Sentry values in `eas.json`.
For running the development client with Metro, use local `.env` files as described
in [Local development](local-development.md).
Use **Add Variables** to create entries with the same names, production values,
and only `production` selected:

| Variable | Production value | Visibility |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.happy-lesson.com/api/v1` | Plain text |
| `EXPO_PUBLIC_AUTH_BASE_URL` | `https://auth.happy-lesson.com/api/member/auth` | Plain text |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | `production` | Plain text |
| `SENTRY_AUTH_TOKEN` | Shared Sentry upload token authorized for the configured organization and project | Sensitive |

Do not select `production` on the existing staging URL or Sentry environment
entries: that would reuse their staging values. The Sentry upload token can be
shared across environments if it has the required permissions for the same
Sentry project configured in `app.json`.

The shared `SENTRY_AUTH_TOKEN` is assigned to `development`, `preview`, and
`production` with Sensitive visibility. If a token is exposed, revoke it in
Sentry and replace this variable's value for all three environments. Changing
Expo visibility does not revoke or rotate the Sentry token.

`EXPO_PUBLIC_` values are embedded in the app bundle and are public. Keep
`SENTRY_AUTH_TOKEN` without that prefix and out of source code. A Secret token
is available to EAS cloud builds, but cannot be fetched for local source-map
uploads after EAS Update. For those uploads, use Sensitive visibility or supply
the token through the local/CI environment.

Use HTTPS URLs for production. Confirm the full paths with the backend team;
changing only the host may not be sufficient. The app requires both base URLs
and fails startup if either is missing. Its app-version endpoint defaults to
`EXPO_PUBLIC_API_BASE_URL + /app/version`. If production hosts that endpoint
elsewhere, also set `EXPO_PUBLIC_APP_VERSION_URL` in the production environment.

## Build and update

After the production variables are configured, build with:

```sh
eas build --profile production --platform all
```

For subsequent JavaScript updates compatible with the production runtime:

```sh
eas update --channel production --environment production --message "Production update"
```

The profile's `environment` selects the build variables. The update channel
selects the update audience; `--environment production` selects the update
variables. Always specify both when publishing production updates. With this
flag, EAS Update uses the selected EAS variables instead of local `.env` files.

Editing dashboard variables alone does not change an installed app. Produce
a new build or a compatible update to embed the changed public values.

Before releasing, verify login, session restore, API calls, the app-version
check, and Sentry's `production` environment on Android and iOS.

## References

- [Create and manage EAS variables](https://docs.expo.dev/eas/environment-variables/manage/)
- [Use EAS variables with builds and updates](https://docs.expo.dev/eas/environment-variables/usage/)
- [Sentry with Expo](https://docs.expo.dev/guides/using-sentry/)
