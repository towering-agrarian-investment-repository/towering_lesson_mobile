# Mobile App Versioning and Update Checks

This document defines the standard version-checking flow for mobile apps that use the Golf Lesson System API.

The version feature has two separate responsibilities:

1. Check the app version during app startup or resume and decide whether to show an update prompt.
2. Send app-identification headers with every mobile API request so the backend can validate compatibility.

The version endpoint must not be called before every normal API request. The backend validates the version on every API request using the headers.

## API contract

### Version check

```http
GET /api/v1/app/version
```

The request must include the app identity headers:

```http
X-App-Client: MEMBER
X-App-Platform: android
X-App-Version: 1.0.0
```

For the coach app, use:

```http
X-App-Client: COACH
```

`X-App-Platform` must always be either `android` or `ios`.

### Version response

Example:

```json
{
  "minimumSupportedVersion": "1.0.0",
  "latestVersion": "1.1.0",
  "message": "A newer version of the app is available.",
  "androidStoreUrl": "https://play.google.com/store/apps/details?id=com.example.app",
  "iosStoreUrl": "https://apps.apple.com/app/example"
}
```

Fields:

- `minimumSupportedVersion`: the oldest version allowed to use the app.
- `latestVersion`: the newest version currently published.
- `message`: text for an update prompt; it does not trigger an update by itself.
- `androidStoreUrl`: Android store destination.
- `iosStoreUrl`: iOS store destination.

## Standard request flow

```text
App launches or resumes
        |
        v
GET /api/v1/app/version
        |
        v
Compare installed version with minimum/latest versions
        |
        +--> installed < minimum: show mandatory update dialog
        |
        +--> installed < latest: show optional update dialog
        |
        +--> otherwise: continue normally

Every normal API request
        |
        +--> send X-App-Client
        +--> send X-App-Platform
        +--> send X-App-Version
        |
        v
Backend validates the request version
        |
        +--> 2xx: continue
        +--> 426 Upgrade Required: show mandatory update dialog globally
```

## When to call the version endpoint

Call it from the app lifecycle, not from the shared API request function.

Recommended options:

- Once on app launch.
- Once on app launch and when the app returns to the foreground.
- Cache the result for the current session or for a limited period such as one day.

The check should be deduplicated. If multiple screens start at the same time, they should share the same in-flight promise instead of sending multiple version requests.

Example TypeScript pattern:

```ts
let versionCheckPromise: Promise<AppVersionState | null> | null = null;

export function checkAppVersionOnce() {
  if (!versionCheckPromise) {
    versionCheckPromise = requestAppVersion()
      .catch(() => null);
  }

  return versionCheckPromise;
}
```

If resume checks are required, clear the cache only according to an explicit policy, for example after one day. Do not clear it for every API request.

## Headers on every normal API request

Create the headers in one shared helper so every API request uses the same values:

```ts
type AppClient = "MEMBER" | "COACH";
type AppPlatform = "android" | "ios";

const APP_CLIENT: AppClient = "MEMBER";
const APP_VERSION = "1.0.0";

function getAppPlatform(): AppPlatform {
  return Platform.OS === "ios" ? "ios" : "android";
}

function getAppHeaders(client: AppClient = APP_CLIENT) {
  return {
    "X-App-Client": client,
    "X-App-Platform": getAppPlatform(),
    "X-App-Version": APP_VERSION,
  };
}
```

The shared API client should merge these headers into every request:

```ts
const headers = new Headers(options.headers);

for (const [name, value] of Object.entries(getAppHeaders())) {
  headers.set(name, value);
}

const response = await fetch(url, {
  ...options,
  headers,
});
```

Set the app headers after caller-provided headers so feature code cannot accidentally send a stale or invalid app version.

## Handling `426 Upgrade Required`

The shared API client must handle `426` globally. This covers the case where the minimum supported version changes while the app is already running.

```ts
if (response.status === 426) {
  const payload = await readResponseBody(response);
  notifyUpdateRequired(payload);
}
```

The global handler should:

- Store the update configuration if it is present.
- Display one mandatory update dialog.
- Prevent duplicate dialogs when several requests return `426`.
- Provide a button that opens the correct Android or iOS store URL.
- Avoid retrying the failed request endlessly.

The same handling can support a structured error such as:

```json
{
  "code": "UPDATE_REQUIRED",
  "minimumSupportedVersion": "1.1.0",
  "latestVersion": "1.1.0",
  "message": "Please update the app to continue."
}
```

## Update decision rules

Use semantic numeric comparison, not string comparison.

```ts
installed < minimumSupportedVersion
```

means a mandatory update.

```ts
installed < latestVersion
```

means an optional update.

The backend message alone must not trigger a dialog. For example, this response does not require an update when the installed app is `1.0.0`:

```json
{
  "minimumSupportedVersion": "1.0.0",
  "latestVersion": "1.0.0",
  "message": "Please update the app to continue."
}
```

The backend should return a higher version when an update is actually required:

```json
{
  "minimumSupportedVersion": "1.1.0",
  "latestVersion": "1.1.0",
  "message": "Please update the app to continue."
}
```

## Failure behavior

The version check should normally fail open when the user is offline or the endpoint is unavailable. The user can continue using the app, while normal API requests may fail normally.

The exception is a successful `426 Upgrade Required` response from the backend. That response is authoritative and should show the mandatory update flow.

## Important implementation rules

- Do not call `/api/v1/app/version` from inside the normal API request function.
- Do send the three app headers from the normal API request function.
- Do not add app headers to presigned object-storage uploads unless the storage signature explicitly includes them.
- Keep the app client value fixed per app: `MEMBER` or `COACH`.
- Derive the platform from the native runtime and restrict it to `android` or `ios`.
- Keep the app version in the app configuration/package metadata rather than duplicating it across screens.
- Deduplicate update dialogs and version checks.
- Do not treat the response `message` as proof that an update is required.

## Testing checklist

Verify the following for each app:

- Startup sends one version request.
- Concurrent startup calls produce one version request.
- Normal API calls do not send additional version requests.
- Every normal API request includes the correct client, platform, and version headers.
- Android sends `X-App-Platform: android`.
- iOS sends `X-App-Platform: ios`.
- Installed version equal to minimum does not force an update.
- Installed version below minimum shows a mandatory update dialog.
- Installed version below latest shows an optional update dialog.
- A `426` response from any API endpoint shows the mandatory update dialog.
- Several simultaneous `426` responses show only one dialog.
- Offline version-check failure does not crash the app.
- Presigned uploads continue to work.
