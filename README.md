# HappyGolf GO — member mobile app

Expo React Native app (Android + iOS) for golf members: reservations, tickets,
lesson logs, homework, activity sharing, and notifications.

## Requirements

- Node `>=22.13.0` (Expo's requirement, recorded in `AGENTS.md`; manage with nvm)
- pnpm `10.26.0` (pinned in `package.json` and `eas.json`)
- Xcode for iOS builds, Android Studio for Android builds

Use pnpm only. Do not add npm or Yarn lockfiles.

## Setup

```bash
pnpm install
cp .env.example .env
```

`.env` must define:

| Variable                         | Required | Notes                                                                                          |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL`       | yes      | Member API root, e.g. `http://localhost:8082/api/v1`                                           |
| `EXPO_PUBLIC_AUTH_BASE_URL`      | yes      | Better Auth base URL, e.g. `http://localhost:3002/api/member/auth`                             |
| `EXPO_PUBLIC_APP_VERSION_URL`    | no       | Defaults to `${EXPO_PUBLIC_API_BASE_URL}/app/version`                                          |
| `EXPO_PUBLIC_SENTRY_ENVIRONMENT` | no       | Defaults to `local`                                                                            |
| `EXPO_PUBLIC_SENTRY_DSN`         | no       | No fallback: unset disables crash reporting. Set it in the EAS preview/production environments |

The app uses native modules (`@expo/ui`, notifications, video, secure store), so
**it needs a development build. Expo Go cannot run it.**

```bash
# First build on a device or simulator (creates the dev client)
pnpm android
pnpm ios

# Day-to-day development
pnpm start --dev-client
```

EAS profiles live in `eas.json` (`development`, `development-simulator`,
`preview`, `production`). See `docs/build-and-run.md` for the full build and
credential workflow.

## Checks

Run these before opening a pull request; CI runs the same four:

```bash
pnpm exec prettier --check .
pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm test
```

Format the codebase with `pnpm format` (Prettier, 4-space, 120 columns).
Prettier and ESLint are wired together through `eslint-config-prettier`, so
ESLint never fights the formatter.

`pnpm test` runs `scripts/startup-compat.test.cjs` plus every
`scripts/tests/*.test.cjs`. These are fast Node tests for pure logic, query
invariants, and screen wiring. They are not a substitute for device testing:
runtime and visual behavior is verified manually with `docs/qa-checklist.md`.

Optional: `pnpm dlx expo-doctor` for config/dependency drift, and
`pnpm exec expo export --platform android --platform ios --output-dir dist` to
verify both bundles compile.

## Project layout

```text
src/app/            Expo Router routes (tabs, stacks, modals)
src/components/     Feature components (golf domain)
src/design-system/  Theme, tokens, Screen, buttons, lists, charts
src/lib/hook/       TanStack Query hooks and app hooks
src/lib/client/     API client, JWT cache, request headers
src/service/        Typed API service functions
src/types/          API and domain types
src/i18n/           en, ko, ja, zh, km resources
scripts/            Node checks and QA helpers
docs/               Feature reference, builds, release operations, and device QA
```

Screens render state; hooks own query keys and caching; services call the API.
Server data is read straight from React Query, never copied into local state.

## Documentation

Start here, then use the guide for the task:

| Guide                                                    | Purpose                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| [Project rules](AGENTS.md)                               | Architecture, UI, and data rules for contributors                 |
| [App reference](docs/mobile-app-reference-guide.md)      | Feature map, current API behavior, and implementation patterns    |
| [Build and run](docs/build-and-run.md)                   | Setup, local backend connections, development clients, and builds |
| [Design system](design-system.md)                        | Visual tokens, components, theme preferences, and troubleshooting |
| [Native UI gotchas](docs/native-ui-gotchas.md)           | Native control layout, keyboard, and gesture pitfalls             |
| [QA checklist](docs/qa-checklist.md)                     | Manual device checks and share-card fixtures                      |
| [Versioning](docs/mobile-app-versioning.md)              | Current app-version headers and required/optional update behavior |
| [Production environment](docs/production-environment.md) | EAS environment variables and release commands                    |

## License

See `LICENSE`.
