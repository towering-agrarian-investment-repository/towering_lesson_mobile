# Local development

Use a local backend for everyday development. The `development` EAS build
profile specifies local URLs, `preview` uses the staging environment, and
`production` uses the production environment.

## Start locally

Start the API on port `8082` and the auth service on port `3002` in their backend
projects. This repository contains the mobile app, not those services.

Copy `.env.example` to `.env` if `.env` does not already exist. The defaults are:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://localhost:8082/api/v1
EXPO_PUBLIC_AUTH_BASE_URL=http://localhost:3002/api/member/auth
EXPO_PUBLIC_SENTRY_ENVIRONMENT=local
```

Then start Metro and open your installed development client:

```sh
npx expo start --dev-client
```

Expo uses `.env` and `.env.local` when serving the JavaScript bundle locally.
Values in `.env.local` override `.env`; preserve any existing private variables
when editing it. Fully reload the app after changing public variables. The app's
version endpoint defaults to the selected API URL plus `/app/version`; if you
have an `EXPO_PUBLIC_APP_VERSION_URL` override, update it for the same backend.

## Android emulator or USB-connected Android phone

With USB debugging enabled and the device connected, forward the two backend
ports to your computer:

```sh
adb reverse tcp:8082 tcp:8082
adb reverse tcp:3002 tcp:3002
```

These mappings let the app's localhost URLs reach your computer. Repeat them
after reconnecting or restarting the device. If multiple devices are connected,
use `adb -s <device-serial> reverse ...` for each command.

Alternatively, the standard Android emulator can reach the computer through
`10.0.2.2`. Set both URLs in `.env.local` to use that address instead of localhost
if you prefer not to use port forwarding.

## iOS simulator and physical phones over Wi-Fi

An iOS simulator on the backend's Mac can use localhost. A physical phone's
localhost points to the phone itself, so use your computer's LAN IP in
`.env.local` for a Wi-Fi connection:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8082/api/v1
EXPO_PUBLIC_AUTH_BASE_URL=http://YOUR_LOCAL_IP:3002/api/member/auth
EXPO_PUBLIC_SENTRY_ENVIRONMENT=local
```

Keep the phone and computer on the same network. The backend services must
listen on a reachable interface (for example, `0.0.0.0`), and your firewall must
allow the two ports. The auth service must accept the development app's origin.
An Expo Metro tunnel forwards the bundler; it does not expose these backend
services. Use a separate HTTPS backend tunnel if the phone cannot reach your LAN.

## Test staging

For a standalone staging build, use:

```sh
eas build --profile preview --platform all
```

To use staging while running the development client, copy the preview
environment's public API, auth, app-version (if configured), and Sentry values
from the Expo dashboard into `.env.local`, then fully reload the app. Restore
local values in `.env.local` or remove only those overrides to return to localhost.

EAS Build profile values apply to builds; Metro uses your local environment.
EAS Update with `--environment` uses dashboard environment variables, so the
development values in `eas.json` do not configure an update. Keep dashboard
development values consistent before publishing an update to that channel.

## References

- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS build configuration](https://docs.expo.dev/build/eas-json/)
- [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Android emulator networking](https://developer.android.com/studio/run/emulator-networking)
- [Android Debug Bridge](https://developer.android.com/tools/adb)
