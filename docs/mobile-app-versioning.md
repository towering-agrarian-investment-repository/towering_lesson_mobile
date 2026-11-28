# Mobile app versioning

This guide describes the implemented member app. Sources:
[update service](../src/lib/update/app-update.ts),
[update hook](../src/lib/update/use-app-update.ts),
[request headers](../src/lib/client/app-request-headers.ts), and
[API client](../src/lib/client/api-client.ts).

## Compatibility headers

Normal API requests and the version check send:

```http
X-App-Client: MEMBER
X-App-Platform: android
X-App-Version: 1.0.0
```

The helper derives the platform from React Native (`android` or `ios`) and the
version from `Constants.expoConfig.version`. Keep the version in `app.json` rather
than hardcoding it in a screen. Presigned storage uploads do not use this API
client or its app-identification headers.

## Version endpoint

`GET /api/v1/app/version` defaults to the API base URL plus `/app/version`;
`EXPO_PUBLIC_APP_VERSION_URL` can override it. The client reads the standard
`ApiResponse` envelope's `data` object:

```json
{
    "minimumSupportedVersion": "1.0.0",
    "latestVersion": "1.1.0",
    "message": "A newer version of the app is available.",
    "androidStoreUrl": "https://play.google.com/store/apps/details?id=com.toweringinvest.happygolfmobile",
    "iosStoreUrl": "https://apps.apple.com/app/YOUR_APP_ID"
}
```

Configure real platform store URLs. The iOS value above is a placeholder.

The installed version is compared numerically by major, minor, and patch:

| Condition                                   | App behavior                                        |
| ------------------------------------------- | --------------------------------------------------- |
| Installed below minimum                     | Blocking `AppUpdateGate`                            |
| Installed meets minimum but is below latest | Optional update action in Profile and its tab badge |
| Installed meets both                        | Continue normally                                   |

The message alone does not force an update. An installed version equal to the
minimum is supported.

## Lifecycle and failures

- `AppUpdateProvider` starts the check independently of initial navigation. Auth,
  language, theme, and welcome readiness still participate in startup guards.
- `fetchAppUpdateState()` shares one cached promise for the module lifetime,
  including an unsuccessful result. There is no automatic foreground/resume check.
- The request has a two-second deadline and fails open for network, non-success,
  or malformed responses. A failure does not create a mandatory-update state.
- The gate's explicit Check Again uses `refreshAppUpdateState()` to replace the
  cached check and blocks duplicate taps.
- `EXPO_PUBLIC_SKIP_APP_UPDATE_CHECK=true` skips the startup check only in development.
- Normal API calls send headers without first requesting the version endpoint.
  A `426 Upgrade Required` notifies the global update subscriber. Supplied update
  configuration is used directly; otherwise the cached check is cleared and fetched
  again. The existing hook retains a confirmed mandatory update during a concurrent
  startup check.

## Native versions and EAS Update

`app.json` uses `runtimeVersion.policy: "appVersion"`. The `development`, `preview`,
and `production` profiles select their corresponding EAS environments and channels;
`development-simulator` inherits development. Production uses remote build-number
management and automatic increments from `eas.json`.

A compatible JavaScript update does not change the installed native app version.
Native dependency, configuration, resource, or runtime changes need a new build.
Use [Build and run](build-and-run.md) for builds and
[Production environment](production-environment.md) for environment and OTA commands.

## Device checks

- Confirm startup sends one shared version request and ordinary API calls send
  the headers without additional checks.
- Check the correct client, platform, and installed version on both platforms.
- Test versions equal to minimum, below minimum, and between minimum and latest.
- Verify optional update UI, mandatory gating, repeated Check Again taps, and real
  store destinations.
- Trigger concurrent API `426` responses and confirm one global update UI.
- Verify offline startup fails open, and presigned uploads retain their own headers.

Record device results in the release run using [the QA checklist](qa-checklist.md).
