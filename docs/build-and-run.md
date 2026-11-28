# Build and run the mobile app

Run these commands from the project root. For direct Android builds on Windows,
use the short checkout described below. This project uses pnpm. `eas build`
builds on Expo's servers and uses the EAS build quota; `pnpm exec expo run:*`
compiles and installs on your computer. Both development methods create a
development client, not an app-store release. Install an EAS build after it
finishes using its build page or downloaded artifact.

## First setup

Use Node LTS meeting the project's `>=22.13.0` requirement and pnpm `10.26.0`.
Install with the committed lockfile:

```sh
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` if it does not already exist. Start the API and auth
service in their own backend projects; this repository contains only the mobile app.
Configure their reachable URLs using the backend connection section below.

The app needs an installed development client because it uses native modules.
After installing one, run `pnpm start --dev-client` for day-to-day JavaScript and UI
changes. See [README checks](../README.md#checks) and [device QA](qa-checklist.md)
for verification.

## Quick command picker

| Goal                                                       | Command                                                    | Where it runs                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Android development APK from EAS                           | `eas build --platform android --profile development`       | Any computer                                           |
| iOS development build for an iPhone from EAS               | `eas build --platform ios --profile development`           | Any computer; iOS signing required                     |
| iOS development build for a simulator from EAS             | `eas build --platform ios --profile development-simulator` | Any computer; installs only on an iOS simulator        |
| Android development app directly                           | `pnpm exec expo run:android --device`                      | Computer with Android SDK and connected phone/emulator |
| iOS development app directly                               | `pnpm exec expo run:ios --device`                          | Mac with Xcode and connected iPhone                    |
| iOS simulator directly                                     | `pnpm exec expo run:ios`                                   | Mac with Xcode and an iOS simulator                    |
| JavaScript or UI changes with an installed development app | `pnpm start --dev-client`                                  | Computer serving Metro to the app                      |

`--device` selects a connected device. For an Android emulator, omit it or use
it to choose an emulator. EAS iOS simulator builds cannot be installed on an
iPhone. Windows cannot compile an iOS app directly; use EAS or a Mac.

## EAS cloud builds

Use the checkout containing your latest source. Sign in once with `eas login` if needed.

Android phone or emulator:

```sh
eas build --platform android --profile development
```

iPhone:

```sh
eas build --platform ios --profile development
```

iOS simulator:

```sh
eas build --platform ios --profile development-simulator
```

The profiles above come from [`eas.json`](../eas.json). The Android development
profile produces an APK. The iOS simulator profile inherits development
settings and sets `ios.simulator: true`. Each new EAS build uses build quota.

For a store release, use the production profile instead. A production build is
separate from submitting it to Google Play or App Store Connect:

```sh
eas build --platform android --profile production
eas build --platform ios --profile production
```

Check the production environment before running these commands; see
[Production environment](production-environment.md).

## Direct local builds

### Android on Windows

This project's native C++ build exceeded Windows' 260-character filename limit
in `D:\golf-lesson-system-mobile`. Keep the project at `D:\g` and install with
pnpm's hoisted dependency layout, persisted in the project's `.npmrc`. In Git
Bash, run this after cloning or when native dependencies change:

```sh
cd /d/g
pnpm install --frozen-lockfile
pnpm exec expo run:android --device
```

If an existing install uses the isolated layout, stop Metro and the Gradle
daemon, then install into an empty `node_modules`. A forced reinstall over the
old tree can leave junctions into `.pnpm` even when `.modules.yaml` reports
`hoisted`. Preserve that old tree as a backup. In PowerShell:

```powershell
cd D:\g
.\android\gradlew.bat --stop
New-Item -ItemType Directory -Path 'D:\g\.expo\before-hoisted-install' -Force | Out-Null
Move-Item -LiteralPath 'D:\g\node_modules' -Destination 'D:\g\.expo\before-hoisted-install\node_modules'
pnpm install --frozen-lockfile --node-linker=hoisted
node -p "require.resolve('expo-updates/package.json')"
Remove-Item -LiteralPath 'D:\g\android\build','D:\g\android\app\build','D:\g\android\app\.cxx' -Recurse -Force -ErrorAction SilentlyContinue
pnpm exec expo run:android --device --no-build-cache
```

The resolved path must be `D:\g\node_modules\expo-updates\package.json`, with no
`.pnpm` segment, before rebuilding. The backup destination must not already
contain a `node_modules` tree; do not merge installations. The removed Android
directories contain only generated build outputs and stale autolinking paths.

Do not delete `pnpm-lock.yaml`. The fresh install uses the same locked versions.
If Windows reports `EPERM`, close processes using the
project's dependencies before retrying. A terminal environment override of
`npm_config_node_linker` takes precedence over `.npmrc`; remove it or set it to
`hoisted`.

For JavaScript, TypeScript, styling, or asset changes,
use the already installed development app. No native build is needed:

```sh
cd /d/g
pnpm start --dev-client
```

Edit source and run Metro in this same checkout. Rebuild after changing a native
dependency or app config.

On macOS or Linux with an Android SDK, build directly from the working
checkout:

```sh
pnpm exec expo run:android --device
```

### iOS on a Mac

With Xcode installed, build for the iOS simulator:

```sh
pnpm exec expo run:ios
```

For a connected iPhone with signing configured:

```sh
pnpm exec expo run:ios --device
```

After installing either development app, run `pnpm start --dev-client` for
JavaScript and UI changes. Rebuild when a native dependency or app config
changes.

## Backend connections and environment

The `development` EAS profile uses local URLs, `preview` uses staging, and
`production` uses production. Local defaults in `.env.example` are:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://localhost:8082/api/v1
EXPO_PUBLIC_AUTH_BASE_URL=http://localhost:3002/api/member/auth
EXPO_PUBLIC_SENTRY_ENVIRONMENT=local
```

Metro uses `.env` and `.env.local` from the checkout running it; `.env.local`
overrides `.env`. Preserve existing private values and fully reload the app after
changing public variables. The version endpoint defaults to the selected API URL
plus `/app/version`; keep any `EXPO_PUBLIC_APP_VERSION_URL` override on the same
backend. `EXPO_PUBLIC_SENTRY_DSN` is optional; unset means no crash reporting.

### Android emulator or USB phone

With USB debugging enabled, map the backend ports to your computer:

```sh
adb reverse tcp:8082 tcp:8082
adb reverse tcp:3002 tcp:3002
```

Repeat after reconnecting or restarting the device. With multiple devices, use
`adb -s <device-serial> reverse ...`. Alternatively, the standard Android emulator
can use `10.0.2.2` in both URLs instead of localhost without port forwarding.

### iOS simulator or phone over Wi-Fi

An iOS simulator on the backend's Mac can use localhost. For a physical phone,
set the computer's LAN IP in `.env.local`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:8082/api/v1
EXPO_PUBLIC_AUTH_BASE_URL=http://YOUR_LOCAL_IP:3002/api/member/auth
EXPO_PUBLIC_SENTRY_ENVIRONMENT=local
```

Use the same network, let the services listen on a reachable interface such as
`0.0.0.0`, allow both ports through the firewall, and configure the auth service
to accept the development app's origin. A Metro tunnel exposes only the bundler.
Use a separate HTTPS backend tunnel when LAN access is unavailable.

### Staging with a development client

For a standalone staging build:

```sh
eas build --profile preview --platform all
```

For Metro, copy the preview environment's public API, auth, optional version URL,
and Sentry values into `.env.local`, then fully reload. Restore local values or
remove only those overrides to return to localhost.

EAS profile `env` values apply to builds. EAS Update with `--environment` uses
dashboard variables, so the local URLs in `eas.json` do not configure updates.
Keep the selected dashboard environment consistent before publishing. See
[Production environment](production-environment.md) for release variables.

## References

- [Expo local app development](https://docs.expo.dev/guides/local-app-development/)
- [Expo EAS build profiles](https://docs.expo.dev/build/eas-json/)
- [pnpm node linker settings](https://pnpm.io/10.x/settings#nodelinker)
